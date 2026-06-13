const crypto = require("node:crypto");

class PasswordHasher {
  constructor({ iterations = 120000, keyLength = 64, digest = "sha512" } = {}) {
    this.iterations = iterations;
    this.keyLength = keyLength;
    this.digest = digest;
  }

  hash(password) {
    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = crypto
      .pbkdf2Sync(password, salt, this.iterations, this.keyLength, this.digest)
      .toString("hex");

    return {
      passwordHash,
      passwordSalt: salt,
    };
  }

  verify(password, passwordHash, passwordSalt) {
    if (!password || !passwordHash || !passwordSalt) return false;

    const calculated = crypto
      .pbkdf2Sync(password, passwordSalt, this.iterations, this.keyLength, this.digest)
      .toString("hex");

    return crypto.timingSafeEqual(Buffer.from(calculated), Buffer.from(passwordHash));
  }
}

module.exports = {
  PasswordHasher,
};
