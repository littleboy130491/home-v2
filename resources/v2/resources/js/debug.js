(function () {
  const DEBUG = true;

  const rows = new Map();
  const rectState = new Map();
  let debugPanel;
  let panelBody;
  let viewportValue;
  let activeStickyKeys = new Set();
  let ticking = false;
  let rectTargets = [];

  const clamp = (value, min = 0, max = 1) => Math.min(Math.max(value, min), max);
  const px = (value) => `${Math.round(value)}px`;

  function getRectProgress(rect, measure) {
    if (measure === "rect") {
      const viewportHeight = Math.max(window.innerHeight, 1);
      const progress = clamp((viewportHeight - rect.top) / viewportHeight);

      return {
        progress,
        visible: isRectVisible(rect),
        pointVisible: rect.top >= 0 && rect.top <= viewportHeight,
      };
    }

    const viewportHeight = Math.max(window.innerHeight, 1);
    const viewportWidth = Math.max(window.innerWidth, 1);
    const point = getRectCenter(rect);
    const progress = clamp(point.y / viewportHeight);
    const pointVisible =
      point.x >= 0 &&
      point.x <= viewportWidth &&
      point.y >= 0 &&
      point.y <= viewportHeight;

    return { point, progress, visible: isRectVisible(rect), pointVisible };
  }

  function getRectCenter(rect) {
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }

  function isRectVisible(rect) {
    return (
      rect.bottom > 0 &&
      rect.top < window.innerHeight &&
      rect.right > 0 &&
      rect.left < window.innerWidth
    );
  }

  function setStyles(element, styles) {
    Object.assign(element.style, styles);
  }

  function createPanel() {
    if (!DEBUG || document.getElementById("rect-debug-panel")) {
      return;
    }

    debugPanel = document.createElement("aside");
    debugPanel.id = "rect-debug-panel";
    debugPanel.setAttribute("aria-label", "Bounding rectangle debug panel");
    setStyles(debugPanel, {
      position: "fixed",
      right: "16px",
      bottom: "16px",
      zIndex: "99999",
      width: "360px",
      maxWidth: "calc(100vw - 32px)",
      maxHeight: "calc(100vh - 32px)",
      overflow: "hidden",
      border: "1px solid rgba(255, 255, 255, 0.16)",
      borderRadius: "8px",
      background: "rgba(8, 13, 22, 0.9)",
      color: "#f8fbff",
      boxShadow: "0 18px 48px rgba(0, 0, 0, 0.45)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
      fontSize: "11px",
      lineHeight: "1.35",
      pointerEvents: "auto",
    });

    const header = document.createElement("button");
    header.type = "button";
    setStyles(header, {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      width: "100%",
      border: "0",
      borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
      padding: "10px 12px",
      background: "rgba(255, 255, 255, 0.04)",
      color: "inherit",
      cursor: "pointer",
      font: "inherit",
      textAlign: "left",
      textTransform: "uppercase",
      letterSpacing: "0.04em",
    });

    const title = document.createElement("span");
    title.textContent = "rect debug";
    title.style.fontWeight = "700";

    const toggle = document.createElement("span");
    toggle.textContent = "hide";
    toggle.style.opacity = "0.64";
    toggle.style.textTransform = "none";

    header.append(title, toggle);

    panelBody = document.createElement("div");
    setStyles(panelBody, {
      display: "grid",
      gap: "8px",
      maxHeight: "calc(100vh - 84px)",
      overflow: "auto",
      padding: "10px 12px 12px",
    });

    const viewportRow = document.createElement("div");
    setStyles(viewportRow, {
      display: "grid",
      gridTemplateColumns: "minmax(0, 1fr) auto",
      gap: "8px",
      alignItems: "center",
      padding: "7px",
      border: "1px solid rgba(255, 255, 255, 0.08)",
      borderRadius: "6px",
      background: "rgba(255, 255, 255, 0.035)",
      fontVariantNumeric: "tabular-nums",
    });

    const viewportLabel = document.createElement("span");
    viewportLabel.textContent = "device viewport";
    viewportLabel.style.color = "rgba(255, 255, 255, 0.86)";

    viewportValue = document.createElement("span");
    viewportValue.style.color = "#ffffff";
    viewportValue.style.fontWeight = "700";

    viewportRow.append(viewportLabel, viewportValue);
    panelBody.appendChild(viewportRow);

    header.addEventListener("click", () => {
      const hidden = panelBody.hidden;
      panelBody.hidden = !hidden;
      toggle.textContent = hidden ? "hide" : "show";
    });

    debugPanel.append(header, panelBody);
    document.body.appendChild(debugPanel);
    updateViewportRow();

  }

  function updateViewportRow() {
    if (!viewportValue) {
      return;
    }

    viewportValue.textContent = `${Math.round(window.innerWidth)} x ${Math.round(
      window.innerHeight,
    )} px`;
  }

  function updateStickyDebugRows(activeKeys = []) {
    if (!DEBUG) {
      return;
    }

    activeStickyKeys = new Set(activeKeys);

    rows.forEach((row, key) => {
      if (!row) {
        return;
      }

      updateStickyDebugRow(key, row);
    });
  }

  function onStickyStart({ key }) {
    activeStickyKeys.add(key);
    updateStickyDebugRows(activeStickyKeys);
  }

  function onStickyEnd({ key }) {
    activeStickyKeys.delete(key);
    updateStickyDebugRows(activeStickyKeys);
  }

  function updateStickyDebugRow(key, row) {
    const stickyActive = activeStickyKeys.has(key);
    row.row.style.borderColor = stickyActive
      ? "#ff2d2d"
      : "rgba(255, 255, 255, 0.08)";
  }

  function createRow(key, label, measure) {
    if (!panelBody) {
      return;
    }

    const existing = rows.get(key);
    if (existing?.measure === measure) {
      return;
    }

    if (existing) {
      existing.row.remove();
      rows.delete(key);
    }

    const row = document.createElement("div");
    setStyles(row, {
      display: "grid",
      gap: "5px",
      padding: "7px",
      border: "1px solid rgba(255, 255, 255, 0.08)",
      borderRadius: "6px",
      background: "rgba(255, 255, 255, 0.035)",
    });

    const topLine = document.createElement("div");
    setStyles(topLine, {
      display: "grid",
      gridTemplateColumns: "minmax(0, 1fr) auto",
      gap: "8px",
      alignItems: "center",
    });

    const labelEl = document.createElement("span");
    labelEl.textContent = label;
    setStyles(labelEl, {
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      color: "rgba(255, 255, 255, 0.86)",
    });

    const valueEl = document.createElement("span");
    valueEl.textContent = "0.00";
    setStyles(valueEl, {
      color: "#ffffff",
      fontVariantNumeric: "tabular-nums",
      fontWeight: "700",
    });

    const bar = document.createElement("div");
    setStyles(bar, {
      height: "6px",
      overflow: "hidden",
      borderRadius: "999px",
      background: "rgba(255, 255, 255, 0.1)",
    });

    const fill = document.createElement("div");
    setStyles(fill, {
      width: "0%",
      height: "100%",
      borderRadius: "inherit",
      background: "linear-gradient(90deg, #55d7ff, #77f2a1)",
    });
    bar.appendChild(fill);

    const metrics = document.createElement("div");
    setStyles(metrics, {
      display: "grid",
      gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
      gap: "5px",
      color: "rgba(255, 255, 255, 0.66)",
      fontVariantNumeric: "tabular-nums",
    });

    const metricEls =
      measure === "rect"
        ? {
            top: createMetric("top"),
            bottom: createMetric("bottom"),
            height: createMetric("height"),
            visible: createMetric("visible"),
          }
        : {
            centerX: createMetric("cx"),
            centerY: createMetric("cy"),
            width: createMetric("width"),
            visible: createMetric("visible"),
          };

    metrics.append(...Object.values(metricEls));
    topLine.append(labelEl, valueEl);
    row.append(topLine, bar, metrics);
    panelBody.appendChild(row);

    rows.set(key, {
      row,
      measure,
      label: labelEl,
      value: valueEl,
      fill,
      metrics: metricEls,
    });
    updateStickyDebugRow(key, rows.get(key));
  }

  function createMetric(label) {
    const wrapper = document.createElement("span");
    wrapper.dataset.label = label;
    wrapper.textContent = `${label}: -`;
    return wrapper;
  }

  function updateRow(key, label, rect, measure) {
    createRow(key, label, measure);

    const row = rows.get(key);
    if (!row) {
      return;
    }

    const { point, progress, visible, pointVisible } = getRectProgress(
      rect,
      measure,
    );
    row.value.textContent = progress.toFixed(2);
    row.fill.style.width = `${progress * 100}%`;
    row.fill.style.background = pointVisible
      ? "linear-gradient(90deg, #55d7ff, #77f2a1)"
      : "linear-gradient(90deg, #667085, #98a2b3)";
    row.row.style.opacity = visible ? "1" : "0.72";

    if (measure === "rect") {
      row.metrics.top.textContent = `top: ${px(rect.top)}`;
      row.metrics.bottom.textContent = `bottom: ${px(rect.bottom)}`;
      row.metrics.height.textContent = `height: ${px(rect.height)}`;
    } else {
      row.metrics.centerX.textContent = `cx: ${px(point.x)}`;
      row.metrics.centerY.textContent = `cy: ${px(point.y)}`;
      row.metrics.width.textContent = `width: ${px(rect.width)}`;
    }

    row.metrics.visible.textContent = visible ? "visible: yes" : "visible: no";
  }

  function rememberRect(key, label, rect, measure = "center") {
    rectState.set(key, {
      label,
      measure,
      rect: {
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      },
    });
  }

  function collectRectTargets() {
    rectTargets = [
      {
        key: "sphere",
        element: document.getElementById("sphere"),
        measure: "center",
      },
      {
        key: "stats",
        element: document.getElementById("stats"),
        measure: "rect",
      },
      {
        key: "device",
        element: document.getElementById("device"),
        measure: "center",
      },
      {
        key: "screenSplit",
        element: document.getElementById("screen-split"),
        measure: "center",
      },
    ];
  }

  function updateDebugRects() {
    rectTargets.forEach(({ key, element, measure }) => {
      if (!element) {
        return;
      }

      const label = element.id
        ? `#${element.id}`
        : element.className
          ? `.${element.className}`
          : key;

      rememberRect(key, label, element.getBoundingClientRect(), measure);
    });

    requestMeasure();
  }

  function measureTargets() {
    updateViewportRow();
    rectState.forEach(({ label, rect, measure }, key) =>
      updateRow(key, label, rect, measure),
    );
  }

  function requestMeasure() {
    if (ticking) {
      return;
    }

    ticking = true;
    window.requestAnimationFrame(() => {
      ticking = false;
      measureTargets();
    });
  }

  window.onStickyStart = onStickyStart;
  window.onStickyEnd = onStickyEnd;

  function init() {
    createPanel();
    collectRectTargets();
    updateDebugRects();
    window.dispatchEvent(new Event("debug:ready"));
  }

  window.addEventListener("scroll", updateDebugRects, { passive: true });
  window.addEventListener("resize", () => {
    collectRectTargets();
    updateDebugRects();
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
