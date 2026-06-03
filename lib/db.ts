import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    }

    _supabase = createClient(supabaseUrl, supabaseKey);
  }
  return _supabase;
}

export async function hasWalletClaimed(wallet: string): Promise<boolean> {
  const { data } = await getSupabase()
    .from("claims")
    .select("id")
    .eq("wallet", wallet)
    .limit(1);
  return !!(data && data.length > 0);
}

export async function hasIPClaimed(ip: string): Promise<boolean> {
  const { data } = await getSupabase()
    .from("claims")
    .select("id")
    .eq("ip", ip)
    .limit(1);
  return !!(data && data.length > 0);
}

export async function recordClaim(
  wallet: string,
  ip: string,
  txSignature: string
) {
  const { error } = await getSupabase()
    .from("claims")
    .insert({ wallet, ip, tx_signature: txSignature });
  if (error) {
    throw new Error(`Failed to record claim: ${error.message}`);
  }
}
