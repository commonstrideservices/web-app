
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("Missing DATABASE_URL in environment.");
  process.exit(1);
}

if (!/^postgres(ql)?:\/\//i.test(databaseUrl)) {
  console.error(
    "DATABASE_URL must be a PostgreSQL connection URL."
  );
  process.exit(1);
}

// Resolve the installed Supabase CLI v3 executable.
const cliPath = require.resolve("supabase/dist/supabase.js");

const args = [
  "db",
  "push",
  `--remote=${databaseUrl}`,
  ...process.argv.slice(2),
];

const result = spawnSync(
  process.execPath,
  [cliPath, ...args],
  {
    stdio: "inherit",
    env: process.env,
    cwd: process.cwd(),
  }
);

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
