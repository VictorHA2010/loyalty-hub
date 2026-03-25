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

    const businessId = session.metadata?.business_id || null;
    const priceId = session.metadata?.price_id || null;
    const userId = session.metadata?.user_id || null;

    console.log("checkout.session.completed metadata:", {
      businessId,
      priceId,
      userId,
      sessionId: session.id,
      customerId: session.customer,
    });

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

    const activateBusinessById = async (targetBusinessId: string) => {
      const { data, error } = await supabaseAdmin
        .from("businesses")
        .update(activationPayload)
        .eq("id", targetBusinessId)
        .select("id, name, is_active, subscription_status")
        .maybeSingle();

      if (error) {
        console.error("Error updating business:", error);
        throw new Error("DB update failed");
      }

      if (!data) {
        console.warn("No business found for activation:", targetBusinessId);
        return null;
      }

      console.log("Business activated:", data);
      return data;
    };

    try {
      // 1) Si Stripe mandó business_id, SIEMPRE intenta activar ESE negocio primero
      if (businessId) {
        const activated = await activateBusinessById(businessId);

        if (activated) {
          return new Response(JSON.stringify({ received: true, activatedBusinessId: businessId }), {
            headers: { "Content-Type": "application/json" },
          });
        }

        console.warn("Fallback to userId because businessId did not resolve:", businessId);
      }

      // 2) Si no se pudo por businessId, usar userId como fallback
      if (userId) {
        // Buscar el negocio más reciente donde el usuario sea business_admin
        const { data: roleRows, error: rolesError } = await supabaseAdmin
          .from("user_roles")
          .select("business_id, created_at")
          .eq("user_id", userId)
          .eq("role", "business_admin")
          .order("created_at", { ascending: false })
          .limit(1);

        if (rolesError) {
          console.error("Error loading user_roles:", rolesError);
          return new Response(JSON.stringify({ error: "Failed to load user roles" }), { status: 500 });
        }

        const existingBusinessId = roleRows?.[0]?.business_id ?? null;

        if (existingBusinessId) {
          const activated = await activateBusinessById(existingBusinessId);

          if (activated) {
            console.log(`Existing business ${existingBusinessId} activated for user ${userId}.`);
            return new Response(JSON.stringify({ received: true, activatedBusinessId: existingBusinessId }), {
              headers: { "Content-Type": "application/json" },
            });
          }
        }

        // 3) Si no hay negocio, crear uno nuevo ya activo
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
          .insert({
            name: businessName,
            slug,
            ...activationPayload,
          })
          .select("id, name")
          .single();

        if (businessError || !newBusiness) {
          console.error("Error creating business:", businessError);
          return new Response(JSON.stringify({ error: "Failed to create business" }), { status: 500 });
        }

        const { error: roleError } = await supabaseAdmin
          .from("user_roles")
          .upsert(
            {
              user_id: userId,
              business_id: newBusiness.id,
              role: "business_admin",
            },
            { onConflict: "user_id,business_id" }
          );

        if (roleError) {
          console.error("Error creating user_role:", roleError);
          return new Response(JSON.stringify({ error: "Failed to assign role" }), { status: 500 });
        }

        console.log(`Business ${newBusiness.id} created and activated for user ${userId}.`);

        return new Response(JSON.stringify({ received: true, activatedBusinessId: newBusiness.id }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      console.error("No business_id or user_id in session metadata");
      return new Response(JSON.stringify({ error: "Missing metadata" }), { status: 400 });
    } catch (err) {
      console.error("Webhook processing error:", err);
      return new Response(JSON.stringify({ error: "Webhook processing failed" }), { status: 500 });
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});