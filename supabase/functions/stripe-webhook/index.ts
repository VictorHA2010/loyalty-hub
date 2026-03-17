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
    const userId = session.metadata?.user_id;

    // Calculate period end based on price
    let daysToAdd = 30; // default monthly
    if (priceId === "price_1TAeFwAmyaQPKkiAqZsYILm6") {
      daysToAdd = 182; // semestral
    } else if (priceId === "price_1TAeGOAmyaQPKkiAMSdISaU7") {
      daysToAdd = 365; // anual
    }

    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + daysToAdd);

    if (businessId) {
      // ── Existing flow: activate the business ──
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
    } else if (userId) {
      // ── New flow: user paid without a business ──
      // Store payment info on user's profile metadata for platform_admin to process
      console.log(`User ${userId} completed payment (price: ${priceId}) without a business. Awaiting business assignment.`);

      // We store a reference in a lightweight way: update the user's app_metadata
      // so platform_admin can see who has paid
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        app_metadata: {
          stripe_customer_id: session.customer as string,
          stripe_price_id: priceId,
          subscription_paid_at: new Date().toISOString(),
          subscription_period_end: periodEnd.toISOString(),
        },
      });

      if (error) {
        console.error("Error updating user metadata:", error);
      } else {
        console.log(`User ${userId} metadata updated with payment info`);
      }
    } else {
      console.error("No business_id or user_id in session metadata");
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
