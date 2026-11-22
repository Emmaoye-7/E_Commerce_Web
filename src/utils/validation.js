export function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function hasText(value, maxLength) {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= maxLength;
}

export function isEmail(value) {
  return (
    typeof value === "string" &&
    value.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
  );
}

export function isPositiveInteger(value, max = 99) {
  return Number.isInteger(value) && value >= 1 && value <= max;
}
