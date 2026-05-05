const sphere = document.querySelector("#hero-sphere");
const hero = document.querySelector("#hero");
const device = document.querySelector("#device");
const screen = document.querySelector(".device-screen");
let deviceIsOn = false;
let ticking = false;

const clamp = (value, min = 0, max = 1) => Math.min(Math.max(value, min), max);
const lerp = (start, end, progress) => start + (end - start) * progress;
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
);

const animationSettings = {
  // Sphere path progress is tied to scroll distance.
  // Larger number = slower movement. Smaller number = faster movement.
  sphereScrollDistance: 1.5,

  // Fine-tune where the sphere disappears relative to the device screen center.
  // x: positive moves right, negative moves left.
  // y: positive moves down, negative moves up.
  sphereEndpointOffset: {
    x: 0,
    y: 0,
  },

  // Final sphere size at the screen center before it disappears.
  sphereEndpointSize: 20,

  // Hero background fade while scrolling.
  // Lower minimum opacity = stronger fade.
  heroBackgroundMinOpacity: 0.02,

  // Larger number = fade happens later/slower. Smaller number = earlier/faster.
  heroBackgroundFadeDistance: 0.6,
};

const sphereTimeline = [
  { progress: 0, x: 0.55, y: 0.28, size: 300, scale: 1, opacity: 1 },
  { progress: 0.48, x: 0.52, y: 0.42, size: 320, scale: 1, opacity: 1 },
  { progress: 0.68, x: 0.5, y: 0.58, size: 220, scale: 1, opacity: 0.95 },
  { progress: 0.82, x: 0.48, y: 0.67, size: 130, scale: 1, opacity: 0.85 },
];

function getSphereProgress() {
  return clamp(
    window.scrollY /
      (window.innerHeight * animationSettings.sphereScrollDistance),
  );
}

function getDeviceScreenCenter() {
  if (!screen) {
    return {
      x: window.innerWidth * 0.45,
      y: window.innerHeight * 0.74,
    };
  }

  const screenRect = screen.getBoundingClientRect();

  return {
    x: screenRect.left + screenRect.width / 2,
    y: screenRect.top + screenRect.height / 2,
  };
}

function getSphereTimeline() {
  const screenCenter = getDeviceScreenCenter();

  return [
    ...sphereTimeline.map((frame) => ({
      ...frame,
      x: window.innerWidth * frame.x,
      y: window.innerHeight * frame.y,
    })),
    {
      progress: 1,
      x: screenCenter.x + animationSettings.sphereEndpointOffset.x,
      y: screenCenter.y + animationSettings.sphereEndpointOffset.y,
      size: animationSettings.sphereEndpointSize,
      scale: 1,
      opacity: 0,
    },
  ];
}

function getSphereFrame(progress) {
  const timeline = getSphereTimeline();
  const nextIndex = timeline.findIndex((frame) => frame.progress >= progress);

  if (nextIndex <= 0) {
    return timeline[0];
  }

  const previousFrame = timeline[nextIndex - 1];
  const nextFrame = timeline[nextIndex] || timeline.at(-1);
  const frameProgress = clamp(
    (progress - previousFrame.progress) /
      (nextFrame.progress - previousFrame.progress),
  );

  return {
    x: lerp(previousFrame.x, nextFrame.x, frameProgress),
    y: lerp(previousFrame.y, nextFrame.y, frameProgress),
    size: lerp(previousFrame.size, nextFrame.size, frameProgress),
    scale: lerp(previousFrame.scale, nextFrame.scale, frameProgress),
    opacity: lerp(previousFrame.opacity, nextFrame.opacity, frameProgress),
  };
}

function updateSphereAnimation() {
  if (!sphere || prefersReducedMotion.matches) {
    return;
  }

  const frame = getSphereFrame(getSphereProgress());
  sphere.style.setProperty("--sphere-x", `${frame.x}px`);
  sphere.style.setProperty("--sphere-y", `${frame.y}px`);
  sphere.style.setProperty("--sphere-size", `${frame.size}px`);
  sphere.style.setProperty("--sphere-scale", frame.scale);
  sphere.style.opacity = frame.opacity;
}

function updateHeroBackgroundFade() {
  if (!hero) {
    return;
  }

  const fadeProgress = clamp(
    window.scrollY /
      (hero.offsetHeight * animationSettings.heroBackgroundFadeDistance),
  );
  const opacity = lerp(
    1,
    animationSettings.heroBackgroundMinOpacity,
    fadeProgress,
  );
  hero.style.setProperty("--hero-bg-opacity", opacity);
}

function sphereHasReachedScreenCenter(sphereRect, screenRect) {
  const sphereCenterX = sphereRect.left + sphereRect.width / 2;
  const sphereCenterY = sphereRect.top + sphereRect.height / 2;
  const screenCenterX = screenRect.left + screenRect.width / 2;
  const screenCenterY = screenRect.top + screenRect.height / 2;
  const distanceFromCenter = Math.hypot(
    sphereCenterX - screenCenterX,
    sphereCenterY - screenCenterY,
  );
  const arrivalTolerance = Math.max(
    8,
    Math.min(screenRect.width, screenRect.height) * 0.05,
  );

  return distanceFromCenter <= arrivalTolerance;
}

function setDevicePower(isOn) {
  if (deviceIsOn === isOn) {
    return;
  }

  device.classList.toggle("is-on", isOn);
  deviceIsOn = isOn;
}

function updateAnimation() {
  ticking = false;
  updateHeroBackgroundFade();
  updateSphereAnimation();

  if (!sphere || !device || !screen) {
    return;
  }

  const sphereRect = sphere.getBoundingClientRect();
  const screenRect = screen.getBoundingClientRect();
  const sphereHasArrived =
    getSphereProgress() >= 1 ||
    sphereHasReachedScreenCenter(sphereRect, screenRect);
  setDevicePower(sphereHasArrived);
}

function requestAnimationUpdate() {
  if (!ticking) {
    window.requestAnimationFrame(updateAnimation);
    ticking = true;
  }
}

requestAnimationUpdate();
window.addEventListener("scroll", requestAnimationUpdate, { passive: true });
window.addEventListener("resize", requestAnimationUpdate);
prefersReducedMotion.addEventListener("change", requestAnimationUpdate);
