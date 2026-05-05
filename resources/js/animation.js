const sphere = document.querySelector("#hero-sphere");
const hero = document.querySelector("#hero");
const root = document.documentElement;
const section2 = document.querySelector("#section-2");
const section2Scroll = document.querySelector("#section-2-scroll");
const section2Copy = document.querySelector("#section-2-copy");
const journey = document.querySelector("#journey");
const cardWrapper = document.querySelector("#card-wrapper");
const journeyCards = [...document.querySelectorAll(".journey-card")];
const device = document.querySelector("#device");
const screen = document.querySelector(".device-screen");
let deviceIsOn = false;
let ticking = false;

const clamp = (value, min = 0, max = 1) => Math.min(Math.max(value, min), max);
const lerp = (start, end, progress) => start + (end - start) * progress;
const ease = (progress) => progress * progress * (3 - 2 * progress);
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

function setRootProperty(name, value) {
  root.style.setProperty(name, value);
}

function getSectionScrollProgress(section) {
  if (!section) {
    return 0;
  }

  const rect = section.getBoundingClientRect();
  const scrollableDistance = Math.max(1, section.offsetHeight - window.innerHeight);

  return clamp(-rect.top / scrollableDistance);
}

function getJourneyEntryProgress() {
  if (!journey) {
    return 0;
  }

  const rect = journey.getBoundingClientRect();

  return clamp((window.innerHeight - rect.top) / (window.innerHeight * 1.15));
}

function getCardGap() {
  if (!cardWrapper) {
    return 0;
  }

  const styles = window.getComputedStyle(cardWrapper);

  return Number.parseFloat(styles.columnGap || styles.gap) || 0;
}

function updateSection2ToJourneyTransition() {
  if (!section2 || !journey) {
    return;
  }

  const screenIsOn = deviceIsOn || device?.classList.contains("is-on");

  if (prefersReducedMotion.matches) {
    setRootProperty("--section-2-copy-opacity", "1");
    setRootProperty("--section-2-copy-y", "0px");
    setRootProperty("--device-transition-scale", "1");
    setRootProperty("--device-transition-y", "0px");
    setRootProperty("--journey-copy-opacity", screenIsOn ? "1" : "0");
    setRootProperty("--journey-copy-y", "0px");
    setRootProperty("--journey-cards-opacity", "1");
    setRootProperty("--journey-card-scale", "1");
    setRootProperty("--journey-card-y", "0px");
    setRootProperty("--journey-card-shift", "0px");
    return;
  }

  const sectionProgress = getSectionScrollProgress(section2Scroll);
  const transitionProgress = ease(clamp((sectionProgress - 0.54) / 0.46));
  const copyFadeProgress = ease(clamp((transitionProgress - 0.05) / 0.52));
  const journeyProgress = getJourneyEntryProgress();
  const cardsSpreadProgress = ease(clamp(journeyProgress / 0.82));
  const journeyCopyProgress = screenIsOn
    ? ease(clamp((journeyProgress - 0.34) / 0.46))
    : 0;
  const cardWidth = journeyCards[0]?.getBoundingClientRect().width || 0;
  const cardShift = (cardWidth + getCardGap()) * (1 - cardsSpreadProgress);

  setRootProperty("--section-2-copy-opacity", 1 - copyFadeProgress);
  setRootProperty("--section-2-copy-y", `${lerp(0, -44, copyFadeProgress)}px`);
  setRootProperty("--device-transition-scale", "1");
  setRootProperty("--device-transition-y", "0px");
  setRootProperty("--journey-copy-opacity", journeyCopyProgress);
  setRootProperty(
    "--journey-copy-y",
    `${lerp(48, 0, journeyCopyProgress)}px`,
  );
  setRootProperty("--journey-cards-opacity", "1");
  setRootProperty(
    "--journey-card-scale",
    lerp(0.74, 1, cardsSpreadProgress),
  );
  setRootProperty("--journey-card-y", `${lerp(44, 0, cardsSpreadProgress)}px`);
  setRootProperty("--journey-card-shift", `${cardShift}px`);
}

function setDevicePower(isOn) {
  if (deviceIsOn === isOn) {
    return;
  }

  device.classList.toggle("is-on", isOn);
  section2Copy?.classList.toggle("is-visible", isOn);
  deviceIsOn = isOn;
}

function updateAnimation() {
  ticking = false;
  updateHeroBackgroundFade();
  updateSphereAnimation();

  if (!sphere || !device || !screen) {
    updateSection2ToJourneyTransition();
    return;
  }

  setDevicePower(getSphereProgress() >= 1);
  updateSection2ToJourneyTransition();
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
