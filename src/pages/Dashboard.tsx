import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Sparkles, LogOut, Trash2, Copy, Clock } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Plan = Tables<"marketing_plans">;

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    const { data, error } = await supabase
      .from("marketing_plans")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error loading plans", description: error.message, variant: "destructive" });
    } else {
      setPlans(data || []);
    }
    setLoading(false);
  };

  const deletePlan = async (id: string) => {
    const { error } = await supabase.from("marketing_plans").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setPlans((prev) => prev.filter((p) => p.id !== id));
      toast({ title: "Plan deleted" });
    }
  };

  const copyPlan = (plan: Plan) => {
    const content = [
      `# Marketing Plan: ${plan.product_name}`,
      `**Value Proposition:** ${plan.value_proposition}`,
      "",
      "## Content Marketing",
      JSON.stringify(plan.content_marketing, null, 2),
      "",
      "## Social Media",
      JSON.stringify(plan.social_media, null, 2),
      "",
      "## Partnerships",
      JSON.stringify(plan.partnerships, null, 2),
      "",
      "## Next Steps",
      JSON.stringify(plan.next_steps, null, 2),
    ].join("\n");
    navigator.clipboard.writeText(content);
    toast({ title: "Copied to clipboard!" });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Marketing Maven</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">{user?.email}</span>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Your Marketing Plans</h2>
            <p className="text-muted-foreground">Generate and manage AI-powered marketing strategies</p>
          </div>
          <Button onClick={() => navigate("/new-plan")} className="gradient-primary gap-2">
            <Plus className="h-4 w-4" /> New Plan
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : plans.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Sparkles className="mb-4 h-12 w-12 text-muted-foreground/40" />
              <h3 className="mb-2 text-lg font-semibold">No plans yet</h3>
              <p className="mb-6 text-muted-foreground">Create your first AI-powered marketing plan</p>
              <Button onClick={() => navigate("/new-plan")} className="gradient-primary gap-2">
                <Plus className="h-4 w-4" /> Create Your First Plan
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30"
                onClick={() => navigate(`/plan/${plan.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg leading-tight">{plan.product_name}</CardTitle>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        plan.status === "completed"
                          ? "bg-primary/10 text-primary"
                          : plan.status === "generating"
                          ? "bg-accent/10 text-accent"
                          : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {plan.status}
                    </span>
                  </div>
                  <CardDescription className="line-clamp-2">{plan.value_proposition}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(plan.created_at).toLocaleDateString()}
                    </span>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyPlan(plan)}>
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deletePlan(plan.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
