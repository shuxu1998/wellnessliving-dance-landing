/* Public receiver configuration only. Never put an API key or CRM credential here. */
window.WL_DEMO_CONFIG = Object.freeze({
  pageVariant: "dance-hero-v1",
  // Host-independent test receiver: set this to the public ID from a Formspree form.
  formspreeFormId: "myekvbap",
  // Optional existing independent JSON receiver; takes priority when configured.
  // It must return HTTP 2xx with { "accepted": true } after retaining the lead.
  endpoint: ""
});
