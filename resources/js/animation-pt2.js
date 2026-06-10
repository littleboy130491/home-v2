gsap.registerPlugin(ScrollTrigger);

const SCHEMA_DARK = {
  backgroundColor: "#02070a",
  "--schema-bg": "#02070a",
  "--schema-text": "#f7fbfb",
  "--schema-text-muted": "rgba(247, 251, 251, 0.62)",
  "--schema-heading": "#f7fbfb",
  "--schema-btn-bg": "#f7fbfb",
  "--schema-btn-text": "#000612",
  "--schema-highlight": "#e8c547",
  "--schema-border": "rgba(255, 255, 255, 0.18)",
};

const SCHEMA_LIGHT = {
  backgroundColor: "#f7fbfb",
  "--schema-bg": "#f7fbfb",
  "--schema-text": "#000612",
  "--schema-text-muted": "rgba(0, 6, 18, 0.62)",
  "--schema-heading": "#000612",
  "--schema-btn-bg": "#000612",
  "--schema-btn-text": "#f7fbfb",
  "--schema-highlight": "#b8860b",
  "--schema-border": "rgba(0, 6, 18, 0.18)",
};

const SCHEMA_PROPS =
  "backgroundColor,--schema-bg,--schema-text,--schema-text-muted,--schema-heading,--schema-btn-bg,--schema-btn-text,--schema-highlight,--schema-border";

const animationPart2Media = gsap.matchMedia();

animationPart2Media.add("(prefers-reduced-motion: no-preference)", () => {
  const socialProofPrevious =
    document.querySelector("#scene") || document.querySelector("#journey");
  const socialProof = document.querySelector("#social-proof");

  let socialProofLightened = false;
  let homeCtaScrollTrigger = null;
  let homeCtaTimeline = null;

  if (socialProof) {
    socialProof.classList.add("section-dark", "is-schema-animated");

    const lightenSocialProof = () => {
      if (socialProofLightened) {
        return;
      }

      socialProofLightened = true;
      socialProof.classList.add("is-lightening");

      gsap.to(socialProof, {
        ...SCHEMA_LIGHT,
        duration: 0.55,
        ease: "power2.inOut",
        onComplete: () => {
          socialProof.classList.remove("section-dark", "is-lightening");
          socialProof.classList.add("is-light");
          gsap.set(socialProof, { clearProps: SCHEMA_PROPS });
        },
      });
    };

    const darkenSocialProof = () => {
      if (!socialProofLightened) {
        return;
      }

      socialProofLightened = false;
      gsap.killTweensOf(socialProof);
      socialProof.classList.remove("is-light", "is-lightening");
      socialProof.classList.add("section-dark");
      gsap.set(socialProof, { clearProps: SCHEMA_PROPS });
    };

    ScrollTrigger.create({
      trigger: socialProofPrevious || socialProof,
      start: socialProofPrevious ? "bottom top" : "top 60%",
      onEnter: lightenSocialProof,
      onLeaveBack: darkenSocialProof,
    });
  }

  const initHomeCtaCountdown = () => {
    const homeCta = document.querySelector("#home-cta");
    const wowFactor = document.querySelector("#wow-factor");
    const countdowns = gsap.utils.toArray("#wow-factor .countdown");
    const wowFactorCopy = document.querySelector("#wow-factor-copy");
    const ctaBlock = document.querySelector("#home-cta #cta");

    if (!homeCta || !wowFactor || countdowns.length < 3 || !wowFactorCopy || !ctaBlock) {
      return;
    }

    homeCtaScrollTrigger?.kill();
    homeCtaTimeline?.kill();

    homeCta.classList.remove("section-dark", "is-darkening", "is-countdown-done");
    wowFactor.classList.add("is-js-countdown");
    wowFactor.classList.remove("is-countdown-active");

    gsap.set([wowFactorCopy, ctaBlock], { autoAlpha: 0, y: 28 });
    gsap.set(countdowns, { autoAlpha: 0, scale: 0.8, y: 30 });

    homeCtaTimeline = gsap.timeline({
      paused: true,
      defaults: { ease: "power3.out" },
      onStart: () => {
        wowFactor.classList.add("is-countdown-active");
      },
      onComplete: () => {
        wowFactor.classList.remove("is-countdown-active");
        homeCta.classList.add("is-darkening");

        const darkTl = gsap.timeline({
          onComplete: () => {
            homeCta.classList.add("section-dark", "is-countdown-done");
            homeCta.classList.remove("is-darkening");
            gsap.set(homeCta, { clearProps: SCHEMA_PROPS });
          },
        });

        darkTl
          .to(homeCta, { ...SCHEMA_DARK, duration: 0.8, ease: "power2.inOut" })
          .to(
            [wowFactorCopy, ctaBlock],
            { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.12, ease: "power3.out" },
            0.3,
          );
      },
    });

    countdowns.forEach((countdown) => {
      homeCtaTimeline
        .to(countdown, {
          autoAlpha: 1,
          scale: 1,
          y: 0,
          duration: 0.4,
        })
        .to({}, { duration: 0.45 })
        .to(countdown, {
          autoAlpha: 0,
          scale: 1.08,
          y: -24,
          duration: 0.32,
          ease: "power2.in",
        });
    });

    homeCtaScrollTrigger = ScrollTrigger.create({
      id: "home-cta-countdown",
      trigger: wowFactor,
      start: "top 78%",
      once: true,
      onEnter: () => homeCtaTimeline.play(0),
    });
  };

  const refreshHomeCta = () => {
    initHomeCtaCountdown();
    ScrollTrigger.refresh(true);
  };

  if (document.readyState === "complete") {
    refreshHomeCta();
  } else {
    window.addEventListener("load", refreshHomeCta, { once: true });
  }

  return () => {
    socialProofLightened = false;
    homeCtaScrollTrigger?.kill();
    homeCtaTimeline?.kill();
  };
});

animationPart2Media.add("(prefers-reduced-motion: reduce)", () => {
  const socialProof = document.querySelector("#social-proof");
  const homeCta = document.querySelector("#home-cta");
  const wowFactor = document.querySelector("#wow-factor");
  const wowFactorCopy = document.querySelector("#wow-factor-copy");
  const ctaBlock = document.querySelector("#home-cta #cta");
  const countdowns = gsap.utils.toArray("#wow-factor .countdown");

  if (socialProof) {
    socialProof.classList.remove("section-dark", "is-schema-animated", "is-lightening");
    socialProof.classList.add("is-light");
    gsap.set(socialProof, { clearProps: SCHEMA_PROPS });
    gsap.set(
      ["#social-proof-copy", "#logo-wrapper .logo", ".testimonial-card"],
      { clearProps: "all" },
    );
  }

  if (homeCta) {
    homeCta.classList.add("section-dark", "is-countdown-done");
    homeCta.classList.remove("is-darkening");
    gsap.set(homeCta, { clearProps: SCHEMA_PROPS });
  }

  if (wowFactor) {
    wowFactor.classList.remove("is-js-countdown", "is-countdown-active");
  }

  gsap.set([wowFactorCopy, ctaBlock], { clearProps: "all" });
  gsap.set(countdowns, { clearProps: "all" });
});
