import pg from "pg";
import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";

const { Pool } = pg;

// Fail closed on missing/weak session secret in production, including build time.
const authSecret = process.env.BETTER_AUTH_SECRET;
if (process.env.NODE_ENV === "production" && (!authSecret || authSecret.length < 32)) {
  throw new Error("BETTER_AUTH_SECRET must be configured with at least 32 characters before production builds.");
}

const authPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  options: "-c search_path=public"
});

export const auth = betterAuth({
  secret: authSecret,
  database: authPool,
  emailAndPassword: { enabled: true },
  advanced: { database: { joins: true } },
  plugins: [
    organization({
      organizationLimit: 1,
      membershipLimit: 50,
      disableOrganizationDeletion: true
    })
  ]
});
