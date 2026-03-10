import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Copy, RefreshCw, Sparkles, Image as ImageIcon, ListChecks, Lightbulb } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Plan = Tables<"marketing_plans">;

interface CategoryData {
  ideas: string[];
  topPick: {
    idea: string;
    pros: string[];
    cons: string[];
  };
}

const PlanResults = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!id) return;
    fetchPlan();
    // Poll while generating
    const interval = setInterval(async () => {
      const { data } = await supabase.from("marketing_plans").select("*").eq("id", id).single();
      if (data) {
        setPlan(data);
        if (data.status !== "generating") clearInterval(interval);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [id]);

  const fetchPlan = async () => {
    const { data, error } = await supabase.from("marketing_plans").select("*").eq("id", id!).single();
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      navigate("/dashboard");
    } else {
      setPlan(data);
    }
    setLoading(false);
  };

  const regenerateVisionBoard = async () => {
    if (!plan) return;
    setRegenerating(true);
    try {
      await supabase.functions.invoke("generate-vision-board", {
        body: { planId: plan.id },
      });
      toast({ title: "Vision board regeneration started!" });
      // Poll for update
      setTimeout(fetchPlan, 5000);
    } catch {
      toast({ title: "Error regenerating", variant: "destructive" });
    }
    setRegenerating(false);
  };

  const toggleStep = (index: number) => {
    setCheckedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const copyToClipboard = () => {
    if (!plan) return;
    const sections = [
      `# Marketing Plan: ${plan.product_name}`,
      `**Value Proposition:** ${plan.value_proposition}\n`,
    ];
    const categories = [
      { name: "Content Marketing", data: plan.content_marketing },
      { name: "Social Media", data: plan.social_media },
      { name: "Partnerships", data: plan.partnerships },
    ];
    categories.forEach(({ name, data }) => {
      const cat = data as CategoryData | null;
      if (cat) {
        sections.push(`## ${name}`);
        sections.push(`**Ideas:** ${cat.ideas?.join(", ") || "N/A"}`);
        if (cat.topPick) {
          sections.push(`**Top Pick:** ${cat.topPick.idea}`);
          sections.push(`Pros: ${cat.topPick.pros?.join(", ")}`);
          sections.push(`Cons: ${cat.topPick.cons?.join(", ")}\n`);
        }
      }
    });
    const steps = plan.next_steps as string[] | null;
    if (steps) {
      sections.push("## Next Steps");
      steps.forEach((s, i) => sections.push(`${i + 1}. ${s}`));
    }
    navigator.clipboard.writeText(sections.join("\n"));
    toast({ title: "Copied to clipboard!" });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!plan) return null;

  const isGenerating = plan.status === "generating";
  const categories = [
    { key: "content", label: "Content Marketing", icon: Lightbulb, data: plan.content_marketing as unknown as CategoryData | null },
    { key: "social", label: "Social Media", icon: Sparkles, data: plan.social_media as unknown as CategoryData | null },
    { key: "partnerships", label: "Partnerships", icon: ListChecks, data: plan.partnerships as unknown as CategoryData | null },
  ];
  const nextSteps = plan.next_steps as string[] | null;
  const visionUrls = plan.vision_board_urls || [];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold tracking-tight">{plan.product_name}</h1>
              <p className="text-sm text-muted-foreground">{plan.value_proposition}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={copyToClipboard}>
            <Copy className="h-3.5 w-3.5" /> Export
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 px-6 py-8">
        {isGenerating && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="flex items-center gap-4 py-6">
              <div className="h-6 w-6 animate-spin rounded-full border-3 border-primary border-t-transparent" />
              <div>
                <p className="font-semibold">Generating your marketing plan...</p>
                <p className="text-sm text-muted-foreground">This usually takes 30-60 seconds. The page will update automatically.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Marketing Ideas Tabs */}
        {!isGenerating && (categories[0].data || categories[1].data || categories[2].data) && (
          <section>
            <h2 className="mb-4 text-xl font-bold flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" /> Marketing Ideas
            </h2>
            <Tabs defaultValue="content">
              <TabsList className="mb-4">
                {categories.map((cat) => (
                  <TabsTrigger key={cat.key} value={cat.key}>
                    {cat.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {categories.map((cat) => (
                <TabsContent key={cat.key} value={cat.key}>
                  {cat.data ? (
                    <div className="space-y-4">
                      {cat.data.ideas && (
                        <Card>
                          <CardHeader><CardTitle className="text-base">All Ideas</CardTitle></CardHeader>
                          <CardContent>
                            <ul className="space-y-2">
                              {cat.data.ideas.map((idea, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm">
                                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                                    {i + 1}
                                  </span>
                                  {idea}
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      )}
                      {cat.data.topPick && (
                        <Card className="border-primary/20 bg-primary/5">
                          <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                              <Sparkles className="h-4 w-4 text-primary" /> Top Pick
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <p className="font-medium">{cat.data.topPick.idea}</p>
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div className="rounded-lg bg-background p-3">
                                <p className="mb-1 text-xs font-semibold text-primary">Pros</p>
                                <ul className="space-y-1">
                                  {cat.data.topPick.pros?.map((p, i) => (
                                    <li key={i} className="text-sm text-muted-foreground">✓ {p}</li>
                                  ))}
                                </ul>
                              </div>
                              <div className="rounded-lg bg-background p-3">
                                <p className="mb-1 text-xs font-semibold text-destructive">Cons</p>
                                <ul className="space-y-1">
                                  {cat.data.topPick.cons?.map((c, i) => (
                                    <li key={i} className="text-sm text-muted-foreground">✗ {c}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  ) : (
                    <p className="py-8 text-center text-muted-foreground">No data yet</p>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </section>
        )}

        {/* Vision Board */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" /> Vision Board
            </h2>
            {!isGenerating && (
              <Button variant="outline" size="sm" className="gap-2" onClick={regenerateVisionBoard} disabled={regenerating}>
                <RefreshCw className={`h-3.5 w-3.5 ${regenerating ? "animate-spin" : ""}`} />
                Regenerate
              </Button>
            )}
          </div>
          {visionUrls.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-3">
              {visionUrls.map((url, i) => (
                <Card key={i} className="overflow-hidden">
                  <img src={url} alt={`Vision board ${i + 1}`} className="aspect-square w-full object-cover" />
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ImageIcon className="mb-3 h-10 w-10 text-muted-foreground/40" />
                <p className="text-muted-foreground">
                  {isGenerating ? "Vision board images are being generated..." : "No vision board images yet"}
                </p>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Next Steps */}
        {nextSteps && nextSteps.length > 0 && (
          <section>
            <h2 className="mb-4 text-xl font-bold flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-primary" /> Next Steps
            </h2>
            <Card>
              <CardContent className="pt-6">
                <ul className="space-y-3">
                  {nextSteps.map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Checkbox
                        checked={checkedSteps.has(i)}
                        onCheckedChange={() => toggleStep(i)}
                        className="mt-0.5"
                      />
                      <span className={`text-sm ${checkedSteps.has(i) ? "line-through text-muted-foreground" : ""}`}>
                        {step}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </section>
        )}
      </main>
    </div>
  );
};

export default PlanResults;
