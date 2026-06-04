// Setup Deno / Supabase Edge Function Environment for AI Trip Assistant
// Uses Gemini 3.5 Flash to evaluate user messages for completion intent & perform automatic language translation.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenAI, Type } from "npm:@google/genai";

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
    // 1. Authenticate & initialize Supabase Admin client with service key
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error("Missing system environment database credentials (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    // 2. Initialize Gemini API Client securely
    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiKey) {
      throw new Error("Missing GEMINI_API_KEY environment variable.");
    }

    const ai = new GoogleGenAI({
      apiKey: geminiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });

    // 3. Receive the webhook request payload
    const payload = await req.json();
    console.log("[Trip Assistant Webhook Payload Received]:", JSON.stringify(payload));

    // Support standard database trigger payload or direct call
    const record = payload.record || payload.new || payload;
    const messageId = record.id;
    const content = record.content;
    const rideId = record.ride_id || record.rideId;

    if (!content || !messageId || !rideId) {
      return new Response(
        JSON.stringify({ error: "No complete message record provided." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[Trip Assistant] Analyzing message: "${content}" for ride: ${rideId}`);

    // 4. Request Gemini structured evaluation
    const prompt = `Analyze this message: "${content}". Decide if the message implies that the trip/ride of VUU Transport is finished or they have successfully arrived at the destination. Also detect the language of the message and provide a high-quality translation (translate Kinyarwanda/French/Swahili/Luganda to English, or if it is English, translate to Kinyarwanda).`;

    const getAnalysisResponse = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a logistics, translation, and sentiment coordinator for VUU Transport in Rwanda. You accurately detect whether riding conditions have finished and translate colloquial sentences.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            is_completed_intent: {
              type: Type.BOOLEAN,
              description: "true if message indicates the ride/trip is completed or they have arrived safely."
            },
            detected_language: {
              type: Type.STRING,
              description: "Detected language of the input text (e.g., 'Kinyarwanda', 'English', 'French', 'Swahili', 'Luganda')"
            },
            translated_content: {
              type: Type.STRING,
              description: "High quality localization of the content. Translate Kinyarwanda/French/Swahili/Luganda to English, and English to Kinyarwanda."
            }
          },
          required: ["is_completed_intent", "detected_language", "translated_content"]
        }
      }
    });

    const analysisText = getAnalysisResponse.text;
    if (!analysisText) {
      throw new Error("Empty analysis text returned from Gemini model.");
    }

    const extraction = JSON.parse(analysisText.trim());
    console.log("[Trip Assistant Extraction Results]:", extraction);

    // 5. Update the message record in the public.messages table with translated content
    const { error: msgUpdateError } = await supabaseAdmin
      .from("messages")
      .update({
        translated_content: extraction.translated_content,
        target_language: extraction.detected_language === "English" ? "Kinyarwanda" : "English"
      })
      .eq("id", messageId);

    if (msgUpdateError) {
      console.error("[Trip Assistant] Error writing translation to messages table:", msgUpdateError);
    } else {
      console.log(`[Trip Assistant] Updated message ${messageId} with translation: "${extraction.translated_content}"`);
    }

    // 6. If the message implies completion intent, automatically set ride status to completed
    let rideStatusUpdated = false;
    if (extraction.is_completed_intent === true) {
      // Fetch current status of the ride first to ensure we don't overwrite completed or paid states unnecessarily
      const { data: rideData, error: fetchError } = await supabaseAdmin
        .from("rides")
        .select("status")
        .eq("id", rideId)
        .single();

      if (!fetchError && rideData && rideData.status !== "completed" && rideData.status !== "paid") {
        const { error: rideUpdateError } = await supabaseAdmin
          .from("rides")
          .update({ status: "completed" })
          .eq("id", rideId);

        if (rideUpdateError) {
          console.error(`[Trip Assistant] Failed updating ride ${rideId} to completed:`, rideUpdateError);
        } else {
          rideStatusUpdated = true;
          console.log(`[Trip Assistant] Automatic check-out triggered: Ride ${rideId} status set to 'completed'`);
        }
      }
    }

    return new Response(
      JSON.stringify({
        status: "success",
        analysis: extraction,
        ride_status_updated: rideStatusUpdated
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    console.error("[Trip Assistant Edge Handshake Error]:", err.message);
    return new Response(
      JSON.stringify({ error: err.message || "Internal gate exception." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
