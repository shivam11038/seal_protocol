/* =========================================================================
   TELEMETRY.JS - Realtime Data Core (Connected to predictions schema)
   ========================================================================= */

const Telemetry = (() => {

  
  const STATIONS = {
    bharati: {
      name: "BHARATI RESEARCH STATION",
      coords: "Larsemann Hills · 69.4°S 76.2°E · NCPOR Telemetry",
      stationStatus: "nominal",
      startedAt: Date.now() - 3600000 * 8,
      occupancy: 0,
      alerts: [],
      sensors: {
        outsideTemp: { label: "Outside Temp", unit: "°C", value: 0, min: -60, max: 10, history: [0] },
        windSpeed:   { label: "Wind Speed", unit: "m/s", value: 0, min: 0, max: 45, history: [0] },
        pressure:    { label: "Pressure", unit: "hPa", value: 0, min: 920, max: 1050, history: [0] },
        humidity:    { label: "Humidity", unit: "%", value: 0, min: 0, max: 100, history: [0] },
        solar:       { label: "Solar Rad", unit: "W/m²", value: 0, min: 0, max: 800, history: [0] },
        burnRate:    { label: "Fuel Burn Rate", unit: "L/h", value: 0, min: 0, max: 100, history: [0] },
        foodStock:   { label: "Food Stock", unit: "kg", value: 0, min: 0, max: 5000, history: [0] },
        occupancy:   { label: "Crew Onsite", unit: "pax", value: 0, min: 0, max: 80, history: [0] }
      },
      power: {
        battery: 0, batteryKwh: 0, fuel: 0, fuelLiters: 0,
        fuelDays: 0, energyDays: 0, genLoad: 0, demand: 0, consumed: 0,
        energyStatus: "NOMINAL", fuelStatus: "NOMINAL", recFuel: 0
      },
      risk: {
        total: 0,
        status: "LOW",
        breakdown: { environmental: 0, battery: 0, fuel: 0, powerLoad: 0, anomaly: 0 }
      }
    },
    maitri: {
      name: "MAITRI RESEARCH STATION",
      coords: "Schirmacher Oasis · 70.8°S 11.7°E · NCPOR Telemetry",
      stationStatus: "nominal",
      startedAt: Date.now() - 3600000 * 14,
      occupancy: 0,
      alerts: [],
      sensors: {
        outsideTemp: { label: "Outside Temp", unit: "°C", value: 0, min: -60, max: 10, history: [0] },
        windSpeed:   { label: "Wind Speed", unit: "m/s", value: 0, min: 0, max: 45, history: [0] },
        pressure:    { label: "Pressure", unit: "hPa", value: 0, min: 920, max: 1050, history: [0] },
        humidity:    { label: "Humidity", unit: "%", value: 0, min: 0, max: 100, history: [0] },
        solar:       { label: "Solar Rad", unit: "W/m²", value: 0, min: 0, max: 800, history: [0] },
        burnRate:    { label: "Fuel Burn Rate", unit: "L/h", value: 0, min: 0, max: 100, history: [0] },
        foodStock:   { label: "Food Stock", unit: "kg", value: 0, min: 0, max: 5000, history: [0] },
        occupancy:   { label: "Crew Onsite", unit: "pax", value: 0, min: 0, max: 80, history: [0] }
      },
      power: {
        battery: 0, batteryKwh: 0, fuel: 0, fuelLiters: 0,
        fuelDays: 0, energyDays: 0, genLoad: 0, demand: 0, consumed: 0,
        energyStatus: "NOMINAL", fuelStatus: "NOMINAL", recFuel: 0
      },
      risk: {
        total: 0,
        status: "LOW",
        breakdown: { environmental: 0, battery: 0, fuel: 0, powerLoad: 0, anomaly: 0 }
      }
    }
  };

  let activeStationKey = "bharati";
  const listeners = [];
  const logs = [];

  function on(fn) { listeners.push(fn); }
  function emit(type, payload) { listeners.forEach(fn => fn(type, payload)); }
  function getActiveStation() { return STATIONS[activeStationKey]; }
  function getActiveStationKey() { return activeStationKey; }

  function switchStation(stationKey) {
    if (STATIONS[stationKey] && activeStationKey !== stationKey) {
      activeStationKey = stationKey;
      addLog("SYSTEM", `Monitoring feed switched to ${STATIONS[stationKey].name}`);
      emit("stationChange", getActiveStation());
    }
  }

  function addLog(level, msg) {
    const entry = { id: Date.now(), time: new Date(), level, msg };
    logs.push(entry);
    if (logs.length > 50) logs.shift();
    emit("log", entry);
  }

  function pushBackendTelemetry(stationKey, incoming) {
    if (!STATIONS[stationKey]) return;
    const s = STATIONS[stationKey];

    if (incoming.sensors) {
      Object.entries(incoming.sensors).forEach(([k, val]) => {
        if (s.sensors[k]) {
          s.sensors[k].value = val;
          s.sensors[k].history.push(val);
          if (s.sensors[k].history.length > 20) s.sensors[k].history.shift();
        }
      });
    }

    if (incoming.power) Object.assign(s.power, incoming.power);
    if (incoming.risk) Object.assign(s.risk, incoming.risk);
    if (incoming.stationStatus) s.stationStatus = incoming.stationStatus;
    if (incoming.alerts && incoming.alerts.length > 0) {
      incoming.alerts.forEach(newAlert => {
        const exists = s.alerts.some(a => a.id === newAlert.id);
        if (!exists) {
          s.alerts.unshift(newAlert);
        }
      });
      if (s.alerts.length > 30) s.alerts.length = 30;
    }
    if (incoming.occupancy !== undefined) s.occupancy = incoming.occupancy;

    emit("tick", s);
  }

  function sparkPath(history, w = 100, h = 26) {
    if (!history || history.length < 2) return `M0,${h / 2} L${w},${h / 2}`;
    const min = Math.min(...history);
    const max = Math.max(...history);
    const range = (max - min) || 1;
    const step = w / (history.length - 1);
    return history.map((v, i) => {
      const x = (i * step).toFixed(1);
      const y = (h - ((v - min) / range) * (h - 6) - 3).toFixed(1);
      return `${i === 0 ? "M" : "L"}${x},${y}`;
    }).join(" ");
  }

  

  return {
    on,
    getActiveStation,
    getActiveStationKey,
    switchStation,
    pushBackendTelemetry,
    sparkPath,
    addLog,
    get logs() { return logs; }
  };
})();