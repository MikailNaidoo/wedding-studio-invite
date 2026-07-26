export function isLikelySpamSubmission({
  honeypotValue = "",
  elapsedMs = 0,
  minimumElapsedMs = 2500,
} = {}) {
  return honeypotValue.trim().length > 0 || elapsedMs < minimumElapsedMs;
}
