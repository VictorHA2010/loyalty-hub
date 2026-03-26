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
    console.error("❌ Signature error:", err.message);
    return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 400 });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const businessId = session.metadata?.business_id || null;
    const userId = session.metadata?.user_id || null;
    const priceId = session.metadata?.price_id || null;

    console.log("🔥 WEBHOOK HIT:", { businessId, userId, priceId });

    // calcular periodo
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

    const activateBusiness = async (id: string) => {
      const { data, error } = await supabaseAdmin
        .from("businesses")
        .update(activationPayload)
        .eq("id", id)
        .select("id, name, is_active")
        .maybeSingle();

      if (error) {
        console.error("❌ DB error:", error);
        return null;
      }

      if (!data) {
        console.warn("⚠️ No business found:", id);
        return null;
      }

      console.log("✅ Activated:", data);
      return data;
    };

    try {
      // 1️⃣ PRIORIDAD: business_id
      if (businessId) {
        const result = await activateBusiness(businessId);
        if (result) {
          return new Response(JSON.stringify({ ok: true }), { status: 200 });
        }
      }

      // 2️⃣ fallback: user_roles
      if (userId) {
        const { data: role } = await supabaseAdmin
          .from("user_roles")
          .select("business_id")
          .eq("user_id", userId)
          .eq("role", "business_admin")
          .limit(1)
          .maybeSingle();

        if (role?.business_id) {
          const result = await activateBusiness(role.business_id);
          if (result) {
            return new Response(JSON.stringify({ ok: true }), { status: 200 });
          }
        }

        // 3️⃣ último recurso: crear negocio
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);

        const email = userData?.user?.email || userId;
        const name = email.split("@")[0];
        const slug = `${name}-${crypto.randomUUID().slice(0, 6)}`;

        const { data: newBiz, error } = await supabaseAdmin
          .from("businesses")
          .insert({
            name,
            slug,
            ...activationPayload,
          })
          .select("id")
          .single();

        if (error || !newBiz) {
          console.error("❌ Create business error:", error);
          return new Response(JSON.stringify({ error: "create failed" }), { status: 500 });
        }

        await supabaseAdmin.from("user_roles").upsert({
          user_id: userId,
          business_id: newBiz.id,
          role: "business_admin",
        });

        console.log("🆕 Business created & activated:", newBiz.id);

        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      return new Response(JSON.stringify({ error: "No metadata" }), { status: 400 });

    } catch (err) {
      console.error("💥 Webhook crash:", err);
      return new Response(JSON.stringify({ error: "Webhook failed" }), { status: 500 });
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});