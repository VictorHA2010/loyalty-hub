import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");

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

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const email = user?.email;
    const supabaseAdmin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    let customerId: string | undefined;

    if (businessId) {
      // ── Existing flow: user has a business ──
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("business_id", businessId)
        .eq("role", "business_admin")
        .maybeSingle();

      if (!roleData) {
        return new Response(JSON.stringify({ error: "Not authorized for this business" }), { status: 403, headers: corsHeaders });
      }

      const { data: business } = await supabase
        .from("businesses")
        .select("stripe_customer_id, name")
        .eq("id", businessId)
        .single();

      customerId = business?.stripe_customer_id;

      if (!customerId) {
        const customer = await stripe.customers.create({
          email: email || undefined,
          metadata: { business_id: businessId, user_id: userId },
          name: business?.name || undefined,
        });
        customerId = customer.id;

        await supabaseAdmin
          .from("businesses")
          .update({ stripe_customer_id: customerId })
          .eq("id", businessId);
      }
    } else {
      // ── New flow: user without business (new signup) ──
      // Search for existing Stripe customer by email
      const existingCustomers = await stripe.customers.list({ email: email || undefined, limit: 1 });
      if (existingCustomers.data.length > 0) {
        customerId = existingCustomers.data[0].id;
      } else {
        const customer = await stripe.customers.create({
          email: email || undefined,
          metadata: { user_id: userId },
        });
        customerId = customer.id;
      }
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        ...(businessId ? { business_id: businessId } : {}),
        user_id: userId,
        price_id: priceId,
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
