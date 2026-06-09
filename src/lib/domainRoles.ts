import { supabase } from "@/integrations/supabase/client";

/**
 * Returns the current Head of a domain (in the user_domain_roles permission
 * table), excluding `excludeUserId`, or null if there is none. Used to enforce
 * "one Head per domain" in the role-assignment UIs.
 */
export async function getExistingDomainHead(
  domainId: string,
  excludeUserId?: string
): Promise<{ userId: string; name: string } | null> {
  const { data } = await supabase
    .from("user_domain_roles")
    .select("user_id")
    .eq("domain_id", domainId)
    .eq("role", "head");

  const head = (data || []).find((r) => r.user_id !== excludeUserId);
  if (!head) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", head.user_id)
    .maybeSingle();

  return {
    userId: head.user_id,
    name: profile?.full_name || profile?.email || "another user",
  };
}
