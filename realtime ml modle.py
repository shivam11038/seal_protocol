import os
import sys
import time
import warnings
from datetime import datetime

import joblib
import mysql.connector
from mysql.connector import Error
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest, RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

warnings.filterwarnings("ignore")

# ============================================================
# ANTARCTICA DIGITAL TWIN - REFINED ML PIPELINE
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

INPUT_FILE = os.path.join(BASE_DIR, "Hourly_antarctic_telemetry.csv")
OUTPUT_FILE = os.path.join(BASE_DIR, "Antarctic Digital Twin Prediction.csv")

ENERGY_MODEL_FILE = os.path.join(BASE_DIR, "energy_model.joblib")
ANOMALY_MODEL_FILE = os.path.join(BASE_DIR, "anomaly_model.joblib")

# -------------------------
# MySQL configuration
# -------------------------
MYSQL_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "12345",
    "database": "BHOSDI",
}

# -------------------------
# Station / planning settings
# -------------------------
BATTERY_CAPACITY_KWH = 1000.0
PLANNING_DAYS = 30
FUEL_RESERVE = 0.20

USE_DEMO_CURRENT_CONDITIONS = True
DEMO_STATION_ID = "MAITRI"

DEMO_CURRENT_CONDITIONS = {
    "Temperature": -25.0,
    "Wind_Speed": 30.0,
    "Solar_Radiation": 150.0,
    "Occupancy": 25.0,
    "Battery_Level": 65.0,
    "Fuel_Level": 500.0,
}

# Features selected for prediction (Generator_Load excluded to avoid target leakage)
MODEL_FEATURES = [
    "Temperature",
    "Wind_Speed",
    "Solar_Radiation",
    "Occupancy",
    "Battery_Level",
    "Fuel_Level",
    "Station_Code",
]

# Real-time CSV polling configuration
RUN_REALTIME_POLLER = True
REALTIME_POLL_INTERVAL_SECONDS = 3.0


# ============================================================
# 1. HELPERS
# ============================================================

def print_header(title):
    print("\n" + "=" * 60)
    print(title)
    print("=" * 60)


def require_columns(dataframe, columns, name="dataset"):
    missing = [c for c in columns if c not in dataframe.columns]
    if missing:
        raise ValueError(
            f"Missing required columns in {name}: {missing}\n"
            f"Available columns: {dataframe.columns.tolist()}"
        )


def clean_dataframe(raw_df):
    """Normalize column names and enforce clean numeric types."""
    column_mapping = {
        "Temperature": "temperature_celsius",
        "Wind_Speed": "wind_speed_knots",
        "Pressure": "pressure_hpa",
        "Humidity": "humidity_percent",
        "Solar_Radiation": "solar_radiation_wm2",
        "Generator_Load": "generator_load_percent",
        "Energy_consumption": "energy_consumed_kwh",
        "Battery_Level": "battery_level_percent",
        "Fuel_Level": "fuel_level_liters",
        "Fuel_Burn_Rate": "fuel_burn_rate_lph",
        "Food_Inventory": "food_inventory_kg",
        "Station_Occupancy": "station_occupancy",
        "Occupancy": "station_occupancy",
    }

    df_cleaned = raw_df.rename(columns=column_mapping)

    required_columns = [
        "temperature_celsius",
        "wind_speed_knots",
        "pressure_hpa",
        "humidity_percent",
        "solar_radiation_wm2",
        "generator_load_percent",
        "energy_consumed_kwh",
        "battery_level_percent",
        "fuel_level_liters",
        "fuel_burn_rate_lph",
        "food_inventory_kg",
        "station_occupancy",
    ]

    require_columns(df_cleaned, required_columns)

    df_cleaned = df_cleaned.dropna(how="all").copy()

    for column in required_columns:
        df_cleaned[column] = pd.to_numeric(df_cleaned[column], errors="coerce")

    df_cleaned = df_cleaned.dropna(subset=required_columns).copy()

    if "station_id" not in df_cleaned.columns:
        raise ValueError("station_id is required so the model can differentiate MAITRI and BHARATI.")

    df_cleaned["station_id"] = (
        df_cleaned["station_id"]
        .astype(str)
        .str.strip()
        .str.upper()
    )

    valid_stations = {"MAITRI", "BHARATI"}
    unknown_stations = sorted(set(df_cleaned["station_id"]) - valid_stations)
    if unknown_stations:
        raise ValueError(
            f"Unknown station_id values found: {unknown_stations}. "
            f"Use only: {sorted(valid_stations)}"
        )

    if "timestamp" in df_cleaned.columns:
        df_cleaned["timestamp"] = pd.to_datetime(df_cleaned["timestamp"], errors="coerce")
        df_cleaned = df_cleaned.sort_values("timestamp").reset_index(drop=True)

    df_cleaned["Station_Code"] = df_cleaned["station_id"].map({
        "MAITRI": 0,
        "BHARATI": 1,
    }).astype(int)

    return df_cleaned


def extract_features(df_source):
    """Extract model training/inference features without data leakage."""
    return pd.DataFrame({
        "Temperature": df_source["temperature_celsius"],
        "Wind_Speed": df_source["wind_speed_knots"],
        "Solar_Radiation": df_source["solar_radiation_wm2"],
        "Occupancy": df_source["station_occupancy"],
        "Battery_Level": df_source["battery_level_percent"],
        "Fuel_Level": df_source["fuel_level_liters"],
        "Station_Code": df_source["Station_Code"],
    })


# ============================================================
# 2. LOAD DATA
# ============================================================

print_header("ANTARCTICA DIGITAL TWIN - DATA LOADING")

try:
    df_raw = pd.read_csv(INPUT_FILE)
except FileNotFoundError:
    raise SystemExit(
        f"\nERROR: {os.path.basename(INPUT_FILE)} was not found.\n"
        f"Place Hourly_antarctic_telemetry.csv in:\n{BASE_DIR}"
    )

print("Dataset loaded successfully!")
print(f"Input file: {INPUT_FILE}")
print(f"Records: {len(df_raw)}")

df = clean_dataframe(df_raw)
print(f"Cleaned dataset records: {len(df)}")
print("\nStation distribution:")
print(df["station_id"].value_counts().to_string())


# ============================================================
# 3. PREPARE ML FEATURES
# ============================================================

print_header("PREPARING ML FEATURES")
model_df = extract_features(df)
target = df["energy_consumed_kwh"]

print("Features used (Leakage-Free):")
for feature in MODEL_FEATURES:
    print(f"  - {feature}")
print("\nTarget: energy_consumed_kwh")


# ============================================================
# 4. TIME-AWARE TRAIN / TEST SPLIT & SERIALIZATION
# ============================================================

force_retrain = "--retrain" in sys.argv
models_exist = os.path.exists(ENERGY_MODEL_FILE) and os.path.exists(ANOMALY_MODEL_FILE)

if models_exist and not force_retrain:
    print_header("LOADING SERIALIZED MODELS")
    energy_model = joblib.load(ENERGY_MODEL_FILE)
    anomaly_model = joblib.load(ANOMALY_MODEL_FILE)
    print(f"Loaded: {ENERGY_MODEL_FILE}")
    print(f"Loaded: {ANOMALY_MODEL_FILE}")
else:
    print_header("MODEL TRAINING & SERIALIZATION")
    split_index = int(len(model_df) * 0.80)
    if split_index <= 0 or split_index >= len(model_df):
        raise ValueError("Dataset is too small for an 80/20 train-test split.")

    X_train = model_df.iloc[:split_index]
    X_test = model_df.iloc[split_index:]
    y_train = target.iloc[:split_index]
    y_test = target.iloc[split_index:]

    print(f"Training records: {len(X_train)}")
    print(f"Testing records : {len(X_test)}")

    # Energy model
    energy_model = RandomForestRegressor(
        n_estimators=200,
        max_depth=15,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1,
    )
    energy_model.fit(X_train, y_train)

    y_pred = energy_model.predict(X_test)
    print("\nEnergy Model Performance")
    print("-" * 40)
    print(f"MAE  : {mean_absolute_error(y_test, y_pred):.4f} kWh")
    print(f"RMSE : {np.sqrt(mean_squared_error(y_test, y_pred)):.4f} kWh")
    print(f"R²   : {r2_score(y_test, y_pred):.4f}")

    # Anomaly detection model (contamination='auto' to avoid forced false positive spikes)
    anomaly_model = IsolationForest(
        n_estimators=200,
        contamination="auto",
        random_state=42,
        n_jobs=-1,
    )
    anomaly_model.fit(model_df)

    joblib.dump(energy_model, ENERGY_MODEL_FILE)
    joblib.dump(anomaly_model, ANOMALY_MODEL_FILE)
    print("\nTrained models saved to disk via joblib.")


# ============================================================
# 5. DATA INTERVAL & HISTORICAL BURN RATES
# ============================================================

interval_hours = 5 / 60
if "timestamp" in df.columns and df["timestamp"].notna().sum() >= 2:
    time_diff_hours = (
        df["timestamp"]
        .diff()
        .dt.total_seconds()
        .div(3600)
        .dropna()
    )
    positive_intervals = time_diff_hours[time_diff_hours > 0]
    if not positive_intervals.empty:
        interval_hours = float(positive_intervals.median())

print(f"\nDetected data interval: {interval_hours * 60:.2f} minutes")

# Station-specific historical burn rate lookup
station_burn_medians = {
    station: float(group["fuel_burn_rate_lph"].dropna().median())
    for station, group in df.groupby("station_id")
    if not group["fuel_burn_rate_lph"].dropna().empty
}
global_median_fuel = float(df["fuel_burn_rate_lph"].dropna().median()) if not df["fuel_burn_rate_lph"].dropna().empty else 5.0


# ============================================================
# 6. DIGITAL TWIN CALCULATION LOGIC
# ============================================================

def compute_station_state(row_dict, energy_model, anomaly_model, interval_hours, station_burn_medians, global_median_fuel):
    station_id = row_dict["station_id"]
    station_code = 0 if station_id == "MAITRI" else 1

    feature_frame = pd.DataFrame([{
        "Temperature": row_dict["temperature_celsius"],
        "Wind_Speed": row_dict["wind_speed_knots"],
        "Solar_Radiation": row_dict["solar_radiation_wm2"],
        "Occupancy": row_dict["station_occupancy"],
        "Battery_Level": row_dict["battery_level_percent"],
        "Fuel_Level": row_dict["fuel_level_liters"],
        "Station_Code": station_code,
    }])

    predicted_energy = float(energy_model.predict(feature_frame)[0])
    anomaly_result = int(anomaly_model.predict(feature_frame)[0])
    anomaly_status = "ANOMALY" if anomaly_result == -1 else "NORMAL"

    battery_level_percent = float(row_dict["battery_level_percent"])
    current_battery = (battery_level_percent / 100.0) * BATTERY_CAPACITY_KWH
    energy_per_day = (predicted_energy / interval_hours * 24) if interval_hours > 0 else 0.0
    energy_endurance = (current_battery / energy_per_day) if energy_per_day > 0 else float("inf")

    if battery_level_percent <= 20:
        energy_status = "CRITICAL"
    elif battery_level_percent <= 40:
        energy_status = "WARNING"
    else:
        energy_status = "NORMAL"

    burn_rate = station_burn_medians.get(station_id, global_median_fuel)
    current_fuel = float(row_dict["fuel_level_liters"])
    fuel_per_day = burn_rate * 24.0 if burn_rate > 0 else 0.0
    fuel_endurance = (current_fuel / fuel_per_day) if fuel_per_day > 0 else float("inf")

    if fuel_endurance < 3:
        fuel_status = "CRITICAL"
    elif fuel_endurance < 7:
        fuel_status = "WARNING"
    else:
        fuel_status = "NORMAL"

    risk_score = 0
    if fuel_endurance < 7:
        risk_score += 30
    if energy_endurance < 5:
        risk_score += 30
    if anomaly_status == "ANOMALY":
        risk_score += 40
    risk_score = min(risk_score, 100)

    if risk_score >= 70:
        risk_status = "HIGH RISK"
    elif risk_score >= 40:
        risk_status = "MEDIUM RISK"
    else:
        risk_status = "LOW RISK"

    required_fuel = PLANNING_DAYS * fuel_per_day * (1 + FUEL_RESERVE)
    additional_fuel = max(0.0, required_fuel - current_fuel)

    return {
        "predicted_energy_kwh": predicted_energy,
        "anomaly_prediction": anomaly_result,
        "anomaly_status": anomaly_status,
        "energy_remaining_kwh": current_battery,
        "energy_consumption_per_day_kwh": energy_per_day,
        "energy_endurance_days": energy_endurance,
        "fuel_consumption_per_day_litres": fuel_per_day,
        "fuel_endurance_days": fuel_endurance,
        "risk_score": risk_score,
        "risk_status": risk_status,
        "recommended_fuel_litres": required_fuel,
        "additional_fuel_required_litres": additional_fuel,
        "energy_status": energy_status,
        "fuel_status": fuel_status,
    }


# ============================================================
# 7. BATCH ENRICHMENT & CSV EXPORT
# ============================================================

print_header("RUNNING BATCH PREDICTIONS")

all_calculated = [
    compute_station_state(
        row.to_dict(),
        energy_model,
        anomaly_model,
        interval_hours,
        station_burn_medians,
        global_median_fuel
    )
    for _, row in df.iterrows()
]

calc_df = pd.DataFrame(all_calculated)
for col in calc_df.columns:
    df[col] = calc_df[col].values

df.to_csv(OUTPUT_FILE, index=False)
print(f"Prediction file saved successfully: {OUTPUT_FILE}")


# ============================================================
# 8. MYSQL DATABASE - UPLOAD ALL PREDICTIONS
# ============================================================

print_header("MYSQL DATABASE - BATCH UPLOAD")

mysql_columns = [
    "timestamp",
    "station_id",
    "temperature_celsius",
    "wind_speed_knots",
    "pressure_hpa",
    "humidity_percent",
    "solar_radiation_wm2",
    "generator_load_percent",
    "energy_consumed_kwh",
    "battery_level_percent",
    "fuel_level_liters",
    "fuel_burn_rate_lph",
    "food_inventory_kg",
    "station_occupancy",
    "predicted_energy_kwh",
    "anomaly_prediction",
    "anomaly_status",
    "energy_remaining_kwh",
    "energy_consumption_per_day_kwh",
    "energy_endurance_days",
    "fuel_consumption_per_day_litres",
    "fuel_endurance_days",
    "risk_score",
    "risk_status",
    "recommended_fuel_litres",
    "additional_fuel_required_litres",
    "energy_status",
    "fuel_status"
]

try:
    connection = mysql.connector.connect(**MYSQL_CONFIG)
    cursor = connection.cursor()
    print("Connected to MySQL using unified configuration!")

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS predictions (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            timestamp DATETIME,
            station_id VARCHAR(20),
            temperature_celsius DOUBLE,
            wind_speed_knots DOUBLE,
            pressure_hpa DOUBLE,
            humidity_percent DOUBLE,
            solar_radiation_wm2 DOUBLE,
            generator_load_percent DOUBLE,
            energy_consumed_kwh DOUBLE,
            battery_level_percent DOUBLE,
            fuel_level_liters DOUBLE,
            fuel_burn_rate_lph DOUBLE,
            food_inventory_kg DOUBLE,
            station_occupancy DOUBLE,
            predicted_energy_kwh DOUBLE,
            anomaly_prediction INT,
            anomaly_status VARCHAR(20),
            energy_remaining_kwh DOUBLE,
            energy_consumption_per_day_kwh DOUBLE,
            energy_endurance_days DOUBLE,
            fuel_consumption_per_day_litres DOUBLE,
            fuel_endurance_days DOUBLE,
            risk_score INT,
            risk_status VARCHAR(30),
            recommended_fuel_litres DOUBLE,
            additional_fuel_required_litres DOUBLE,
            energy_status VARCHAR(20),
            fuel_status VARCHAR(20)
        )
    """)

    insert_query = f"""
        INSERT INTO predictions ({','.join(mysql_columns)})
        VALUES ({','.join(['%s'] * len(mysql_columns))})
    """

    upload_df = df[mysql_columns].copy()
    upload_df = upload_df.where(pd.notnull(upload_df), None)
    values = [tuple(row) for row in upload_df.itertuples(index=False, name=None)]

    cursor.executemany(insert_query, values)
    connection.commit()
    print(f"Rows uploaded to predictions: {cursor.rowcount}")

    cursor.close()
    connection.close()

except mysql.connector.Error as error:
    print(f"\nMYSQL ERROR: {error}")
except Exception as error:
    print(f"\nUPLOAD ERROR: {error}")


# ============================================================
# 9. REAL-TIME STREAMING PIPELINE (FILE-TAILER POLLER)
# ============================================================

def ensure_realtime_table(connection):
    cursor = connection.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS realtime_station_state (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            timestamp DATETIME NOT NULL,
            station_id VARCHAR(20) NOT NULL,
            temperature_celsius DOUBLE,
            wind_speed_knots DOUBLE,
            solar_radiation_wm2 DOUBLE,
            station_occupancy DOUBLE,
            battery_level_percent DOUBLE,
            generator_load_percent DOUBLE,
            fuel_level_liters DOUBLE,
            predicted_energy_kwh DOUBLE,
            anomaly_prediction INT,
            anomaly_status VARCHAR(20),
            energy_remaining_kwh DOUBLE,
            energy_consumption_per_day_kwh DOUBLE,
            energy_endurance_days DOUBLE,
            fuel_consumption_per_day_litres DOUBLE,
            fuel_endurance_days DOUBLE,
            risk_score INT,
            risk_status VARCHAR(30),
            recommended_fuel_litres DOUBLE,
            additional_fuel_required_litres DOUBLE,
            energy_status VARCHAR(20),
            fuel_status VARCHAR(20)
        )
    """)
    connection.commit()
    cursor.close()


def insert_realtime_state(connection, state):
    cursor = connection.cursor()
    query = """
        INSERT INTO realtime_station_state (
            timestamp, station_id,
            temperature_celsius, wind_speed_knots,
            solar_radiation_wm2, station_occupancy,
            battery_level_percent, generator_load_percent,
            fuel_level_liters, predicted_energy_kwh,
            anomaly_prediction, anomaly_status,
            energy_remaining_kwh, energy_consumption_per_day_kwh,
            energy_endurance_days, fuel_consumption_per_day_litres,
            fuel_endurance_days, risk_score, risk_status,
            recommended_fuel_litres, additional_fuel_required_litres,
            energy_status, fuel_status
        )
        VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
            %s, %s, %s
        )
    """
    cursor.execute(query, (
        state["timestamp"],
        state["station_id"],
        state["temperature_celsius"],
        state["wind_speed_knots"],
        state["solar_radiation_wm2"],
        state["station_occupancy"],
        state["battery_level_percent"],
        state["generator_load_percent"],
        state["fuel_level_liters"],
        state["predicted_energy_kwh"],
        state["anomaly_prediction"],
        state["anomaly_status"],
        state["energy_remaining_kwh"],
        state["energy_consumption_per_day_kwh"],
        state["energy_endurance_days"],
        state["fuel_consumption_per_day_litres"],
        state["fuel_endurance_days"],
        state["risk_score"],
        state["risk_status"],
        state["recommended_fuel_litres"],
        state["additional_fuel_required_litres"],
        state["energy_status"],
        state["fuel_status"],
    ))
    connection.commit()
    cursor.close()


def run_realtime_csv_tailer():
    print_header("REAL-TIME CSV POLLER RUNNING")
    print(f"Monitoring incoming rows from: {INPUT_FILE}")
    print(f"Polling frequency: {REALTIME_POLL_INTERVAL_SECONDS}s | Press Ctrl+C to stop.\n")

    conn = mysql.connector.connect(**MYSQL_CONFIG)
    ensure_realtime_table(conn)

    # Initial line count baseline
    try:
        with open(INPUT_FILE, "r", encoding="utf-8") as f:
            processed_lines = sum(1 for line in f if line.strip())
    except Exception as e:
        print(f"Error reading initial file: {e}")
        processed_lines = 0

    print(f"Baseline established at {processed_lines} existing lines. Listening for new entries...")

    try:
        while True:
            time.sleep(REALTIME_POLL_INTERVAL_SECONDS)

            if not os.path.exists(INPUT_FILE):
                continue

            try:
                with open(INPUT_FILE, "r", encoding="utf-8") as f:
                    all_lines = [line.strip() for line in f if line.strip()]
            except PermissionError:
                # Generator is actively writing; wait for next cycle
                continue

            total_current_lines = len(all_lines)
            if total_current_lines <= processed_lines:
                continue

            header_parts = [h.strip() for h in all_lines[0].split(",")]
            new_lines = all_lines[processed_lines:]

            for line in new_lines:
                parts = [p.strip() for p in line.split(",")]
                if len(parts) != len(header_parts):
                    print(f"[POLLER NOTICE] Column mismatch. Expected {len(header_parts)}, got {len(parts)}: {line}")
                    continue

                raw_row = dict(zip(header_parts, parts))
                temp_df = pd.DataFrame([raw_row])

                try:
                    cleaned_df = clean_dataframe(temp_df)
                    if cleaned_df.empty:
                        print("[POLLER NOTICE] Cleaned row returned empty.")
                        continue

                    row_dict = cleaned_df.iloc[0].to_dict()
                    calculated = compute_station_state(
                        row_dict,
                        energy_model,
                        anomaly_model,
                        interval_hours,
                        station_burn_medians,
                        global_median_fuel
                    )

                    live_state = {
                        "timestamp": row_dict["timestamp"] if pd.notna(row_dict.get("timestamp")) else datetime.now(),
                        "station_id": row_dict["station_id"],
                        "temperature_celsius": float(row_dict["temperature_celsius"]),
                        "wind_speed_knots": float(row_dict["wind_speed_knots"]),
                        "solar_radiation_wm2": float(row_dict["solar_radiation_wm2"]),
                        "station_occupancy": float(row_dict["station_occupancy"]),
                        "battery_level_percent": float(row_dict["battery_level_percent"]),
                        "generator_load_percent": float(row_dict["generator_load_percent"]),
                        "fuel_level_liters": float(row_dict["fuel_level_liters"]),
                        **calculated,
                    }

                    insert_realtime_state(conn, live_state)
                    print(
                        f"[{live_state['timestamp']}] {live_state['station_id']:7s} | "
                        f"Energy: {live_state['predicted_energy_kwh']:.2f} kWh | "
                        f"Battery: {live_state['battery_level_percent']:.1f}% | "
                        f"Anomaly: {live_state['anomaly_status']} | "
                        f"Risk: {live_state['risk_score']}/100"
                    )

                except Exception as parse_err:
                    print(f"[POLLER PARSE ERROR] Failed on line '{line}': {parse_err}")

            processed_lines = total_current_lines

    except KeyboardInterrupt:
        print("\nReal-time poller stopped by user.")
    finally:
        if conn and conn.is_connected():
            conn.close()
            print("MySQL connection closed.")


if __name__ == "__main__":
    if RUN_REALTIME_POLLER:
        run_realtime_csv_tailer()