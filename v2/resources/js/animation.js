// (function () {
//   /*
//    * Usage:
//    * 1. Put content inside any element with position: sticky.
//    * 2. Define window.onStickyStart = ({ key, element }) => {}.
//    * 3. Define window.onStickyEnd = ({ key, element }) => {}.
//    *
//    * key is the nearest section[id]. Example:
//    * <section id="stats"><div class="sticky top-10">...</div></section>
//    * calls the callbacks with key: "stats".
//    */
//   const TOLERANCE = 1;
//   const refreshStickyObservers = [];
//   let statsStickyAlertShown = false;

//   function getStickyTop(element) {
//     const top = Number.parseFloat(getComputedStyle(element).top);
//     return Number.isFinite(top) ? top : 0;
//   }

//   function getStickyKey(element) {
//     const section = element.closest("section[id]");
//     return section?.id || element.id || "";
//   }

//   function getStickyState(element) {
//     const top = getStickyTop(element);
//     const currentTop = element.getBoundingClientRect().top;

//     if (Math.abs(currentTop - top) <= TOLERANCE) {
//       return "active";
//     }

//     return currentTop < top - TOLERANCE ? "after" : "before";
//   }

//   function observeSticky(element) {
//     let previousState = getStickyState(element);
//     let lastScrollY = window.scrollY;
//     let ticking = false;

//     function update({ force = false } = {}) {
//       ticking = false;

//       const state = getStickyState(element);
//       const scrollingDown = window.scrollY > lastScrollY;
//       const key = getStickyKey(element);

//       if ((force || previousState !== "active") && state === "active") {
//         if (key === "stats" && !statsStickyAlertShown) {
//           statsStickyAlertShown = true;
//           window.alert("#stats sticky detected");
//         }

//         window.onStickyStart?.({ key, element });
//       }

//       if (previousState === "active" && state === "after" && scrollingDown) {
//         window.onStickyEnd?.({ key, element });
//       }

//       previousState = state;
//       lastScrollY = window.scrollY;
//     }

//     function requestUpdate(options) {
//       if (ticking) {
//         return;
//       }

//       ticking = true;
//       window.requestAnimationFrame(() => update(options));
//     }

//     window.addEventListener("scroll", requestUpdate, { passive: true });
//     window.addEventListener("resize", requestUpdate);
//     update({ force: true });

//     return () => requestUpdate({ force: true });
//   }

//   function initStickyObservers() {
//     document.querySelectorAll("*").forEach((element) => {
//       if (getComputedStyle(element).position !== "sticky") {
//         return;
//       }

//       refreshStickyObservers.push(observeSticky(element));
//     });
//   }

//   if (document.readyState === "loading") {
//     document.addEventListener("DOMContentLoaded", initStickyObservers, {
//       once: true,
//     });
//   } else {
//     initStickyObservers();
//   }

//   window.addEventListener("debug:ready", () => {
//     refreshStickyObservers.forEach((refresh) => refresh());
//   });
// })();

gsap.registerPlugin(ScrollTrigger);

const logBox = document.querySelector("#log");

function log(message) {
  console.log(message);

  const p = document.createElement("p");
  p.textContent = message;
  logBox.prepend(p);

  alert(message);
}

/*
      SECTION EVENTS

      onEnter:
      The trigger section enters the active scroll range while scrolling down.

      onLeave:
      The trigger section leaves the active scroll range while scrolling down.

      onEnterBack:
      The trigger section re-enters the active scroll range while scrolling up.

      onLeaveBack:
      The trigger section leaves the active scroll range while scrolling up.
    */
ScrollTrigger.create({
  trigger: "#stats",
  start: "top top",
  end: "bottom top",
  markers: true,

  onEnter: () => sphereReachsDevice(),
  // onLeave: () => alert("LEAVE: #stats section left"),
  // onEnterBack: () => alert("ENTER BACK: #stats section entered again"),
  // onLeaveBack: () => alert("LEAVE BACK: #stats section left upward"),
});

let device = document.querySelector("#device");
let stickyWrapper = document.querySelector(".sticky-wrapper");
function sphereReachsDevice() {
  // device.style.position = "fixed";
  stickyWrapper.style.position = "fixed";
}

/*
      STICKY-LIKE EVENTS

      Because CSS sticky starts when the sticky element reaches top: 120px,
      we use the sticky element itself as the trigger.

      start: "top 120px"
      means:
      when the sticky box top reaches 120px from viewport top.
    */
// ScrollTrigger.create({
//   trigger: ".sticky-box",
//   start: "top 120px",
//   endTrigger: "#stats",
//   end: "bottom 120px",
//   markers: true,

//   onEnter: () => alert("STICKY START: sticky box reached top position"),
//   onLeave: () => alert("STICKY END: sticky box reached end of container"),
//   onEnterBack: () =>
//     alert("STICKY START BACK: sticky box became sticky again upward"),
//   onLeaveBack: () =>
//     alert("STICKY END BACK: sticky box left sticky position upward"),
// });

/*
      Optional animation while sticky section is active.
    */
// gsap.to(".sphere", {
//   scale: 0.5,
//   opacity: 0.25,
//   rotate: 360,
//   scrollTrigger: {
//     trigger: "#stats",
//     start: "top top",
//     end: "bottom top",
//     scrub: true,
//   },
// });
