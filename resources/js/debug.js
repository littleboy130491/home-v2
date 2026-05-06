const DEBUG = true;

const debugRows = {};
let debugPanel;
let viewportValue;
const DEBUG_PHASES = [
  { key: "scrollY", label: "scroll Y" },
  { key: "sphere", label: "sphere", range: "0–1.5*innerH" },
  { key: "heroFade", label: "heroFade" },
  { key: "section2", label: "section2" },
  { key: "transition", label: "transition", range: "section ≥ 0.54" },
  { key: "copyFade", label: "copyFade", range: "transition ≥ 0.05" },
  { key: "journey", label: "journey" },
  { key: "deviceReveal", label: "deviceReveal", range: "section 0.08–0.26" },
  { key: "frameExit", label: "frameExit", range: "journey 0.04–0.26" },
  { key: "splitLayer", label: "splitLayer", range: "journey 0.16–0.28" },
  { key: "screenMove", label: "screenMove", range: "journey 0.20–0.48" },
  { key: "split", label: "split", range: "journey 0.46–0.74" },
  { key: "proxyExit", label: "proxyExit", range: "journey 0.66–0.84" },
  { key: "cardsReveal", label: "cardsReveal", range: "journey 0.70–0.88" },
  { key: "journeyCopy", label: "journeyCopy", range: "journey 0.72–0.94" },
];

function createDebugPanel() {
  if (!DEBUG) return;

  debugPanel = document.createElement("div");
  debugPanel.id = "debug-panel";
  debugPanel.style.cssText = `
    position: fixed;
    bottom: 1rem;
    right: 1rem;
    z-index: 9999;
    background: rgba(8, 12, 20, 0.86);
    color: #fff;
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
    font-size: 11px;
    line-height: 1.4;
    padding: 12px 14px;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.14);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    user-select: none;
    width: 320px;
    max-height: calc(100vh - 2rem);
    overflow: auto;
  `;

  const header = document.createElement("div");
  header.style.cssText =
    "display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;font-size:10px;opacity:0.85;cursor:pointer;";
  header.innerHTML =
    '<span>animation debug</span><span class="dbg-toggle" style="opacity:0.6;font-weight:400;text-transform:none;">hide</span>';
  debugPanel.appendChild(header);

  const body = document.createElement("div");
  body.className = "dbg-body";
  debugPanel.appendChild(body);

  header.addEventListener("click", () => {
    const hidden = body.style.display === "none";
    body.style.display = hidden ? "" : "none";
    header.querySelector(".dbg-toggle").textContent = hidden ? "hide" : "show";
  });

  const viewportRow = document.createElement("div");
  viewportRow.style.cssText =
    "display:grid;grid-template-columns:100px 1fr;gap:6px;align-items:center;margin:3px 0 8px;padding-bottom:8px;border-bottom:1px solid rgba(255,255,255,0.1);";

  const viewportLabel = document.createElement("span");
  viewportLabel.style.cssText = "opacity:0.85;";
  viewportLabel.textContent = "device viewport";

  viewportValue = document.createElement("span");
  viewportValue.style.cssText =
    "text-align:right;font-variant-numeric:tabular-nums;opacity:0.95;";

  viewportRow.appendChild(viewportLabel);
  viewportRow.appendChild(viewportValue);
  body.appendChild(viewportRow);

  DEBUG_PHASES.forEach(({ key, label, range }) => {
    const row = document.createElement("div");
    row.style.cssText =
      "display:grid;grid-template-columns:100px 44px 1fr;gap:6px;align-items:center;margin:3px 0;";

    const labelEl = document.createElement("span");
    labelEl.style.cssText = "opacity:0.85;";
    labelEl.textContent = label;
    if (range) labelEl.title = range;

    const valueEl = document.createElement("span");
    valueEl.style.cssText =
      "text-align:right;font-variant-numeric:tabular-nums;opacity:0.95;";
    valueEl.textContent = "0.00";

    const bar = document.createElement("div");
    bar.style.cssText =
      "height:6px;background:rgba(255,255,255,0.08);border-radius:3px;overflow:hidden;position:relative;";

    const fill = document.createElement("div");
    fill.style.cssText =
      "height:100%;width:0%;background:linear-gradient(90deg,#4dd3ff,#2cc0df);transition:none;";
    bar.appendChild(fill);

    row.appendChild(labelEl);
    row.appendChild(valueEl);
    row.appendChild(bar);
    body.appendChild(row);

    debugRows[key] = { value: valueEl, fill, row };
  });

  document.body.appendChild(debugPanel);
  updateViewportDebug();
}

function updateViewportDebug() {
  if (!DEBUG || !viewportValue) return;
  viewportValue.textContent = `${Math.round(window.innerWidth)} x ${Math.round(
    window.innerHeight,
  )} px`;
}

function updateStickyDebugRows(activeKeys = []) {
  if (!DEBUG) return;

  const activeKeySet = new Set(activeKeys);

  Object.entries(debugRows).forEach(([key, { row }]) => {
    const stickyActive = activeKeySet.has(key);
    row.style.outline = stickyActive ? "1px solid #ff2d2d" : "";
    row.style.outlineOffset = stickyActive ? "2px" : "";
    row.style.borderRadius = stickyActive ? "4px" : "";
  });
}

function updateDebug(key, value, { showRaw = false, max = 1 } = {}) {
  if (!DEBUG) return;
  const row = debugRows[key];
  if (!row) return;
  const ratio = Math.min(Math.max(value / max, 0), 1);
  row.value.textContent = showRaw
    ? Math.round(value).toString()
    : value.toFixed(2);
  row.fill.style.width = `${ratio * 100}%`;
  const isActive = !showRaw && value > 0 && value < 1;
  const isComplete = !showRaw && value >= 1;
  row.fill.style.background = isActive
    ? "linear-gradient(90deg,#4dd3ff,#2cc0df)"
    : isComplete
      ? "linear-gradient(90deg,#7be39a,#3fb56a)"
      : showRaw
        ? "linear-gradient(90deg,#7a8aa0,#4a566c)"
        : "linear-gradient(90deg,#4a4f5a,#3a3f48)";
  row.value.style.color =
    isActive || isComplete || showRaw ? "#fff" : "rgba(255,255,255,0.55)";
}

createDebugPanel();
window.addEventListener("resize", updateViewportDebug);
window.updateStickyDebugRows = updateStickyDebugRows;
