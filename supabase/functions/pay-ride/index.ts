// Setup Deno / Supabase Edge Function Environment
// Handles Rwandan Mobile Money integration via Paypack API (MTN MoMo & Airtel)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const PAYPACK_AUTH_URL = "https://paypack.co/api/auth/agents/authorize";
const PAYPACK_CASHIN_URL = "https://paypack.co/api/transactions/cashin";

// Configured CORS headers to permit secure requests from our React app
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle preflight CORS requests gracefully
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Authenticate with environment variables stored securely in Supabase Secrets
    const clientId = Deno.env.get("PAYPACK_CLIENT_ID");
    const clientSecret = Deno.env.get("PAYPACK_CLIENT_SECRET");

    if (!clientId || !clientSecret) {
      throw new Error("Paypack credentials are missing on the server secrets configuration.");
    }

    // 2. Parse request payload and accept either snake_case or camelCase parameters
    const body = await req.json();
    const amount = body.amount;
    const phone = body.phone_number || body.phone;
    const rideId = body.ride_id || body.rideId;

    if (!amount || !phone || !rideId) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters: amount, phone_number (or phone), and ride_id (or rideId) are required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[Paypack Edge] Initializing Cash-in for ride: ${rideId}. Amount: ${amount} RWF. Target: ${phone}`);

    // 3. Authenticate with Paypack to obtain a temporary bearer token
    const authResponse = await fetch(PAYPACK_AUTH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!authResponse.ok) {
      const authErrText = await authResponse.text();
      console.error("[Paypack Edge] Auth failed:", authErrText);
      throw new Error(`Failed to authenticate with Paypack Gateway: ${authResponse.status}`);
    }

    const authData = await authResponse.json();
    const bearerToken = authData.access; // Paypack returns the JWT in client 'access' field

    // 4. Dispatch the Secured Cash-in Request (dispatches USSD push to customer's handset)
    const cashinResponse = await fetch(PAYPACK_CASHIN_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${bearerToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: Number(amount),
        phone: String(phone), // Expected in standard 10-digit or local format e.g. "078xxxxxxx"
      }),
    });

    const cashinData = await cashinResponse.json();

    if (!cashinResponse.ok) {
      console.error("[Paypack Edge] Cash-in dispatch failed:", cashinData);
      return new Response(
        JSON.stringify({
          status: "failed",
          message: cashinData.message || "Failed to trigger Cash-in transition.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Respond with positive payload containing Paypack reference ID for tracking/polling
    return new Response(
      JSON.stringify({
        status: "success",
        message: "USSD Cash-in push successfully dispatched to Rwandese mobile network.",
        ref: cashinData.ref, // Tracking reference code from Paypack
        amount: cashinData.amount,
        phone: cashinData.phone,
        operator: cashinData.provider,
        timestamp: cashinData.created_at,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("[Paypack Edge Error Handshake Exception]:", error.message);
    return new Response(
      JSON.stringify({ error: error.message || "Internal gate execution exception." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
