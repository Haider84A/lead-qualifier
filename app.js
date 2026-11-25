(function () {
  const cfg = window.SITE_CONFIG || {};
  const defaultDisplay = cfg.defaultPhoneDisplay || "(888) 555-0199";
  const defaultTel = cfg.defaultPhoneTel || "+18885550199";

  // State for the 3-step lead qualifier
  const state = {
    serviceKey: "",
    serviceLabel: "",
    zip: "",
    urgency: ""
  };

  // Elements
  const steps = document.querySelectorAll(".q-step");
  const stepIndicator = document.getElementById("step-indicator");
  const progressFill = document.getElementById("progress-fill");
  const zipInput = document.getElementById("zip-input");
  const zipError = document.getElementById("zip-error");
  const matchSummary = document.getElementById("match-summary");
  const summaryZip = document.getElementById("summary-zip");
  const resultCallBtn = document.getElementById("result-call-btn");

  // Apply brand name, support email, year, and phone numbers
  document.querySelectorAll("[data-brand-name]").forEach((el) => {
    el.textContent = cfg.brandName || "HomePro Dispatch";
  });

  const supportLink = document.getElementById("support-email-link");
  if (supportLink && cfg.supportEmail) {
    supportLink.textContent = cfg.supportEmail;
    supportLink.href = "mailto:" + cfg.supportEmail;
  }

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  function formatTelHref(raw) {
    const cleaned = String(raw).replace(/[^\d+]/g, "");
    return "tel:" + (cleaned.startsWith("+") ? cleaned : "+1" + cleaned);
  }

  function setPhoneUI(displayNum, telNum) {
    document.querySelectorAll("[data-phone-display]").forEach((el) => {
      el.textContent = displayNum;
    });
    document.querySelectorAll("[data-call-link]").forEach((el) => {
      el.setAttribute("href", formatTelHref(telNum));
    });
  }

  function getPhoneForService(serviceKey) {
    const custom = cfg.serviceNumbers && cfg.serviceNumbers[serviceKey];
    if (custom && custom.trim()) {
      return { display: custom.trim(), tel: custom.trim() };
    }
    return { display: defaultDisplay, tel: defaultTel };
  }

  setPhoneUI(defaultDisplay, defaultTel);

  // Step navigation
  function goToStep(stepNum) {
    steps.forEach((s) => {
      s.classList.toggle("active", Number(s.dataset.step) === stepNum);
    });

    if (stepNum <= 3) {
      stepIndicator.textContent = `Step ${stepNum} of 3`;
      progressFill.style.width = `${Math.round((stepNum / 3) * 100)}%`;
    } else {
      stepIndicator.textContent = "Match Ready";
      progressFill.style.width = "100%";
    }

    if (stepNum === 2 && zipInput) {
      zipInput.focus();
    }
  }

  // Step 1: Service selection
  document.querySelectorAll(".option-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.serviceKey = btn.dataset.service || "";
      state.serviceLabel = btn.dataset.label || btn.textContent.trim();
      goToStep(2);
    });
  });

  // Service cards at the bottom pre-select and scroll to qualifier
  document.querySelectorAll("[data-pick-service]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.serviceKey = btn.dataset.pickService || "";
      state.serviceLabel = btn.dataset.pickLabel || "";
      goToStep(2);
      document.getElementById("qualifier").scrollIntoView({ behavior: "smooth", block: "center" });
    });
  });

  // Step 2: US 5-digit ZIP validation
  function validateZip() {
    const val = (zipInput.value || "").trim();
    if (!/^\d{5}$/.test(val)) {
      zipError.textContent = "Please enter a valid 5-digit US ZIP code (e.g. 43215).";
      return false;
    }
    zipError.textContent = "";
    state.zip = val;
    return true;
  }

  zipInput.addEventListener("input", () => {
    zipInput.value = zipInput.value.replace(/\D/g, "").slice(0, 5);
    if (zipError.textContent) zipError.textContent = "";
  });

  zipInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && validateZip()) {
      goToStep(3);
    }
  });

  document.getElementById("next-to-3").addEventListener("click", () => {
    if (validateZip()) goToStep(3);
  });

  document.getElementById("back-to-1").addEventListener("click", () => goToStep(1));
  document.getElementById("back-to-2").addEventListener("click", () => goToStep(2));

  // Step 3: Urgency -> Show matched call button
  document.querySelectorAll(".urgency-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.urgency = btn.dataset.urgency || "ASAP";
      const phone = getPhoneForService(state.serviceKey);

      matchSummary.innerHTML =
        `A local <strong>${state.serviceLabel}</strong> specialist serving ZIP <strong>${state.zip}</strong> (${state.urgency}) is ready to take your call.`;
      summaryZip.textContent = state.zip;

      if (resultCallBtn) {
        resultCallBtn.setAttribute("href", formatTelHref(phone.tel));
        const span = resultCallBtn.querySelector("[data-phone-display]");
        if (span) span.textContent = phone.display;
      }

      goToStep(4);
    });
  });

  // Reset
  document.getElementById("reset-qualifier").addEventListener("click", () => {
    state.serviceKey = "";
    state.serviceLabel = "";
    state.zip = "";
    state.urgency = "";
    zipInput.value = "";
    zipError.textContent = "";
    goToStep(1);
  });

  // Bonus: URL parameter personalization for Facebook Groups / Marketplace sharing
  // Example: index.html?service=plumbing&city=Columbus
  const params = new URLSearchParams(window.location.search);
  const urlService = (params.get("service") || "").toLowerCase();
  const urlCity = (params.get("city") || "").trim();

  const serviceMap = {
    plumbing: "Plumbing",
    hvac: "HVAC & AC Repair",
    roofing: "Roofing",
    appliance: "Appliance Repair",
    garage: "Garage Door Repair",
    water: "Water Damage Restoration",
    electrical: "Electrical",
    pest: "Pest Control"
  };

  if (urlService && serviceMap[urlService]) {
    const label = serviceMap[urlService];
    const headline = document.getElementById("hero-headline");
    if (headline) {
      headline.textContent = urlCity
        ? `Need Fast ${label} in ${urlCity}?`
        : `Need a Trusted Local ${label} Pro Fast?`;
    }
    state.serviceKey = urlService;
    state.serviceLabel = label;
    const phone = getPhoneForService(urlService);
    setPhoneUI(phone.display, phone.tel);
  } else if (urlCity) {
    const headline = document.getElementById("hero-headline");
    if (headline) {
      headline.textContent = `Trusted Local Home Service Pros in ${urlCity}`;
    }
  }
})();
