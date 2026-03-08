const publicEnv = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
};

export function hasSupabaseEnv() {
  return Boolean(publicEnv.url && publicEnv.anonKey);
}

export function getPublicSupabaseEnv() {
  if (!hasSupabaseEnv()) {
    return null;
  }

  return publicEnv;
}

export function requirePublicSupabaseEnv() {
  const env = getPublicSupabaseEnv();

  if (!env) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Copy .env.example and configure Supabase.",
    );
  }

  return env;
}

export function getServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? null;
}

export function requireServiceRoleKey() {
  const key = getServiceRoleKey();

  if (!key) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");
  }

  return key;
}

export function getAdminAllowlist() {
  return (process.env.ADMIN_EMAIL_ALLOWLIST ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

export function getCronSecret() {
  return process.env.CRON_SECRET ?? null;
}
