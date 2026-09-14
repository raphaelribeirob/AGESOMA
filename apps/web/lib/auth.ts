import pg from "pg";
import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";

const { Pool } = pg;

const authPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  options: "-c search_path=public"
});

export const auth = betterAuth({
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
