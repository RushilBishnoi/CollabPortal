/**
 * Production Environment Configuration Validator
 *
 * Ensures all required production environment variables, encryption secrets,
 * and security parameters are correctly configured before the application
 * accepts traffic. Fails fast if configuration is invalid.
 */

export interface EnvValidationResult {
  valid: boolean;
  errors: string[];
}

export function checkProductionEnv(
  env: Record<string, string | undefined> = process.env,
): EnvValidationResult {
  const errors: string[] = [];

  // 1. Database Connection URL
  if (!env.DATABASE_URL) {
    errors.push("DATABASE_URL is required in production.");
  } else if (
    !env.DATABASE_URL.startsWith("postgresql://") &&
    !env.DATABASE_URL.startsWith("postgres://")
  ) {
    errors.push(
      "DATABASE_URL must be a valid PostgreSQL connection string starting with postgresql:// or postgres://",
    );
  }

  // 2. JWT Access Secret
  const accessSecret = env.JWT_ACCESS_SECRET;
  if (!accessSecret) {
    errors.push("JWT_ACCESS_SECRET is required in production.");
  } else {
    if (accessSecret.length < 32) {
      errors.push("JWT_ACCESS_SECRET must be at least 32 characters long.");
    }
    if (
      accessSecret.includes("DEFAULT_FALLBACK") ||
      accessSecret.includes("CHANGE_ME")
    ) {
      errors.push(
        "JWT_ACCESS_SECRET must not use placeholder or default fallback values.",
      );
    }
  }

  // 3. JWT Refresh Secret
  const refreshSecret = env.JWT_REFRESH_SECRET;
  if (!refreshSecret) {
    errors.push("JWT_REFRESH_SECRET is required in production.");
  } else {
    if (refreshSecret.length < 32) {
      errors.push("JWT_REFRESH_SECRET must be at least 32 characters long.");
    }
    if (
      refreshSecret.includes("DEFAULT_FALLBACK") ||
      refreshSecret.includes("CHANGE_ME")
    ) {
      errors.push(
        "JWT_REFRESH_SECRET must not use placeholder or default fallback values.",
      );
    }
    if (accessSecret && refreshSecret === accessSecret) {
      errors.push("JWT_REFRESH_SECRET must not be identical to JWT_ACCESS_SECRET.");
    }
  }

  // 4. CORS Origin Restriction
  const corsOrigin = env.CORS_ORIGIN || env.FRONTEND_URL;
  if (!corsOrigin) {
    errors.push(
      "CORS_ORIGIN or FRONTEND_URL must be explicitly configured in production.",
    );
  } else if (corsOrigin.trim() === "*") {
    errors.push(
      "CORS_ORIGIN wildcard (*) is strictly prohibited in production environments.",
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateProductionEnv(
  env: Record<string, string | undefined> = process.env,
): void {
  if (env.NODE_ENV !== "production") {
    return;
  }

  const { valid, errors } = checkProductionEnv(env);

  if (!valid) {
    console.error(
      "\n[CRITICAL CONFIGURATION ERROR] Production environment validation failed:",
    );
    for (const error of errors) {
      console.error("  - " + error);
    }
    console.error(
      "\nApplication cannot start with invalid production configuration. Exiting.\n",
    );
    process.exit(1);
  }
}
