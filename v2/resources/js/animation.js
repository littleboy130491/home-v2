gsap.registerPlugin(ScrollTrigger);

const sphere = document.querySelector("#sphere");
const heroCopy = document.querySelector("#hero .flow");
const scene = document.querySelector("#scene");
const scenePin = document.querySelector("#scene-pin");
const device = document.querySelector("#device");
const deviceScreen = document.querySelector("#device-screen");
const screenMedia = document.querySelector("#screen-media");
const screenOff = document.querySelector("#screen-off");
const statsCopy = document.querySelector("#stats-copy");
const journey = document.querySelector("#journey");
const journeyCopy = document.querySelector("#journey-copy");
const cardsWrapper = document.querySelector("#journey-cards-wrapper");
const cards = gsap.utils.toArray(".journey-card");
const cardScreens = gsap.utils.toArray(".journey-card-screen");
const cardContents = gsap.utils.toArray(".journey-card-content");

const px = (value) => `${value}px`;
const vw = (n) => (window.innerWidth * n) / 100;
const vh = (n) => (window.innerHeight * n) / 100;

/*
  Layout-based rect relative to an ancestor (offsetLeft/Top ignore
  transforms, so measurements stay correct while elements are
  translated and while #scene-pin is pinned).
*/
function rectWithin(element, ancestor) {
  let x = 0;
  let y = 0;
  let node = element;

  while (node && node !== ancestor) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent;
  }

  return { x, y, width: element.offsetWidth, height: element.offsetHeight };
}

/* SPLIT_DISTANCE: how far the outer cards travel when separated —
   equals the row gap, so the cards land in their natural layout */
function getCardGap() {
  const styles = getComputedStyle(cardsWrapper);
  const gap = Number.parseFloat(styles.columnGap || styles.gap);
  return Number.isFinite(gap) ? gap : 36;
}

/*
  Center of the journey card row, relative to #scene-pin. The desktop
  screen is aligned to it; since each card is exactly one third of the
  screen, the flush (gapless) card trio then tiles the screen exactly.
  While the scene is pinned these coordinates double as viewport
  coordinates.
*/
function getCardsCenter() {
  const wrap = rectWithin(cardsWrapper, scenePin);
  return { x: wrap.x + wrap.width / 2, y: wrap.y + wrap.height / 2 };
}

/*
  Static offset that centers the device screen on the card row. Used as
  the device's base transform; the rise-in animates relative to it.
*/
function getDeviceAlignOffset() {
  const center = getCardsCenter();
  const screenRect = rectWithin(deviceScreen, scenePin);
  const inner = {
    x: screenRect.x + deviceScreen.clientLeft,
    y: screenRect.y + deviceScreen.clientTop,
    width: deviceScreen.clientWidth,
    height: deviceScreen.clientHeight,
  };

  return {
    x: center.x - (inner.x + inner.width / 2),
    y: center.y - (inner.y + inner.height / 2),
  };
}

function setDevicePower(isOn) {
  device.classList.toggle("is-on", isOn);
}

function setJourneyInteractive(isInteractive) {
  journey.classList.toggle("is-interactive", isInteractive);
  journey.toggleAttribute("inert", !isInteractive);
}

/*
  Phase map ported from animation.html (fractions of total progress):

    p1  0.00 - 0.25  hero copy fades, sphere travels, desktop rises in
    p2  0.20 - 0.42  sphere shrinks into the desktop, screen wakes up
        0.28 - 0.42  section 2 (stats) copy fades in
    p3  0.44 - 0.62  stats copy fades away, desktop stays fixed
    p4  0.58 - 0.82  split-example.html: card slices tile the live
                     screen, the bezel fades, and the outer cards
                     slide apart horizontally — nothing else moves
        0.76 - 0.86  slices fade out to reveal the card content
    p5  0.80 - 0.94  section 3 (journey) copy appears
*/
const PHASES = [
  [0, "hero / sphere travels"],
  [0.2, "sphere enters desktop"],
  [0.28, "stats copy in"],
  [0.44, "stats copy out"],
  [0.58, "screen splits (slide)"],
  [0.76, "card content reveal"],
  [0.8, "journey copy in"],
  [0.94, "end hold"],
];

function getPhase(progress) {
  let name = PHASES[0][1];

  for (const [position, phaseName] of PHASES) {
    if (progress >= position) {
      name = phaseName;
    }
  }

  return name;
}

function createAnimationDebugPanel() {
  const panel = document.createElement("aside");
  panel.id = "animation-debug-panel";
  panel.setAttribute("aria-hidden", "true");
  Object.assign(panel.style, {
    position: "fixed",
    left: "16px",
    bottom: "16px",
    zIndex: "99999",
    minWidth: "300px",
    padding: "10px 12px",
    border: "1px solid rgba(255, 255, 255, 0.16)",
    borderRadius: "8px",
    background: "rgba(8, 13, 22, 0.9)",
    color: "#f8fbff",
    fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
    fontSize: "11px",
    lineHeight: "1.7",
    whiteSpace: "pre",
    pointerEvents: "none",
  });
  document.body.appendChild(panel);
  return panel;
}

const mm = gsap.matchMedia();

mm.add("(prefers-reduced-motion: no-preference)", () => {
  setDevicePower(false);
  setJourneyInteractive(false);

  /* pins the stage while the master timeline plays */
  ScrollTrigger.create({
    trigger: scene,
    start: "top top",
    end: "bottom bottom",
    pin: scenePin,
    pinSpacing: false,
    invalidateOnRefresh: true,
  });

  /*
    Master scrubbed timeline over the whole stage (page top to scene
    end), mirroring animation.html's animate() — durations/positions
    are the same fractions of total progress.
  */
  const master = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      trigger: document.body,
      start: 0,
      end: () =>
        scene.getBoundingClientRect().top +
        window.scrollY +
        scene.offsetHeight -
        window.innerHeight,
      scrub: true,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        setDevicePower(self.progress > 0.4 ? true : false);
        setJourneyInteractive(self.progress > 0.9);
      },
    },
  });

  /* p1: hero copy fades away while the sphere travels down */
  master.to(
    heroCopy,
    { autoAlpha: 0, y: -70, duration: 0.2, ease: "power2.inOut" },
    0,
  );

  /* sphere path: hero focal point -> desktop screen center (p1),
     then shrink + fade into the screen (p2) */
  master
    .fromTo(
      sphere,
      {
        "--sphere-x": () => px(vw(55)),
        "--sphere-y": () => px(vh(28)),
        "--sphere-scale": 1,
        opacity: 1,
      },
      {
        "--sphere-x": () => px(getCardsCenter().x),
        "--sphere-y": () => px(getCardsCenter().y),
        duration: 0.25,
        ease: "power2.inOut",
      },
      0,
    )
    .to(
      sphere,
      { "--sphere-scale": 0.22, opacity: 0, duration: 0.22, ease: "power3.out" },
      0.2,
    );

  /* desktop rises in during p1 (y 90 -> 0, scale .86 -> 1), on top of
     the static alignment offset that centers it on the card row */
  master.fromTo(
    device,
    {
      x: () => getDeviceAlignOffset().x,
      y: () => getDeviceAlignOffset().y + 90,
      scale: 0.86,
      autoAlpha: 0,
    },
    {
      y: () => getDeviceAlignOffset().y,
      scale: 1,
      autoAlpha: 1,
      duration: 0.2,
      ease: "power3.out",
    },
    0.04,
  );

  /* p2: the screen wakes up as the sphere enters (gradual, scrubbed) */
  master.fromTo(
    screenOff,
    { opacity: 1 },
    { opacity: 0, duration: 0.22, ease: "power3.out" },
    0.2,
  );

  /* stats copy in after the desktop wakes, out during p3 */
  master
    .fromTo(
      statsCopy,
      { autoAlpha: 0, y: 60 },
      { autoAlpha: 1, y: 0, duration: 0.14, ease: "power3.out" },
      0.28,
    )
    .to(
      statsCopy,
      { autoAlpha: 0, y: -48, duration: 0.18, ease: "power2.out" },
      0.44,
    );

  /* p4: split-example.html — the card slices appear flush over the
     live screen (seamless, they show the same image). The screen image
     is then hard-hidden BEFORE the cards start moving, so the opening
     gaps reveal the dark screen background instead of a copy of the
     image (which made the split look dirty). easeOutCubic in the
     reference -> power2.out here. */
  master
    .fromTo(
      cardsWrapper,
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: 0.03 },
      0.58,
    )
    .set(screenMedia, { autoAlpha: 0 }, 0.61)
    .to(device, { autoAlpha: 0, duration: 0.1 }, 0.61);

  cards.forEach((card, index) => {
    master.fromTo(
      card,
      {
        x: () => (1 - index) * getCardGap(),
        borderRadius: "0px",
      },
      {
        x: 0,
        borderRadius: "12px",
        duration: 0.2,
        ease: "power2.out",
      },
      0.62,
    );
  });

  /* slices fade out to reveal the card content */
  master
    .to(cardScreens, { autoAlpha: 0, duration: 0.08, stagger: 0.015 }, 0.76)
    .fromTo(
      cardContents,
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: 0.08, stagger: 0.015 },
      0.78,
    );

  /* p5: journey copy appears after the split */
  master
    .fromTo(
      journeyCopy,
      { autoAlpha: 0, y: 60 },
      { autoAlpha: 1, y: 0, duration: 0.14, ease: "power3.out" },
      0.8,
    )
    .to({}, { duration: 0.06 }, 0.94);

  /* live readout for tuning phase timings by eye */
  const debugPanel = createAnimationDebugPanel();
  const bar = (progress) =>
    "█".repeat(Math.round(progress * 20)).padEnd(20, "░");

  function updateDebugPanel() {
    const progress = master.scrollTrigger ? master.scrollTrigger.progress : 0;

    debugPanel.textContent =
      `progress  ${progress.toFixed(3)} ${bar(progress)}\n` +
      `          ${Math.round(progress * 100)}%\n` +
      `phase     ${getPhase(progress)}\n` +
      `power     ${device.classList.contains("is-on") ? "ON" : "OFF"}`;
  }

  gsap.ticker.add(updateDebugPanel);

  return () => {
    gsap.ticker.remove(updateDebugPanel);
    debugPanel.remove();
    setDevicePower(false);
    setJourneyInteractive(true);
  };
});

mm.add("(prefers-reduced-motion: reduce)", () => {
  // animation.css lays the scene out statically; just restore state.
  setDevicePower(true);
  setJourneyInteractive(true);
});
