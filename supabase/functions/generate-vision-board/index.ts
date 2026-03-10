import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { planId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Fetch the plan
    const { data: plan, error: fetchError } = await supabase
      .from("marketing_plans")
      .select("*")
      .eq("id", planId)
      .single();

    if (fetchError || !plan) throw new Error("Plan not found");

    const categories = [
      { name: "Content Marketing", data: plan.content_marketing },
      { name: "Social Media", data: plan.social_media },
      { name: "Partnerships", data: plan.partnerships },
    ];

    const imageUrls: string[] = [];

    for (const cat of categories) {
      const topPick = (cat.data as any)?.topPick?.idea || cat.name;
      const prompt = `Create a vibrant, inspiring vision board collage image for this marketing concept: "${topPick}" for the product "${plan.product_name}". Style: modern vision board with collage elements, mood board aesthetic, vibrant and positive color palette with teal accents, dynamic composition conveying innovation and growth. Include visual metaphors for marketing success. On a clean background.`;

      try {
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-image",
            messages: [{ role: "user", content: prompt }],
            modalities: ["image", "text"],
          }),
        });

        if (!aiResponse.ok) {
          console.error(`Image gen failed for ${cat.name}:`, aiResponse.status);
          continue;
        }

        const aiData = await aiResponse.json();
        const imageData = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (imageData) {
          // Extract base64 data and upload to storage
          const base64 = imageData.replace(/^data:image\/\w+;base64,/, "");
          const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
          const filePath = `${planId}/${cat.name.toLowerCase().replace(/\s+/g, "-")}.png`;

          const { error: uploadError } = await supabase.storage
            .from("vision-boards")
            .upload(filePath, bytes, { contentType: "image/png", upsert: true });

          if (uploadError) {
            console.error("Upload error:", uploadError);
            continue;
          }

          const { data: urlData } = supabase.storage.from("vision-boards").getPublicUrl(filePath);
          imageUrls.push(urlData.publicUrl);
        }
      } catch (imgErr) {
        console.error(`Image generation error for ${cat.name}:`, imgErr);
      }
    }

    // Update plan with vision board URLs
    await supabase
      .from("marketing_plans")
      .update({ vision_board_urls: imageUrls })
      .eq("id", planId);

    return new Response(JSON.stringify({ success: true, imageUrls }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-vision-board error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
