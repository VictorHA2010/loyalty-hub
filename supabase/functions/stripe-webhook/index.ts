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

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!stripeKey || !webhookSecret) {
    return new Response(JSON.stringify({ error: "Missing Stripe config" }), { status: 500 });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new Response(JSON.stringify({ error: "No signature" }), { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      Stripe.createSubtleCryptoProvider()
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 400 });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const businessId = session.metadata?.business_id;
    const priceId = session.metadata?.price_id;

    if (!businessId) {
      console.error("No business_id in session metadata");
      return new Response(JSON.stringify({ error: "No business_id" }), { status: 400 });
    }

    // Calculate period end based on price
    let daysToAdd = 30; // default monthly
    if (priceId === "price_1TAeFwAmyaQPKkiAqZsYILm6") {
      daysToAdd = 182; // semestral
    } else if (priceId === "price_1TAeGOAmyaQPKkiAMSdISaU7") {
      daysToAdd = 365; // anual
    }

    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + daysToAdd);

    const { error } = await supabaseAdmin
      .from("businesses")
      .update({
        is_active: true,
        subscription_status: "active",
        stripe_price_id: priceId,
        current_period_end: periodEnd.toISOString(),
      })
      .eq("id", businessId);

    if (error) {
      console.error("Error updating business:", error);
      return new Response(JSON.stringify({ error: "DB update failed" }), { status: 500 });
    }

    console.log(`Business ${businessId} activated until ${periodEnd.toISOString()}`);
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
