const JOIN_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const JOIN_CODE_PATTERN = /^[A-HJ-NP-Z2-9]{4,8}$/;

export function generateJoinCode(length = 6) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);

  return Array.from(bytes)
    .map((byte) => JOIN_CODE_ALPHABET[byte % JOIN_CODE_ALPHABET.length])
    .join("");
}

export function normalizeJoinCode(code: string) {
  return code.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

export function isValidJoinCode(code: string) {
  return JOIN_CODE_PATTERN.test(normalizeJoinCode(code));
}
