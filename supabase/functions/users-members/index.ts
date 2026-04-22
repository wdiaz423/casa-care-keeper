// Edge Function: users-members
// CRUD endpoints for users (profiles) and home members.
// Replaces typical PHP REST controllers with TypeScript on Deno.
//
// Routes (path is relative to the function URL):
//   GET    /profile                          -> get my profile
//   PUT    /profile                          -> update my profile { display_name?, avatar_url? }
//   GET    /profiles?home_id=...             -> list profiles of members in a home
//
//   GET    /members?home_id=...              -> list members of a home (with profile info)
//   POST   /members                          -> add a member { home_id, user_id, role? }   (owner/admin)
//   PATCH  /members/:id                      -> update member role { role }                (owner only)
//   DELETE /members/:id                      -> remove a member                            (owner/admin)
//
//   GET    /invitations?home_id=...          -> list pending invitations
//   POST   /invitations                      -> create invitation { home_id, email?, role? }
//   DELETE /invitations/:id                  -> cancel invitation (status=cancelled)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

type Role = "owner" | "admin" | "member";
const VALID_ROLES: Role[] = ["owner", "admin", "member"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // --- Auth ---
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ error: "Unauthorized" }, 401);
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ??
    Deno.env.get("SUPABASE_ANON_KEY")!;

  // Client scoped to the user (RLS applies → security stays consistent).
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
  if (claimsError || !claimsData?.claims) {
    return json({ error: "Unauthorized" }, 401);
  }
  const userId = claimsData.claims.sub as string;

  // --- Routing ---
  const url = new URL(req.url);
  // Strip the function name prefix to get the inner route.
  const innerPath =
    url.pathname.replace(/^\/functions\/v1\/users-members/, "").replace(/^\/users-members/, "") ||
    "/";
  const segments = innerPath.split("/").filter(Boolean); // e.g. ["members", ":id"]
  const method = req.method.toUpperCase();

  let body: any = null;
  if (["POST", "PUT", "PATCH"].includes(method)) {
    try {
      body = await req.json();
    } catch {
      body = {};
    }
  }

  try {
    // ===== /profile =====
    if (segments[0] === "profile" && segments.length === 1) {
      if (method === "GET") {
        const { data, error } = await supabase
          .from("profiles")
          .select("user_id, display_name, avatar_url, created_at, updated_at")
          .eq("user_id", userId)
          .maybeSingle();
        if (error) return json({ error: error.message }, 400);
        return json({ profile: data });
      }
      if (method === "PUT") {
        const updates: Record<string, unknown> = {};
        if (typeof body?.display_name === "string") {
          updates.display_name = body.display_name.trim().slice(0, 100);
        }
        if (typeof body?.avatar_url === "string") {
          updates.avatar_url = body.avatar_url.trim().slice(0, 500);
        }
        if (!Object.keys(updates).length) {
          return json({ error: "No fields to update" }, 400);
        }
        const { data, error } = await supabase
          .from("profiles")
          .update(updates)
          .eq("user_id", userId)
          .select()
          .maybeSingle();
        if (error) return json({ error: error.message }, 400);
        return json({ profile: data });
      }
    }

    // ===== /profiles?home_id=... =====
    if (segments[0] === "profiles" && segments.length === 1 && method === "GET") {
      const homeId = url.searchParams.get("home_id");
      if (!homeId) return json({ error: "home_id is required" }, 400);

      const { data: membersData, error: mErr } = await supabase
        .from("home_members")
        .select("user_id")
        .eq("home_id", homeId);
      if (mErr) return json({ error: mErr.message }, 400);

      const ids = (membersData ?? []).map((m) => m.user_id);
      if (!ids.length) return json({ profiles: [] });

      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", ids);
      if (error) return json({ error: error.message }, 400);
      return json({ profiles: data });
    }

    // ===== /members =====
    if (segments[0] === "members") {
      // GET /members?home_id=...
      if (segments.length === 1 && method === "GET") {
        const homeId = url.searchParams.get("home_id");
        if (!homeId) return json({ error: "home_id is required" }, 400);

        const { data: members, error } = await supabase
          .from("home_members")
          .select("id, home_id, user_id, role, created_at")
          .eq("home_id", homeId)
          .order("created_at", { ascending: true });
        if (error) return json({ error: error.message }, 400);

        const ids = (members ?? []).map((m) => m.user_id);
        let profilesMap = new Map<string, { display_name: string | null; avatar_url: string | null }>();
        if (ids.length) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("user_id, display_name, avatar_url")
            .in("user_id", ids);
          profiles?.forEach((p) =>
            profilesMap.set(p.user_id, {
              display_name: p.display_name,
              avatar_url: p.avatar_url,
            }),
          );
        }

        return json({
          members: (members ?? []).map((m) => ({
            ...m,
            display_name: profilesMap.get(m.user_id)?.display_name ?? null,
            avatar_url: profilesMap.get(m.user_id)?.avatar_url ?? null,
          })),
        });
      }

      // POST /members
      if (segments.length === 1 && method === "POST") {
        const homeId = body?.home_id as string | undefined;
        const newUserId = body?.user_id as string | undefined;
        const role = (body?.role ?? "member") as Role;
        if (!homeId || !newUserId) {
          return json({ error: "home_id and user_id are required" }, 400);
        }
        if (!VALID_ROLES.includes(role)) {
          return json({ error: "Invalid role" }, 400);
        }
        // Pre-check: avoid duplicate membership in the same home.
        const { data: existing, error: existErr } = await supabase
          .from("home_members")
          .select("id, role")
          .eq("home_id", homeId)
          .eq("user_id", newUserId)
          .maybeSingle();
        if (existErr) return json({ error: existErr.message }, 400);
        if (existing) {
          return json(
            {
              error: "El usuario ya es miembro de este hogar",
              code: "ALREADY_MEMBER",
              member: existing,
            },
            409,
          );
        }

        const { data, error } = await supabase
          .from("home_members")
          .insert({ home_id: homeId, user_id: newUserId, role })
          .select()
          .single();
        if (error) {
          // Postgres unique_violation fallback (race condition)
          if ((error as any).code === "23505") {
            return json(
              { error: "El usuario ya es miembro de este hogar", code: "ALREADY_MEMBER" },
              409,
            );
          }
          return json({ error: error.message }, 400);
        }
        return json({ member: data }, 201);
      }

      // PATCH /members/:id
      if (segments.length === 2 && method === "PATCH") {
        const memberId = segments[1];
        const role = body?.role as Role | undefined;
        if (!role || !VALID_ROLES.includes(role)) {
          return json({ error: "Invalid role" }, 400);
        }
        const { data, error } = await supabase
          .from("home_members")
          .update({ role })
          .eq("id", memberId)
          .select()
          .maybeSingle();
        if (error) return json({ error: error.message }, 400);
        if (!data) return json({ error: "Not found or not allowed" }, 404);
        return json({ member: data });
      }

      // DELETE /members/:id
      if (segments.length === 2 && method === "DELETE") {
        const memberId = segments[1];
        const { error } = await supabase
          .from("home_members")
          .delete()
          .eq("id", memberId);
        if (error) return json({ error: error.message }, 400);
        return json({ success: true });
      }
    }

    // ===== /invitations =====
    if (segments[0] === "invitations") {
      // GET /invitations?home_id=...
      if (segments.length === 1 && method === "GET") {
        const homeId = url.searchParams.get("home_id");
        if (!homeId) return json({ error: "home_id is required" }, 400);
        const { data, error } = await supabase
          .from("home_invitations")
          .select("*")
          .eq("home_id", homeId)
          .eq("status", "pending")
          .order("created_at", { ascending: false });
        if (error) return json({ error: error.message }, 400);
        return json({ invitations: data });
      }

      // POST /invitations
      if (segments.length === 1 && method === "POST") {
        const homeId = body?.home_id as string | undefined;
        const email = (body?.email ?? null) as string | null;
        const role = (body?.role ?? "member") as Role;
        if (!homeId) return json({ error: "home_id is required" }, 400);
        if (!VALID_ROLES.includes(role)) {
          return json({ error: "Invalid role" }, 400);
        }
        const { data, error } = await supabase
          .from("home_invitations")
          .insert({
            home_id: homeId,
            email: email && email.trim() ? email.trim().slice(0, 255) : null,
            role,
            invited_by: userId,
          })
          .select()
          .single();
        if (error) return json({ error: error.message }, 400);
        return json({ invitation: data }, 201);
      }

      // DELETE /invitations/:id  (soft cancel)
      if (segments.length === 2 && method === "DELETE") {
        const invId = segments[1];
        const { data, error } = await supabase
          .from("home_invitations")
          .update({ status: "cancelled" })
          .eq("id", invId)
          .select()
          .maybeSingle();
        if (error) return json({ error: error.message }, 400);
        if (!data) return json({ error: "Not found or not allowed" }, 404);
        return json({ invitation: data });
      }
    }

    return json({ error: "Not found", path: innerPath, method }, 404);
  } catch (e) {
    return json({ error: (e as Error).message ?? "Server error" }, 500);
  }
});
