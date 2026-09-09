/* =========================================================================
   API.JS - Realtime Poller & Schema Mapper
   ========================================================================= */

const API = (() => {
  const ENDPOINT = "http://127.0.0.1:8000/api/telemetry/latest";

  function mapRowToDashboard(row) {
    const windSpeedMs = (parseFloat(row.wind_speed_knots) || 0) * 0.514444;
    const isAnomaly = parseInt(row.anomaly_prediction) === 1 || 
                      String(row.anomaly_status || "").toUpperCase().includes("ANOMALY");

    const alerts = [];
    if (isAnomaly) {
      alerts.push({
        id: "anomaly-alert",
        title: `Anomaly: ${row.anomaly_status || "Irregular pattern detected"}`,
        level: "crit",
        time: "Realtime"
      });
    }

    const fuelLiters = parseFloat(row.fuel_level_liters) || 0;
    const batteryPct = parseFloat(row.battery_level_percent) || 0;
    const genLoad = parseFloat(row.generator_load_percent) || 0;
    const riskTotal = Math.min(100, Math.max(0, Math.round(parseFloat(row.risk_score) || 0)));

    if (batteryPct < 25) {
      alerts.push({ id: "bat-warn", title: "Critically low battery buffer", level: "warn", time: "Now" });
    }

    return {
      stationStatus: isAnomaly ? "warning" : "nominal",
      occupancy: parseInt(row.station_occupancy) || 0,
      alerts,
      sensors: {
        outsideTemp: parseFloat(row.temperature_celsius) || 0,
        windSpeed: windSpeedMs,
        pressure: parseFloat(row.pressure_hpa) || 0,
        humidity: parseFloat(row.humidity_percent) || 0,
        solar: parseFloat(row.solar_radiation_wm2) || 0,
        burnRate: parseFloat(row.fuel_burn_rate_lph) || 0,
        foodStock: parseFloat(row.food_inventory_kg) || 0,
        occupancy: parseInt(row.station_occupancy) || 0
      },
      power: {
        battery: batteryPct,
        batteryKwh: parseFloat(row.energy_remaining_kwh) || 0,
        fuel: Math.min(100, Math.max(0, (fuelLiters / 30000) * 100)),
        fuelLiters: fuelLiters,
        fuelDays: Math.round(parseFloat(row.fuel_endurance_days) || 0),
        energyDays: Math.round(parseFloat(row.energy_endurance_days) || 0),
        genLoad: Math.round(genLoad),
        demand: parseFloat(row.predicted_energy_kwh) || 0,
        consumed: parseFloat(row.energy_consumed_kwh) || 0,
        energyStatus: row.energy_status || "NOMINAL",
        fuelStatus: row.fuel_status || "NOMINAL",
        recFuel: parseFloat(row.recommended_fuel_litres) || 0
      },
      risk: {
        total: riskTotal,
        status: row.risk_status || "NOMINAL",
        breakdown: {
          environmental: Math.min(100, Math.round(windSpeedMs * 2.5)),
          battery: Math.round(100 - batteryPct),
          fuel: Math.min(100, Math.round(parseFloat(row.fuel_consumption_per_day_litres) || 20)),
          powerLoad: Math.round(genLoad),
          anomaly: isAnomaly ? 85 : 10
        }
      }
    };
  }

  async function poll() {
    const key = Telemetry.getActiveStationKey();
    try {
      const res = await fetch(`${ENDPOINT}?station_id=${encodeURIComponent(key)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const row = await res.json();
      
      const payload = mapRowToDashboard(row);
      Telemetry.pushBackendTelemetry(key, payload);
    } catch (err) {
      console.error("[Telemetry Engine] Connection error:", err.message);
    }
  }

  setInterval(poll, 2000);
  poll();

  return { poll };
})();