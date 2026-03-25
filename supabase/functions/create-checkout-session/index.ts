import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("Stripe not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const userId = user.id;
    const { priceId, businessId, successUrl, cancelUrl } = await req.json();

    if (!priceId || !successUrl || !cancelUrl) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400, headers: corsHeaders });
    }

    const supabaseAdmin = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 🔥 FIX CRÍTICO: SIEMPRE asegurar businessId
    let finalBusinessId = businessId;

    if (!finalBusinessId) {
      const { data: role } = await supabase
        .from("user_roles")
        .select("business_id")
        .eq("user_id", userId)
        .eq("role", "business_admin")
        .limit(1)
        .maybeSingle();

      finalBusinessId = role?.business_id;
    }

    if (!finalBusinessId) {
      return new Response(JSON.stringify({ error: "User has no business" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    console.log("🚀 USING BUSINESS ID:", finalBusinessId);

    // 🔥 Obtener negocio
    const { data: business } = await supabase
      .from("businesses")
      .select("stripe_customer_id, name")
      .eq("id", finalBusinessId)
      .single();

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    let customerId = business?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        metadata: {
          business_id: finalBusinessId,
          user_id: userId,
        },
        name: business?.name || undefined,
      });

      customerId = customer.id;

      await supabaseAdmin
        .from("businesses")
        .update({ stripe_customer_id: customerId })
        .eq("id", finalBusinessId);
    }

    console.log("💳 CREATING CHECKOUT FOR:", finalBusinessId);

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        business_id: finalBusinessId, // 🔥 SIEMPRE
        user_id: userId,
        price_id: priceId,
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("❌ ERROR:", error);

    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});