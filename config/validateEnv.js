/**
 * Environment Variables Validator
 * Ensures all required environment variables are set before server starts
 */

const requiredVars = [
  "NODE_ENV",
  "PORT",
  "DB_NAME",
  "EMAIL_USER",
  "EMAIL_PASSWORD",
];

const optionalVars = {
  ALLOWED_ORIGINS: "http://localhost:3000",
  ENABLE_PERFORMANCE_MONITORING: "true",
  JWT_SECRET: "your-secret-key-change-in-production",
};

function validateEnv() {
  const missing = [];
  const warnings = [];

  // Check required variables
  requiredVars.forEach((varName) => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });

  if (missing.length > 0) {
    console.error("\n❌ FATAL ERROR: Missing required environment variables:");
    missing.forEach((varName) => {
      console.error(`   - ${varName}`);
    });
    console.error(
      "\n💡 Please check your .env file and ensure all required variables are set.\n",
    );
    process.exit(1);
  }

  // Check optional variables and set defaults
  Object.entries(optionalVars).forEach(([varName, defaultValue]) => {
    if (!process.env[varName]) {
      process.env[varName] = defaultValue;
      warnings.push(`${varName} (using default: ${defaultValue})`);
    }
  });

  // Validate specific formats
  const validations = {
    EMAIL_USER: (val) => val.includes("@") && val.includes("."),
    PORT: (val) => !isNaN(val) && val > 0 && val < 65536,
    NODE_ENV: (val) => ["development", "production", "test"].includes(val),
  };

  Object.entries(validations).forEach(([varName, validator]) => {
    if (process.env[varName] && !validator(process.env[varName])) {
      console.error(
        `\n⚠️  Invalid value for ${varName}: ${process.env[varName]}`,
      );
      process.exit(1);
    }
  });

  // Success message
  console.log("✅ Environment variables validated successfully");

  if (warnings.length > 0) {
    console.log("\n⚠️  Using default values for:");
    warnings.forEach((warning) => {
      console.log(`   - ${warning}`);
    });
  }

  // Security warnings
  if (process.env.NODE_ENV === "production") {
    if (process.env.JWT_SECRET === "your-secret-key-change-in-production") {
      console.warn(
        "\n🚨 WARNING: You are using the default JWT_SECRET in production!",
      );
      console.warn("   Please change this to a secure random string.\n");
    }

    if (process.env.ALLOWED_ORIGINS === "http://localhost:3000") {
      console.warn(
        "\n🚨 WARNING: ALLOWED_ORIGINS is set to localhost in production!",
      );
      console.warn("   Please update this to your production domain.\n");
    }
  }

  console.log("");
}

module.exports = { validateEnv };
