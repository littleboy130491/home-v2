(function () {
  const DEBUG = true;

  const rows = new Map();
  const rectState = new Map();
  let panelBody;
  let ticking = false;

  const clamp = (value, min = 0, max = 1) => Math.min(Math.max(value, min), max);
  const px = (value) => `${Math.round(value)}px`;

  function getRectProgress(rect) {
    const viewportHeight = Math.max(window.innerHeight, 1);
    const viewportWidth = Math.max(window.innerWidth, 1);
    const center = getRectCenter(rect);
    const progress = clamp(center.y / viewportHeight);
    const visible =
      rect.bottom > 0 &&
      rect.top < viewportHeight &&
      rect.right > 0 &&
      rect.left < viewportWidth;
    const centered =
      center.x >= 0 &&
      center.x <= viewportWidth &&
      center.y >= 0 &&
      center.y <= viewportHeight;

    return { center, progress, visible, centered };
  }

  function getRectCenter(rect) {
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  }

  function setStyles(element, styles) {
    Object.assign(element.style, styles);
  }

  function createPanel() {
    if (!DEBUG || document.getElementById("rect-debug-panel")) {
      return;
    }

    const panel = document.createElement("aside");
    panel.id = "rect-debug-panel";
    panel.setAttribute("aria-label", "Bounding rectangle debug panel");
    setStyles(panel, {
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

    header.addEventListener("click", () => {
      const hidden = panelBody.hidden;
      panelBody.hidden = !hidden;
      toggle.textContent = hidden ? "hide" : "show";
    });

    panel.append(header, panelBody);
    document.body.appendChild(panel);

  }

  function createRow(key, label) {
    if (!panelBody || rows.has(key)) {
      return;
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

    const metricEls = {
      centerX: createMetric("cx"),
      centerY: createMetric("cy"),
      width: createMetric("width"),
      visible: createMetric("visible"),
    };

    metrics.append(
      metricEls.centerX,
      metricEls.centerY,
      metricEls.width,
      metricEls.visible,
    );
    topLine.append(labelEl, valueEl);
    row.append(topLine, bar, metrics);
    panelBody.appendChild(row);

    rows.set(key, {
      row,
      label: labelEl,
      value: valueEl,
      fill,
      metrics: metricEls,
    });
  }

  function createMetric(label) {
    const wrapper = document.createElement("span");
    wrapper.dataset.label = label;
    wrapper.textContent = `${label}: -`;
    return wrapper;
  }

  function updateRow(key, label, rect) {
    createRow(key, label);

    const row = rows.get(key);
    if (!row) {
      return;
    }

    const { center, progress, visible, centered } = getRectProgress(rect);
    row.value.textContent = progress.toFixed(2);
    row.fill.style.width = `${progress * 100}%`;
    row.fill.style.background = centered
      ? "linear-gradient(90deg, #55d7ff, #77f2a1)"
      : "linear-gradient(90deg, #667085, #98a2b3)";
    row.row.style.opacity = visible ? "1" : "0.72";
    row.metrics.centerX.textContent = `cx: ${px(center.x)}`;
    row.metrics.centerY.textContent = `cy: ${px(center.y)}`;
    row.metrics.width.textContent = `width: ${px(rect.width)}`;
    row.metrics.visible.textContent = visible ? "visible: yes" : "visible: no";
  }

  function rememberRect(key, label, rect) {
    rectState.set(key, {
      label,
      rect: {
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        centerX: rect.left + rect.width / 2,
        centerY: rect.top + rect.height / 2,
      },
    });
  }

  function measureTargets() {
    rectState.forEach(({ label, rect }, key) => updateRow(key, label, rect));
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

  window.debugBoundingRect = function debugBoundingRect(key, rect, element) {
    if (!DEBUG || !rect) {
      return;
    }

    const label = element?.id
      ? `#${element.id}`
      : element?.className
        ? `.${element.className}`
        : key;
    rememberRect(key, label, rect);
    requestMeasure();
  };

  function init() {
    createPanel();
    requestMeasure();
    window.dispatchEvent(new Event("debug:ready"));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
