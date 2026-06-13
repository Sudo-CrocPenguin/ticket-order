const crypto = require("node:crypto");

const base64UrlEncode = (input) =>
  Buffer.from(JSON.stringify(input))
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

const base64UrlDecode = (input) => {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "="
  );
  return JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
};

class TokenService {
  constructor({ secret, expiresInSeconds }) {
    this.secret = secret;
    this.expiresInSeconds = expiresInSeconds;
  }

  sign(payload) {
    const header = { alg: "HS256", typ: "JWT" };
    const now = Math.floor(Date.now() / 1000);
    const body = {
      ...payload,
      iat: now,
      exp: now + this.expiresInSeconds,
    };
    const unsignedToken = `${base64UrlEncode(header)}.${base64UrlEncode(body)}`;
    const signature = crypto
      .createHmac("sha256", this.secret)
      .update(unsignedToken)
      .digest("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

    return `${unsignedToken}.${signature}`;
  }

  verify(token) {
    const [header, payload, signature] = String(token || "").split(".");

    if (!header || !payload || !signature) {
      throw new Error("Token invalido.");
    }

    const unsignedToken = `${header}.${payload}`;
    const expectedSignature = crypto
      .createHmac("sha256", this.secret)
      .update(unsignedToken)
      .digest("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

    const receivedSignature = Buffer.from(signature);
    const calculatedSignature = Buffer.from(expectedSignature);

    if (
      receivedSignature.length !== calculatedSignature.length ||
      !crypto.timingSafeEqual(receivedSignature, calculatedSignature)
    ) {
      throw new Error("Token invalido.");
    }

    const decoded = base64UrlDecode(payload);
    const now = Math.floor(Date.now() / 1000);

    if (decoded.exp && decoded.exp < now) {
      throw new Error("Token expirado.");
    }

    return decoded;
  }
}

module.exports = {
  TokenService,
};
