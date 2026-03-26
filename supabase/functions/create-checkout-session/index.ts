import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

serve(async (req) => {
  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("Stripe not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "No user" }), { status: 401 });
    }

    const { priceId, businessId, successUrl, cancelUrl } = await req.json();

    if (!priceId || !successUrl || !cancelUrl) {
      return new Response(JSON.stringify({ error: "Missing params" }), { status: 400 });
    }

    let finalBusinessId = businessId;

    // 🔥 FIX CRÍTICO
    if (!finalBusinessId) {
      const { data: role } = await supabaseAdmin
        .from("user_roles")
        .select("business_id")
        .eq("user_id", user.id)
        .eq("role", "business_admin")
        .limit(1)
        .maybeSingle();

      finalBusinessId = role?.business_id;
    }

    // 🔥 SI NO EXISTE → CREAR NEGOCIO AUTOMÁTICO
    if (!finalBusinessId) {
      const email = user.email || user.id;
      const name = email.split("@")[0];
      const slug = `${name}-${crypto.randomUUID().slice(0, 6)}`;

      const { data: newBiz } = await supabaseAdmin
        .from("businesses")
        .insert({
          name,
          slug,
          is_active: false,
        })
        .select("id")
        .single();

      finalBusinessId = newBiz!.id;

      await supabaseAdmin.from("user_roles").insert({
        user_id: user.id,
        business_id: finalBusinessId,
        role: "business_admin",
      });
    }

    console.log("✅ FINAL BUSINESS ID:", finalBusinessId);

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    const session = await stripe.checkout.sessions.create({
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        business_id: finalBusinessId,
        user_id: user.id,
        price_id: priceId,
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("💥 ERROR:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500 });
  }
});