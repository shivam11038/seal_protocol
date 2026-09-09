import time
import os
from datetime import datetime

import numpy as np
import pandas as pd
from sqlalchemy import create_engine, text


# =============================================================================
# 1. FILE CONFIGURATION
# =============================================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATA_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)

DATA_FILE = os.path.join(
    DATA_DIR,
    "Hourly_antarctic_telemetry.csv"
)


# =============================================================================
# 2. MYSQL CONFIGURATION
# =============================================================================

# Replace YOUR_MYSQL_PASSWORD with your actual MySQL password.
DB_URI = (
    "mysql+pymysql://root:"
    "lavanya"
    "@localhost:3306/antarctica_digital_twin"
)

engine = create_engine(
    DB_URI,
    pool_pre_ping=True,
    pool_recycle=3600
)


# =============================================================================
# 3. STATION CONFIGURATION
# =============================================================================

STATIONS = ["MAITRI", "BHARATI"]

# Independent resource state for each station
STATION_STATE = {
    "MAITRI": {
        "fuel": 25000.0,
        "food": 5000.0
    },
    "BHARATI": {
        "fuel": 25000.0,
        "food": 5000.0
    }
}


# =============================================================================
# 4. REAL-TIME CONFIGURATION
# =============================================================================

# One telemetry cycle every 5 seconds
INTERVAL_SECONDS = 5

# Demo battery capacity
BATTERY_CAPACITY_KWH = 500.0


# =============================================================================
# 5. CSV WRITER
# =============================================================================

def append_with_retry(
    df_to_write,
    filepath,
    max_retries=10,
    delay=0.2
):
    for _ in range(max_retries):
        try:
            file_exists = os.path.exists(filepath)

            df_to_write.to_csv(
                filepath,
                mode="a",
                header=not file_exists,
                index=False
            )

            return True

        except PermissionError:
            time.sleep(delay)

        except Exception as e:
            print(f"CSV write error: {e}")
            return False

    print(
        f"Warning: CSV write skipped because the file "
        f"was locked after {max_retries} retries."
    )

    return False


# =============================================================================
# 6. MYSQL CONNECTION TEST
# =============================================================================

def test_database_connection():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        print("MySQL connection: SUCCESS")
        return True

    except Exception as e:
        print("MySQL connection: FAILED")
        print(f"Database error: {e}")
        return False


# =============================================================================
# 7. GENERATE ONE STATION READING
# =============================================================================

def generate_station_reading(station_id):

    if station_id not in STATION_STATE:
        raise ValueError(
            f"Unknown station '{station_id}'. "
            f"Use MAITRI or BHARATI."
        )

    # =========================================================================
    # A. TIME
    # =========================================================================

    current_time = datetime.now()
    hour_of_day = current_time.hour

    time_fraction_of_hour = (
        INTERVAL_SECONDS / 3600.0
    )


    # =========================================================================
    # B. SCENARIO
    # =========================================================================

    scenario = np.random.choice(
        ["NORMAL", "ANOMALY", "DISASTER"],
        p=[0.80, 0.15, 0.05]
    )


    # =========================================================================
    # C. WEATHER
    # =========================================================================

    if scenario == "DISASTER":

        temperature = float(
            np.random.uniform(-45.0, -35.0)
        )

        wind_speed = float(
            np.random.uniform(55.0, 80.0)
        )

        pressure = float(
            np.random.uniform(950.0, 975.0)
        )

        humidity = float(
            np.random.uniform(85.0, 98.0)
        )

    elif scenario == "ANOMALY":

        temperature = float(
            np.random.uniform(-40.0, -20.0)
        )

        wind_speed = float(
            np.random.uniform(35.0, 60.0)
        )

        pressure = float(
            np.random.uniform(970.0, 995.0)
        )

        humidity = float(
            np.random.uniform(70.0, 90.0)
        )

    else:

        temperature = float(
            np.random.uniform(-35.0, -15.0)
        )

        wind_speed = float(
            np.random.uniform(10.0, 45.0)
        )

        pressure = float(
            np.random.uniform(985.0, 1015.0)
        )

        humidity = float(
            np.random.uniform(50.0, 80.0)
        )


    # =========================================================================
    # D. OCCUPANCY
    # =========================================================================

    occupancy = int(
        np.random.randint(15, 35)
    )


    # =========================================================================
    # E. FOOD CONSUMPTION
    # =========================================================================

    # Approximately 2 kg/person/day

    food_consumed = (
        occupancy
        * 0.083
        * time_fraction_of_hour
    )

    STATION_STATE[station_id]["food"] = max(
        0.0,
        STATION_STATE[station_id]["food"]
        - food_consumed
    )

    current_food = STATION_STATE[station_id]["food"]


    # =========================================================================
    # F. ENERGY / POWER
    # =========================================================================

    # Colder temperatures increase heating demand.

    heating_demand_kw = (
        abs(temperature) * 2.1
    )

    base_station_kw = (
        70.0
        + occupancy * 0.8
    )

    total_power_kw = (
        base_station_kw
        + heating_demand_kw
    )


    # Generator load

    if scenario == "ANOMALY":

        generator_load = float(
            np.random.uniform(92.0, 99.0)
        )

    elif scenario == "DISASTER":

        generator_load = float(
            np.random.uniform(85.0, 100.0)
        )

    else:

        generator_load = float(
            np.clip(
                (total_power_kw / 200.0) * 100,
                20.0,
                90.0
            )
        )


    # Energy consumed during this telemetry interval

    energy_consumed_kwh = (
        total_power_kw
        * time_fraction_of_hour
    )


    # =========================================================================
    # G. SOLAR RADIATION
    # =========================================================================

    if (
        6 <= hour_of_day <= 18
        and scenario != "DISASTER"
    ):

        solar_radiation = float(
            max(
                0,
                np.sin(
                    (hour_of_day - 6)
                    * np.pi
                    / 12
                ) * 800
            )
        )

    else:

        solar_radiation = 0.0


    # =========================================================================
    # H. BATTERY
    # =========================================================================

    if solar_radiation > 0:

        battery_level = float(
            np.clip(
                80.0
                + (solar_radiation / 800.0) * 20.0,
                80.0,
                100.0
            )
        )

    else:

        battery_level = float(
            np.clip(
                100.0 - generator_load * 0.3,
                15.0,
                90.0
            )
        )


    # Disaster causes additional battery stress

    if scenario == "DISASTER":

        battery_level = max(
            10.0,
            battery_level - 15.0
        )


    # =========================================================================
    # I. FUEL CONSUMPTION
    # =========================================================================

    fuel_burn_rate_lph = (
        generator_load * 0.38
    )

    fuel_used_this_interval = (
        fuel_burn_rate_lph
        * time_fraction_of_hour
    )

    STATION_STATE[station_id]["fuel"] = max(
        0.0,
        STATION_STATE[station_id]["fuel"]
        - fuel_used_this_interval
    )

    current_fuel = STATION_STATE[station_id]["fuel"]


    # =========================================================================
    # J. RESOURCE FORECAST
    # =========================================================================

    hours_of_fuel_remaining = (
        current_fuel
        / max(fuel_burn_rate_lph, 0.1)
    )

    hours_of_food_remaining = (
        current_food
        / max(
            occupancy * 0.083,
            0.001
        )
    )


    # =========================================================================
    # K. ANOMALY LABEL
    # =========================================================================

    if (
        scenario == "ANOMALY"
        or generator_load > 90.0
    ):

        occurring_anomaly = (
            "ANOMALY_GENERATOR_OVERLOAD"
        )

    elif battery_level < 25.0:

        occurring_anomaly = (
            "ANOMALY_BATTERY_CRITICAL_DEPLETION"
        )

    else:

        occurring_anomaly = "NONE"


    # =========================================================================
    # L. DISASTER LABEL
    # =========================================================================

    if scenario == "DISASTER":

        disaster_label = (
            "DISASTER_BLIZZARD_EMERGENCY"
        )

    elif current_fuel < 2000.0:

        disaster_label = (
            "DISASTER_FUEL_EXHAUSTION_CRITICAL"
        )

    else:

        disaster_label = "NONE"


    # =========================================================================
    # M. PREDICTIVE ANOMALY
    # =========================================================================

    if hours_of_fuel_remaining < 48:

        predicted_anomaly = (
            "PREDICTED_FUEL_DEPLETION_48H"
        )

    elif (
        temperature < -30
        and battery_level < 40
    ):

        predicted_anomaly = (
            "PREDICTED_HEATING_FAILURE_RISK"
        )

    else:

        predicted_anomaly = "NONE"


    # =========================================================================
    # N. RISK SCORE
    # =========================================================================

    risk_score = 0

    if scenario == "ANOMALY":
        risk_score += 35

    if scenario == "DISASTER":
        risk_score += 60

    if generator_load > 90:
        risk_score += 20

    if battery_level < 30:
        risk_score += 20

    if current_fuel < 5000:
        risk_score += 20

    if temperature < -35:
        risk_score += 10

    risk_score = int(
        np.clip(
            risk_score,
            0,
            100
        )
    )


    if risk_score >= 70:

        risk_status = "CRITICAL"

    elif risk_score >= 40:

        risk_status = "WARNING"

    else:

        risk_status = "NORMAL"


    # =========================================================================
    # O. ENERGY / FUEL FORECASTS
    # =========================================================================

    energy_remaining_kwh = (
        battery_level / 100.0
    ) * BATTERY_CAPACITY_KWH

    energy_consumption_per_day_kwh = (
        total_power_kw * 24.0
    )

    energy_endurance_days = (
        energy_remaining_kwh
        / max(
            energy_consumption_per_day_kwh,
            0.001
        )
    )

    fuel_consumption_per_day_litres = (
        fuel_burn_rate_lph * 24.0
    )

    fuel_endurance_days = (
        current_fuel
        / max(
            fuel_consumption_per_day_litres,
            0.001
        )
    )

    predicted_energy_kwh = (
        energy_consumed_kwh * 1.05
    )


    # =========================================================================
    # P. RESOURCE STATUS
    # =========================================================================

    if energy_endurance_days < 1:

        energy_status = "CRITICAL"

    elif energy_endurance_days < 3:

        energy_status = "WARNING"

    else:

        energy_status = "NORMAL"


    if fuel_endurance_days < 2:

        fuel_status = "CRITICAL"

    elif fuel_endurance_days < 7:

        fuel_status = "WARNING"

    else:

        fuel_status = "NORMAL"


    # =========================================================================
    # Q. BINARY ANOMALY PREDICTION
    # =========================================================================

    anomaly_prediction = (
        1
        if predicted_anomaly != "NONE"
        else 0
    )


    # =========================================================================
    # R. FUEL RECOMMENDATION
    # =========================================================================

    # 7 days projected consumption + 10% safety margin

    recommended_fuel_litres = (
        fuel_consumption_per_day_litres
        * 7.0
        * 1.10
    )

    additional_fuel_required_litres = max(
        0.0,
        recommended_fuel_litres - current_fuel
    )


    # =========================================================================
    # S. MYSQL DATA RECORD
    # =========================================================================

    # These names EXACTLY match the MySQL predictions table.

    record = {

        "timestamp": current_time.strftime(
            "%Y-%m-%d %H:%M:%S"
        ),

        "station_id": station_id,

        "temperature_celsius": round(
            temperature,
            2
        ),

        "wind_speed_knots": round(
            wind_speed,
            2
        ),

        "pressure_hpa": round(
            pressure,
            2
        ),

        "humidity_percent": round(
            humidity,
            2
        ),

        "solar_radiation_wm2": round(
            solar_radiation,
            2
        ),

        "generator_load_percent": round(
            generator_load,
            2
        ),

        "energy_consumed_kwh": round(
            energy_consumed_kwh,
            2
        ),

        "battery_level_percent": round(
            battery_level,
            2
        ),

        "fuel_level_liters": round(
            current_fuel,
            2
        ),

        "fuel_burn_rate_lph": round(
            fuel_burn_rate_lph,
            2
        ),

        "food_inventory_kg": round(
            current_food,
            2
        ),

        "station_occupancy": occupancy,

        "predicted_energy_kwh": round(
            predicted_energy_kwh,
            2
        ),

        "anomaly_prediction": anomaly_prediction,

        "anomaly_status": occurring_anomaly,

        "energy_remaining_kwh": round(
            energy_remaining_kwh,
            2
        ),

        "energy_consumption_per_day_kwh": round(
            energy_consumption_per_day_kwh,
            2
        ),

        "energy_endurance_days": round(
            energy_endurance_days,
            2
        ),

        "fuel_consumption_per_day_litres": round(
            fuel_consumption_per_day_litres,
            2
        ),

        "fuel_endurance_days": round(
            fuel_endurance_days,
            2
        ),

        "risk_score": risk_score,

        "risk_status": risk_status,

        "recommended_fuel_litres": round(
            recommended_fuel_litres,
            2
        ),

        "additional_fuel_required_litres": round(
            additional_fuel_required_litres,
            2
        ),

        "energy_status": energy_status,

        "fuel_status": fuel_status
    }

    return pd.DataFrame([record])


# =============================================================================
# 8. WRITE TO MYSQL
# =============================================================================

def write_to_mysql(telemetry_df):

    try:

        telemetry_df.to_sql(
            "predictions",
            con=engine,
            if_exists="append",
            index=False,
            method="multi"
        )

        return True

    except Exception as e:

        print(
            f" -> MySQL write failed: {e}"
        )

        return False


# =============================================================================
# 9. MAIN REAL-TIME LOOP
# =============================================================================

if __name__ == "__main__":

    print("=" * 80)

    print(
        " ANTARCTIC DIGITAL TWIN - REAL-TIME TELEMETRY"
    )

    print("=" * 80)

    print(
        f"Stations: {', '.join(STATIONS)}"
    )

    print(
        f"Telemetry interval: "
        f"{INTERVAL_SECONDS} seconds"
    )

    print(
        f"CSV: {DATA_FILE}"
    )

    print("=" * 80)


    # =========================================================================
    # DATABASE TEST
    # =========================================================================

    db_available = test_database_connection()

    if db_available:

        print(
            "Database mode: ENABLED"
        )

    else:

        print(
            "Database mode: DISABLED - "
            "telemetry will continue in CSV mode."
        )


    print(
        "\nStarting telemetry generation..."
    )

    print(
        "Press Ctrl+C to stop.\n"
    )


    # =========================================================================
    # REAL-TIME LOOP
    # =========================================================================

    try:

        while True:

            # Generate data for both stations

            for station in STATIONS:

                telemetry_df = (
                    generate_station_reading(
                        station_id=station
                    )
                )

                row = telemetry_df.iloc[0]


                # =================================================================
                # CONSOLE OUTPUT
                # =================================================================

                print("=" * 80)

                print(
                    f"[{row['timestamp']}] "
                    f"{station}"
                )

                print(
                    f"Scenario       : "
                    f"{row['anomaly_status']}"
                )

                print(
                    f"Temperature    : "
                    f"{row['temperature_celsius']} °C"
                )

                print(
                    f"Wind Speed     : "
                    f"{row['wind_speed_knots']} knots"
                )

                print(
                    f"Generator Load : "
                    f"{row['generator_load_percent']} %"
                )

                print(
                    f"Battery        : "
                    f"{row['battery_level_percent']} %"
                )

                print(
                    f"Fuel           : "
                    f"{row['fuel_level_liters']} L"
                )

                print(
                    f"Food           : "
                    f"{row['food_inventory_kg']} kg"
                )

                print(
                    f"Risk           : "
                    f"{row['risk_status']} "
                    f"({row['risk_score']}/100)"
                )

                print(
                    f"Anomaly        : "
                    f"{row['anomaly_status']}"
                )

                print(
                    f"Prediction     : "
                    f"{row['anomaly_prediction']}"
                )


                # =================================================================
                # CSV BACKUP
                # =================================================================

                csv_success = append_with_retry(
                    telemetry_df,
                    DATA_FILE
                )

                if csv_success:

                    print(
                        " -> CSV: Saved"
                    )

                else:

                    print(
                        " -> CSV: FAILED"
                    )


                # =================================================================
                # MYSQL
                # =================================================================

                if db_available:

                    mysql_success = (
                        write_to_mysql(
                            telemetry_df
                        )
                    )

                    if mysql_success:

                        print(
                            " -> MySQL: Saved"
                        )


                print()


            # =====================================================================
            # WAIT
            # =====================================================================

            print(
                f"Next telemetry cycle in "
                f"{INTERVAL_SECONDS} seconds...\n"
            )

            time.sleep(
                INTERVAL_SECONDS
            )


    except KeyboardInterrupt:

        print(
            "\n" + "=" * 80
        )

        print(
            " TELEMETRY GENERATOR STOPPED"
        )

        print(
            "=" * 80
        )