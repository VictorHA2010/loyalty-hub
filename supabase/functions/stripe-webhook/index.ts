else if (userId) {
  // ── New flow: auto-create business after payment ──

  // 1. Obtener email del usuario
  const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);

  if (userError || !userData?.user) {
    console.error("Error fetching user:", userError);
    return new Response(JSON.stringify({ error: "User not found" }), { status: 500 });
  }

  const email = userData.user.email ?? userId;
  const businessName = email.split("@")[0];

  const slug = `${businessName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${crypto.randomUUID().slice(0, 6)}`;

  // 2. Crear negocio YA ACTIVO
  const { data: newBusiness, error: businessError } = await supabaseAdmin
    .from("businesses")
    .insert({
      name: businessName,
      slug,
      is_active: true, // 🔥 CLAVE
      subscription_status: "active",
      stripe_price_id: priceId,
      current_period_end: periodEnd.toISOString(),
    })
    .select("id")
    .single();

  if (businessError || !newBusiness) {
    console.error("Error creating business:", businessError);
    return new Response(JSON.stringify({ error: "Failed to create business" }), { status: 500 });
  }

  // 3. Asignar usuario como admin
  const { error: roleError } = await supabaseAdmin
    .from("user_roles")
    .insert({
      user_id: userId,
      business_id: newBusiness.id,
      role: "business_admin",
    });

  if (roleError) {
    console.error("Error creating user_role:", roleError);
    return new Response(JSON.stringify({ error: "Failed to assign role" }), { status: 500 });
  }

  console.log(`Business ${newBusiness.id} created and assigned to user ${userId}`);
}