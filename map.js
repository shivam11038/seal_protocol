/* =========================================================================
   MAP.JS
   Station layout stage — structured to host your 2D and 3D models seamlessly.
   ========================================================================= */

const StationMap = (() => {
  const MODULES = [
    { id: "MAIN-MOD", name: "Central Hab",      x: 230, y: 120, w: 180, h: 110, desc: "Primary crew life-support envelope and operations core." },
    { id: "ENERGY",   name: "Power Inverters",  x: 60,  y: 70,  w: 120, h: 80,  desc: "Combined fuel generators and wind/solar bus controllers." },
    { id: "SCIENCE",  name: "Earth Sciences",   x: 60,  y: 200, w: 120, h: 80,  desc: "Meteorology, glaciology, and seismological analysis rack." },
    { id: "COMMS",    name: "Ground Station",   x: 460, y: 130, w: 130, h: 90,  desc: "Satellite tracking radome and NCPOR direct downlink link." },
  ];

  const FLOWS = [
    { from: "ENERGY", to: "MAIN-MOD" },
    { from: "SCIENCE", to: "MAIN-MOD" },
    { from: "MAIN-MOD", to: "COMMS" },
  ];

  function center(m){ return { x: m.x + m.w / 2, y: m.y + m.h / 2 }; }
  function byId(id){ return MODULES.find(m => m.id === id); }

  let svgEl = null;
  let onSelect = null;

  function build(svgElement, selectCallback){
    svgEl = svgElement;
    onSelect = selectCallback;

    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("class", "map-scene");
    svgEl.innerHTML = "";
    svgEl.appendChild(g);

    FLOWS.forEach((f, i) => {
      const a = center(byId(f.from)), b = center(byId(f.to));
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", `M${a.x},${a.y} L${b.x},${b.y}`);
      path.setAttribute("class", "flow-line");
      g.appendChild(path);

      const particle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      particle.setAttribute("r", "3.5");
      particle.setAttribute("class", "flow-particle");
      const animMotion = document.createElementNS("http://www.w3.org/2000/svg", "animateMotion");
      animMotion.setAttribute("dur", `${2.2 + i * 0.4}s`);
      animMotion.setAttribute("repeatCount", "indefinite");
      animMotion.setAttribute("path", `M${a.x},${a.y} L${b.x},${b.y}`);
      particle.appendChild(animMotion);
      g.appendChild(particle);
    });

    MODULES.forEach(m => {
      const node = document.createElementNS("http://www.w3.org/2000/svg", "g");
      node.setAttribute("class", "station-module");

      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttribute("x", m.x);
      rect.setAttribute("y", m.y);
      rect.setAttribute("width", m.w);
      rect.setAttribute("height", m.h);
      rect.setAttribute("rx", 12);
      rect.setAttribute("fill", "rgba(0,180,216,0.18)");
      rect.setAttribute("stroke", "var(--soft-aurora)");
      rect.setAttribute("stroke-width", "1.2");
      node.appendChild(rect);

      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("x", m.x + m.w / 2);
      label.setAttribute("y", m.y + m.h / 2 - 2);
      label.setAttribute("text-anchor", "middle");
      label.textContent = m.id;
      node.appendChild(label);

      const sub = document.createElementNS("http://www.w3.org/2000/svg", "text");
      sub.setAttribute("x", m.x + m.w / 2);
      sub.setAttribute("y", m.y + m.h / 2 + 15);
      sub.setAttribute("text-anchor", "middle");
      sub.setAttribute("font-size", "9");
      sub.style.fill = "var(--text-muted)";
      sub.textContent = m.name;
      node.appendChild(sub);

      node.addEventListener("click", () => onSelect && onSelect(m));
      g.appendChild(node);
    });
  }

  function setMode3d(is3d){
    if (!svgEl) return;
    svgEl.classList.toggle("mode-3d", is3d);
  }

  return { build, setMode3d, MODULES };
})();