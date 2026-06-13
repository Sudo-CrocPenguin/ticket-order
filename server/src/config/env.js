const path = require("node:path");

const rootDir = path.resolve(__dirname, "../../..");

const getEnv = (name, fallback = "") => process.env[name] || fallback;

const config = {
  env: getEnv("NODE_ENV", "development"),
  host: getEnv("HOST", "0.0.0.0"),
  port: Number(getEnv("PORT", "4000")),
  corsOrigin: getEnv("CORS_ORIGIN", "*"),
  jwtSecret: getEnv("JWT_SECRET", "dev-secret-change-me"),
  tokenExpiresInSeconds: Number(getEnv("TOKEN_EXPIRES_IN_SECONDS", "86400")),
  dataFile: getEnv("DATA_FILE", path.join(rootDir, "data", "ticket-order.json")),
  uploadDir: getEnv("UPLOAD_DIR", path.join(rootDir, "uploads")),
  seed: {
    companyName: getEnv("SEED_COMPANY_NAME", "Empresa Demo"),
    companySlug: getEnv("SEED_COMPANY_SLUG", "empresa-demo"),
    applicationName: getEnv("SEED_APPLICATION_NAME", "Aplicacion Principal"),
    adminName: getEnv("SEED_ADMIN_NAME", "Administrador"),
    adminEmail: getEnv("SEED_ADMIN_EMAIL", "admin@example.com"),
    adminPassword: getEnv("SEED_ADMIN_PASSWORD", "Admin123!"),
  },
};

const assertProductionConfig = () => {
  if (config.env !== "production") return;

  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET debe existir y tener al menos 32 caracteres.");
  }

  if (!process.env.SEED_ADMIN_PASSWORD || process.env.SEED_ADMIN_PASSWORD.length < 10) {
    throw new Error("SEED_ADMIN_PASSWORD debe existir y tener al menos 10 caracteres.");
  }
};

module.exports = {
  assertProductionConfig,
  config,
  rootDir,
};
