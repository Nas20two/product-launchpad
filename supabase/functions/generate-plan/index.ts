import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { planId, productName, valueProp } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are an expert marketing strategist. Return a JSON object with this exact structure:
{
  "content_marketing": {
    "ideas": ["idea1", "idea2", "idea3", "idea4", "idea5"],
    "topPick": { "idea": "best idea description", "pros": ["pro1", "pro2", "pro3"], "cons": ["con1", "con2"] }
  },
  "social_media": {
    "ideas": ["idea1", "idea2", "idea3", "idea4", "idea5"],
    "topPick": { "idea": "best idea description", "pros": ["pro1", "pro2", "pro3"], "cons": ["con1", "con2"] }
  },
  "partnerships": {
    "ideas": ["idea1", "idea2", "idea3", "idea4", "idea5"],
    "topPick": { "idea": "best idea description", "pros": ["pro1", "pro2", "pro3"], "cons": ["con1", "con2"] }
  },
  "next_steps": ["step1", "step2", "step3"]
}
Only return valid JSON, no markdown fences or extra text.`;

    const userPrompt = `Generate a comprehensive marketing plan for:
Product Name: ${productName}
Value Proposition: ${valueProp}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      
      await supabase.from("marketing_plans").update({ status: "failed" }).eq("id", planId);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, try again later" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";
    
    // Parse JSON from response (handle potential markdown fences)
    let parsed;
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", content);
      await supabase.from("marketing_plans").update({ status: "failed" }).eq("id", planId);
      throw new Error("Failed to parse AI response");
    }

    // Update plan with generated content
    await supabase.from("marketing_plans").update({
      content_marketing: parsed.content_marketing,
      social_media: parsed.social_media,
      partnerships: parsed.partnerships,
      next_steps: parsed.next_steps,
      status: "completed",
    }).eq("id", planId);

    // Trigger vision board generation
    const visionResponse = await fetch(`${supabaseUrl}/functions/v1/generate-vision-board`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ planId }),
    });

    if (!visionResponse.ok) {
      console.error("Vision board trigger failed:", await visionResponse.text());
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-plan error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
