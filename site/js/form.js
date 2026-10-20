(() => {
  "use strict";

  const form = document.getElementById("demo-form");
  if (!form) return;

  const visibleKeys = ["full_name", "email", "business_name", "phone", "business_type", "location_count", "website"];
  const clickKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "gbraid", "wbraid"];
  const hiddenKeys = [...clickKeys, "landing_url", "attribution_url", "submission_url", "referrer", "page_variant", "first_landed_at", "captured_at", "submitted_at", "attribution_version"];
  const storageKey = "wl_dance_first_touch_v1";
  const retentionMs = 90 * 24 * 60 * 60 * 1000;
  const status = document.getElementById("form-status");
  const submitButton = form.querySelector('button[type="submit"]');
  const submitLabel = submitButton.querySelector(".form-submit__label");
  const config = window.WL_DEMO_CONFIG || {};
  let submitting = false;

  function safeRead() {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data || !data.first_landed_at || Date.now() - Date.parse(data.first_landed_at) > retentionMs) {
        localStorage.removeItem(storageKey);
        return null;
      }
      return data;
    } catch (_) {
      return null;
    }
  }

  function safeWrite(data) {
    try { localStorage.setItem(storageKey, JSON.stringify(data)); } catch (_) { /* In-memory state still works on this page. */ }
  }

  function queryAttribution() {
    const params = new URLSearchParams(window.location.search);
    return Object.fromEntries(clickKeys.map(key => [key, params.get(key) ?? ""]));
  }

  function hasAttribution(data) {
    return clickKeys.some(key => typeof data[key] === "string" && data[key].trim() !== "");
  }

  function initialAttribution() {
    const incoming = queryAttribution();
    const now = new Date().toISOString();
    const previous = safeRead();
    if (previous) {
      if (!hasAttribution(previous) && hasAttribution(incoming)) {
        clickKeys.forEach(key => { previous[key] = incoming[key]; });
        previous.captured_at = now;
        previous.attribution_url = window.location.href;
        safeWrite(previous);
      }
      return previous;
    }
    const first = {
      ...incoming,
      landing_url: window.location.href,
      attribution_url: hasAttribution(incoming) ? window.location.href : "",
      referrer: document.referrer || "",
      first_landed_at: now,
      captured_at: hasAttribution(incoming) ? now : "",
      attribution_version: "1"
    };
    safeWrite(first);
    return first;
  }

  const firstTouch = initialAttribution();

  function updateHidden(submittedAt = "") {
    const hidden = {
      ...Object.fromEntries(clickKeys.map(key => [key, firstTouch[key] || ""])),
      landing_url: firstTouch.landing_url || window.location.href,
      attribution_url: firstTouch.attribution_url || "",
      submission_url: window.location.href,
      referrer: firstTouch.referrer || "",
      page_variant: config.pageVariant || "dance-hero-v1",
      first_landed_at: firstTouch.first_landed_at || "",
      captured_at: firstTouch.captured_at || "",
      submitted_at: submittedAt,
      attribution_version: firstTouch.attribution_version || "1"
    };
    hiddenKeys.forEach(key => {
      const field = form.elements.namedItem(key);
      if (field) field.value = hidden[key];
    });
    return hidden;
  }

  updateHidden();

  function normalizedWebsite(value) {
    const raw = value.trim();
    if (!raw || /\s/.test(raw)) return null;
    const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    try {
      const url = new URL(candidate);
      if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) return null;
      const labels = url.hostname.split(".");
      if (labels.length < 2 || labels.at(-1).length < 2 ||
          !labels.every(label => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label))) return null;
      return url.href;
    } catch (_) {
      return null;
    }
  }

  function errorFor(field) {
    const value = field.value.trim();
    switch (field.name) {
      case "full_name":
        if (!value) return "Enter your full name.";
        if (!/\p{L}/u.test(value)) return "Enter a name using letters.";
        return "";
      case "email":
        if (!value) return "Enter your email address.";
        return field.validity.typeMismatch || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
          ? "Enter a valid email address." : "";
      case "business_name":
        return value ? "" : "Enter your business name.";
      case "phone": {
        if (!value) return "Enter your phone number.";
        const digits = value.replace(/\D/g, "");
        return !/^[+()\d\s.\-]+$/.test(value) || digits.length < 7 || digits.length > 15
          ? "Enter a valid phone number, including country code if needed." : "";
      }
      case "business_type":
        return value ? "" : "Choose a business type.";
      case "location_count":
        return value ? "" : "Choose the number of locations.";
      case "website":
        if (!value) return "Enter your website.";
        return normalizedWebsite(value) ? "" : "Enter a valid website, such as example.com.";
      default:
        return "";
    }
  }

  function validateField(field) {
    const message = errorFor(field);
    const wrapper = field.closest(".form-field");
    const error = document.getElementById(`${field.name}-error`);
    wrapper.classList.toggle("is-invalid", Boolean(message));
    field.setAttribute("aria-invalid", String(Boolean(message)));
    error.textContent = message;
    return !message;
  }

  visibleKeys.forEach(key => {
    const field = form.elements.namedItem(key);
    field.addEventListener("blur", () => validateField(field));
    field.addEventListener(field.tagName === "SELECT" ? "change" : "input", () => {
      if (field.getAttribute("aria-invalid") === "true") validateField(field);
      if (status.dataset.kind === "error") setStatus("", "");
    });
  });

  function setStatus(message, kind) {
    status.textContent = message;
    status.dataset.kind = kind;
  }

  function payloadFor(submittedAt) {
    const hidden = updateHidden(submittedAt);
    const visible = Object.fromEntries(visibleKeys.map(key => {
      const value = form.elements.namedItem(key).value.trim();
      return [key, key === "website" ? normalizedWebsite(value) : value];
    }));
    return { ...visible, ...hidden };
  }

  async function submitLead(payload) {
    const endpoint = typeof config.endpoint === "string" ? config.endpoint.trim() : "";
    const formId = typeof config.formspreeFormId === "string" ? config.formspreeFormId.trim() : "";
    const useFormspree = !endpoint && /^[a-z0-9]+$/i.test(formId);
    if (!endpoint && !useFormspree) throw new Error("UNCONFIGURED");
    const destination = endpoint || `https://formspree.io/f/${formId}`;
    const response = await fetch(destination, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(payload)
    });
    if (response.status === 429) throw new Error("RATE_LIMITED");
    if (!response.ok) throw new Error("RECEIVER_ERROR");
    const result = await response.json().catch(() => null);
    if (!result || typeof result !== "object") throw new Error("UNCONFIRMED");
    if (useFormspree) {
      // Formspree's documented AJAX contract treats a 2xx JSON response as acceptance.
      if (result.ok === false || (Array.isArray(result.errors) && result.errors.length)) {
        throw new Error("UNCONFIRMED");
      }
    } else if (result.accepted !== true) {
      throw new Error("UNCONFIRMED");
    }
    return result;
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (submitting) return;
    setStatus("", "");
    let firstInvalid = null;
    visibleKeys.forEach(key => {
      const field = form.elements.namedItem(key);
      if (!validateField(field) && !firstInvalid) firstInvalid = field;
    });
    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    const payload = payloadFor(new Date().toISOString());
    submitting = true;
    submitButton.disabled = true;
    submitLabel.textContent = "Sending…";
    try {
      await submitLead(payload);
      setStatus("Your demo request was received.", "success");
    } catch (error) {
      setStatus(error.message === "UNCONFIGURED"
        ? "Demo requests are temporarily unavailable. Your details have not been sent. Please try again later."
        : error.message === "RATE_LIMITED"
          ? "We're receiving too many requests right now. Your details are still here; please wait and try again."
          : "We couldn't confirm your request. Your details are still here; please try again.", "error");
    } finally {
      submitting = false;
      submitButton.disabled = false;
      submitLabel.textContent = "Get a demo";
    }
  });
})();
