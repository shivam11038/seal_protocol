/* =========================================================================
   MAIN.JS - Dynamic UI Sync
   ========================================================================= */

(() => {
  let unitSystem = "metric";
  const toF = c => (c * 9 / 5 + 32);
  const toMph = ms => (ms * 2.23694);
  const fmtTemp = c => unitSystem === "metric" ? `${c.toFixed(1)}` : `${toF(c).toFixed(1)}`;
  const tempUnit = () => unitSystem === "metric" ? "°C" : "°F";
  const fmtSpeed = ms => unitSystem === "metric" ? `${ms.toFixed(1)}` : `${toMph(ms).toFixed(1)}`;
  const speedUnit = () => unitSystem === "metric" ? "m/s" : "mph";

  const stationToggleInput = document.getElementById("stationToggleInput");
  const lblBharati = document.getElementById("lblBharati");
  const lblMaitri = document.getElementById("lblMaitri");

  function updateToggleUI() {
    const current = Telemetry.getActiveStationKey();
    stationToggleInput.checked = (current === "maitri");
    lblBharati.classList.toggle("active", current === "bharati");
    lblMaitri.classList.toggle("active", current === "maitri");
  }

  stationToggleInput.addEventListener("change", (e) => {
    Telemetry.switchStation(e.target.checked ? "maitri" : "bharati");
    API.poll();
  });

  const btnAlerts = document.getElementById("btnAlerts");
  const alertDropdown = document.getElementById("alertDropdown");

  btnAlerts.addEventListener("click", (e) => {
    e.stopPropagation();
    alertDropdown.classList.toggle("open");
  });
  document.addEventListener("click", () => alertDropdown.classList.remove("open"));
  alertDropdown.addEventListener("click", e => e.stopPropagation());

  function renderAlerts() {
    const s = Telemetry.getActiveStation();
    const count = s.alerts.length;
    const counter = document.getElementById("alertCounter");
    counter.textContent = count;
    counter.style.display = count > 0 ? "block" : "none";
    document.getElementById("alertStationTag").textContent = s.name.split(" ")[0];

    document.getElementById("alertList").innerHTML = s.alerts.map(a => `
      <div class="alert-item ${a.level}">
        <strong>${a.title}</strong>
        <span class="alert-time">${a.time}</span>
      </div>
    `).join("") || `<span style="font-size:0.75rem; color:var(--text-muted)">No active anomalies reported.</span>`;
  }

  function renderHeader() {
    const s = Telemetry.getActiveStation();
    document.getElementById("stationHeaderTitle").textContent = s.name;
    document.getElementById("stationHeaderSub").innerHTML = s.coords;
    document.getElementById("stageTitle").textContent = `${s.name.split(" ")[0]} Layout — Digital Twin`;
    
    const badge = document.getElementById("statusBadge");
    const statusTxt = document.getElementById("statusText");
    const isNominal = s.stationStatus === "nominal";

    badge.setAttribute("data-state", isNominal ? "nominal" : "warning");
    badge.style.color = isNominal ? "var(--ok)" : "var(--warn)";
    badge.style.borderColor = isNominal ? "rgba(74,222,128,0.35)" : "rgba(251,191,36,0.35)";
    badge.style.background = isNominal ? "rgba(74,222,128,0.18)" : "rgba(251,191,36,0.18)";
    statusTxt.textContent = isNominal ? "ALL SYSTEMS NOMINAL" : "SYSTEM ANOMALY RECORDED";
  }

  function renderStationMeta() {
    const s = Telemetry.getActiveStation();
    document.getElementById("stationMetaContainer").innerHTML = `
      <div class="detail-row"><span class="detail-label">Active Station ID</span><span class="detail-val">${Telemetry.getActiveStationKey().toUpperCase()}</span></div>
      <div class="detail-row"><span class="detail-label">Station Occupancy</span><span class="detail-val">${s.occupancy} Personnel</span></div>
      <div class="detail-row"><span class="detail-label">Energy State</span><span class="detail-val">${s.power.energyStatus}</span></div>
      <div class="detail-row"><span class="detail-label">Fuel State</span><span class="detail-val">${s.power.fuelStatus}</span></div>
    `;
  }

  function renderKPIs() {
    const s = Telemetry.getActiveStation();
    const p = s.power;
    const kpis = [
      { label: "Station Status", value: s.stationStatus === "nominal" ? "Nominal" : "Warning", sub: `${s.alerts.length} active alerts` },
      { label: "Composite Risk", value: s.risk.total, unit: "/ 100", sub: `Status: ${s.risk.status}` },
      { label: "Battery Level", value: p.battery.toFixed(0), unit: "%", sub: `${p.batteryKwh.toFixed(1)} kWh remaining` },
      { label: "Fuel Reserve", value: p.fuel.toFixed(0), unit: "%", sub: `${p.fuelLiters.toLocaleString()} L · ${p.fuelDays}d autonomy` },
      { label: "Generator Load", value: p.genLoad, unit: "%", sub: `Burn: ${s.sensors.burnRate.value} L/h` },
      { label: "Energy Endurance", value: p.energyDays, unit: "days", sub: `Demand: ${p.demand.toFixed(1)} kWh` }
    ];

    document.getElementById("kpiGrid").innerHTML = kpis.map(k => `
      <div class="glass-panel kpi-card">
        <span class="kpi-label">${k.label}</span>
        <span class="kpi-value">${k.value}${k.unit ? `<span class="kpi-unit">${k.unit}</span>` : ""}</span>
        <span class="kpi-sub">${k.sub}</span>
      </div>
    `).join("");
  }

  function renderSensors() {
    const s = Telemetry.getActiveStation().sensors;
    document.getElementById("sensorGrid").innerHTML = Object.entries(s).map(([key, sensor]) => {
      let displayVal = sensor.value.toFixed(1);
      let displayUnit = sensor.unit;

      if (sensor.unit === "°C") {
        displayVal = fmtTemp(sensor.value);
        displayUnit = tempUnit();
      } else if (sensor.unit === "m/s") {
        displayVal = fmtSpeed(sensor.value);
        displayUnit = speedUnit();
      }

      return `
        <div class="sensor-tile">
          <span class="sensor-label">${sensor.label}</span>
          <span class="sensor-value">${displayVal} <span style="font-size:0.7rem;color:var(--text-muted)">${displayUnit}</span></span>
          <svg class="sensor-spark" viewBox="0 0 100 26" preserveAspectRatio="none"><path d="${Telemetry.sparkPath(sensor.history)}"/></svg>
          <span class="sensor-range">Live Telemetry</span>
        </div>
      `;
    }).join("");
  }

  function ringSvg(pct, label) {
    const r = 34, c = 2 * Math.PI * r;
    const offset = c - (Math.min(100, Math.max(0, pct)) / 100) * c;
    return `
      <div class="ring-item">
        <svg class="ring-svg" width="88" height="88" viewBox="0 0 88 88">
          <circle class="ring-bg" cx="44" cy="44" r="${r}"/>
          <circle class="ring-fg" cx="44" cy="44" r="${r}" stroke-dasharray="${c}" stroke-dashoffset="${offset}" transform="rotate(-90 44 44)"/>
          <text x="44" y="49" text-anchor="middle" font-family="Outfit" font-size="16" font-weight="700" fill="var(--text-primary)">${Math.round(pct)}%</text>
        </svg>
        <span class="ring-label">${label}</span>
      </div>
    `;
  }

  function renderPower() {
    const p = Telemetry.getActiveStation().power;
    document.getElementById("ringRow").innerHTML =
      ringSvg(p.battery, "Battery") + ringSvg(p.fuel, "Fuel") + ringSvg(p.genLoad, "Gen Load");

    const rows = [
      ["Predicted Demand", p.demand],
      ["Actual Consumed", p.consumed],
      ["Recommended Fuel", p.recFuel],
    ];
    document.getElementById("mixBars").innerHTML = rows.map(([label, val]) => `
      <div class="mix-row">
        <span>${label}</span>
        <div class="mix-track"><div class="mix-fill" style="width:${Math.min(100, (val / 100) * 100)}%"></div></div>
        <span>${val.toFixed(1)}</span>
      </div>
    `).join("");
  }

  function renderRisk() {
    const r = Telemetry.getActiveStation().risk;
    document.getElementById("riskMini").textContent = `${r.total} / 100`;
    const labels = {
      environmental: "Wind/Climate",
      battery: "Battery Deficit",
      fuel: "Fuel Depletion",
      powerLoad: "Generator Stress",
      anomaly: "ML Risk Factor"
    };
    document.getElementById("riskBreakdown").innerHTML = Object.entries(r.breakdown).map(([key, val]) => `
      <div class="risk-row">
        <span>${labels[key] || key}</span>
        <div class="risk-track"><div class="risk-fill" style="width:${Math.min(100, val)}%"></div></div>
        <span>${val}</span>
      </div>
    `).join("");
  }

  const btnProfile = document.getElementById("btnProfile");
const profileDropdown = document.getElementById("profileDropdown");

btnProfile.addEventListener("click", (e) => {
  e.stopPropagation();
  profileDropdown.classList.toggle("open");
});
document.addEventListener("click", () => profileDropdown.classList.remove("open"));
profileDropdown.addEventListener("click", (e) => e.stopPropagation());

  function renderLogs() {
    const logs = Telemetry.logs.slice(-20);
    document.getElementById("logStream").innerHTML = logs.map(l => `
      <div class="log-entry">
        <span class="log-time">${l.time.toLocaleTimeString([], { hour12: false })}</span>
        <span class="log-level ${l.level}">${l.level}</span>
        <span class="log-msg">${l.msg}</span>
      </div>
    `).join("");
  }

  function renderAll() {
    updateToggleUI();
    renderHeader();
    renderAlerts();
    renderStationMeta();
    renderKPIs();
    renderSensors();
    renderPower();
    renderRisk();
    renderLogs();
  }

  // Bind live tick pipeline
  Telemetry.on((event) => {
    if (event === "tick" || event === "stationChange") renderAll();
    if (event === "log") renderLogs();
  });

  // Theme, units & clock listeners
  document.querySelectorAll('[data-unit]').forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll('[data-unit]').forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      unitSystem = btn.dataset.unit;
      renderSensors();
    });
  });

  const btnTheme = document.getElementById("btnTheme");
  if (btnTheme) {
    btnTheme.addEventListener("click", () => {
      const html = document.documentElement;
      html.setAttribute("data-theme", html.getAttribute("data-theme") === "frost-light" ? "icy-dark" : "frost-light");
    });
  }

  const btnPause = document.getElementById("btnPauseTelemetry");
  if (btnPause) {
    btnPause.addEventListener("click", () => {
      const paused = API.togglePause();
      btnPause.classList.toggle("active", paused);
      btnPause.innerHTML = paused
        ? `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`
        : `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`;
    });
  }

  StationMap.build(document.getElementById("stationMap"), null);

  const dimSwitch = document.getElementById("dimSwitch");
  let is3d = false;
  dimSwitch.addEventListener("click", () => {
    is3d = !is3d;
    dimSwitch.dataset.mode = is3d ? "3d" : "2d";
    StationMap.setMode3d(is3d);
  });

  function tickClock() {
    const now = new Date();
    document.getElementById("clockUtc").textContent = now.toUTCString().split(" ")[4];
    const stTime = new Date(now.getTime() + 5 * 3600000);
    document.getElementById("clockStation").textContent = stTime.toISOString().substring(11, 19);
  }
  
  setInterval(tickClock, 1000);
  tickClock();

  renderAll();
})();