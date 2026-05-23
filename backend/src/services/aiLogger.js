function logAiRequest(action, details = {}) {
  const compact = Object.entries(details)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => `${key}=${value}`)
    .join(" ");
  console.log(`[AI] ${action}${compact ? ` ${compact}` : ""}`);
}

module.exports = { logAiRequest };
