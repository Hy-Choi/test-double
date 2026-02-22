export interface SupabasePublicConfig {
  url: string;
  anonKey: string;
}

export interface SupabaseServerConfig {
  url: string;
  key: string;
  usingServiceRole: boolean;
}

function cleanValue(input: string) {
  return input.trim();
}

function readPublicUrl() {
  return cleanValue(process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "");
}

function readPublicAnonKey() {
  return cleanValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? "");
}

function buildMissingEnvMessage() {
  return [
    "Missing Supabase env vars.",
    "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local, then restart `npm run dev`."
  ].join(" ");
}

function assertNoPlaceholder(name: string, value: string) {
  const placeholders = ["your-project-ref", "your-anon-key", "<", ">", "실제_"];
  if (placeholders.some((marker) => value.includes(marker))) {
    throw new Error(
      `${name} includes placeholder text. Paste the exact value from Supabase Dashboard (no '<>', '실제_' or 설명문).`
    );
  }
}

function assertAscii(name: string, value: string) {
  const hasNonAscii = /[^\x20-\x7E]/.test(value);
  if (hasNonAscii) {
    throw new Error(`${name} contains non-ASCII characters. Paste the raw Supabase value only.`);
  }
}

function assertValidHttpUrl(name: string, value: string) {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${name} is malformed. Expected format: https://<project-ref>.supabase.co`);
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error(`${name} must start with http:// or https://`);
  }

  if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
    throw new Error(
      `${name} must be your Supabase project URL (https://<project-ref>.supabase.co), not localhost.`
    );
  }

  if (parsed.pathname && parsed.pathname !== "/") {
    throw new Error(
      `${name} should not include a path. Use only the project root URL: https://<project-ref>.supabase.co`
    );
  }
}

export function getSupabasePublicConfig(): SupabasePublicConfig {
  const url = readPublicUrl();
  const anonKey = readPublicAnonKey();

  if (!url || !anonKey) {
    throw new Error(buildMissingEnvMessage());
  }

  assertNoPlaceholder("NEXT_PUBLIC_SUPABASE_URL", url);
  assertNoPlaceholder("NEXT_PUBLIC_SUPABASE_ANON_KEY", anonKey);
  assertAscii("NEXT_PUBLIC_SUPABASE_URL", url);
  assertAscii("NEXT_PUBLIC_SUPABASE_ANON_KEY", anonKey);
  assertValidHttpUrl("NEXT_PUBLIC_SUPABASE_URL", url);

  return { url, anonKey };
}

export function getSupabaseServerConfig(): SupabaseServerConfig {
  const { url, anonKey } = getSupabasePublicConfig();
  const serviceRoleKey = cleanValue(process.env.SUPABASE_SERVICE_ROLE_KEY ?? "");

  if (serviceRoleKey) {
    assertNoPlaceholder("SUPABASE_SERVICE_ROLE_KEY", serviceRoleKey);
    assertAscii("SUPABASE_SERVICE_ROLE_KEY", serviceRoleKey);
    return { url, key: serviceRoleKey, usingServiceRole: true };
  }

  return { url, key: anonKey, usingServiceRole: false };
}
