import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

serve(async (req) => {
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
      body, signature, webhookSecret, undefined,
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
    const priceId    = session.metadata?.price_id;
    const userId     = session.metadata?.user_id;

    let daysToAdd = 30;
    if (priceId === "price_1TAeFwAmyaQPKkiAqZsYILm6") daysToAdd = 182;
    else if (priceId === "price_1TAeGOAmyaQPKkiAMSdISaU7") daysToAdd = 365;
    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + daysToAdd);

    const activationPayload = {
      is_active: true,
      subscription_status: "active",
      stripe_price_id: priceId,
      current_period_end: periodEnd.toISOString(),
    };

    if (businessId) {
      // ── Flujo existente: activar negocio por businessId ──
      const { error } = await supabaseAdmin
        .from("businesses")
        .update(activationPayload)
        .eq("id", businessId);

      if (error) {
        console.error("Error updating business:", error);
        return new Response(JSON.stringify({ error: "DB update failed" }), { status: 500 });
      }

      console.log(`Business ${businessId} activated.`);

    } else if (userId) {
      // ── Flujo nuevo: buscar negocio existente del usuario o crear uno ──

      // 1. Buscar si el usuario ya tiene un negocio en user_roles
      const { data: existingRole } = await supabaseAdmin
        .from("user_roles")
        .select("business_id")
        .eq("user_id", userId)
        .eq("role", "business_admin")
        .maybeSingle();

      if (existingRole?.business_id) {
        // Ya tiene negocio → solo activar
        const { error } = await supabaseAdmin
          .from("businesses")
          .update(activationPayload)
          .eq("id", existingRole.business_id);

        if (error) {
          console.error("Error activating existing business:", error);
          return new Response(JSON.stringify({ error: "DB update failed" }), { status: 500 });
        }

        console.log(`Existing business ${existingRole.business_id} activated for user ${userId}.`);

      } else {
        // No tiene negocio → crear uno nuevo ya activo
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (userError || !userData?.user) {
          console.error("Error fetching user:", userError);
          return new Response(JSON.stringify({ error: "User not found" }), { status: 500 });
        }

        const email = userData.user.email ?? userId;
        const businessName = email.split("@")[0];
        const slug = `${businessName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${crypto.randomUUID().slice(0, 6)}`;

        const { data: newBusiness, error: businessError } = await supabaseAdmin
          .from("businesses")
          .insert({ name: businessName, slug, ...activationPayload })
          .select("id")
          .single();

        if (businessError || !newBusiness) {
          console.error("Error creating business:", businessError);
          return new Response(JSON.stringify({ error: "Failed to create business" }), { status: 500 });
        }

        const { error: roleError } = await supabaseAdmin
          .from("user_roles")
          .insert({ user_id: userId, business_id: newBusiness.id, role: "business_admin" });

        if (roleError) {
          console.error("Error creating user_role:", roleError);
          return new Response(JSON.stringify({ error: "Failed to assign role" }), { status: 500 });
        }

        console.log(`Business ${newBusiness.id} created and activated for user ${userId}.`);
      }

    } else {
      console.error("No business_id or user_id in session metadata");
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});