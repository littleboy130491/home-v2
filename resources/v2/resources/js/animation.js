const sphere = document.getElementById("sphere");
const device = document.getElementById("device");
const screenSplit = document.getElementById("screen-split");
const rectTargets = [
  { key: "sphere", element: sphere },
  { key: "device", element: device },
  { key: "screenSplit", element: screenSplit },
];

function updateAnimation() {
  rectTargets.forEach(({ key, element }) => {
    if (!element) {
      return;
    }

    const triggerRect = element.getBoundingClientRect();
    window.debugBoundingRect?.(key, triggerRect, element);
  });
}

updateAnimation();
window.addEventListener("scroll", updateAnimation, { passive: true });
window.addEventListener("resize", updateAnimation);
window.addEventListener("debug:ready", updateAnimation);
