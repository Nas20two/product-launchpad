import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Rocket } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const NewPlan = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [productName, setProductName] = useState("");
  const [valueProp, setValueProp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      // Create the plan record
      const { data: plan, error: insertError } = await supabase
        .from("marketing_plans")
        .insert({
          user_id: user.id,
          product_name: productName,
          value_proposition: valueProp,
          status: "generating",
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Trigger generation via edge function (non-blocking)
      supabase.functions.invoke("generate-plan", {
        body: { planId: plan.id, productName, valueProp },
      });

      navigate(`/plan/${plan.id}`);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-6 py-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold tracking-tight">New Marketing Plan</h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-primary" /> Tell us about your product
            </CardTitle>
            <CardDescription>
              We'll generate a comprehensive marketing strategy with content ideas, a vision board, and actionable next steps.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="productName">Product Name</Label>
                <Input
                  id="productName"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g. Notion, Slack, Figma"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valueProp">Value Proposition</Label>
                <Textarea
                  id="valueProp"
                  value={valueProp}
                  onChange={(e) => setValueProp(e.target.value)}
                  placeholder="One sentence describing what makes your product unique and valuable..."
                  required
                  rows={3}
                />
              </div>
              <Button type="submit" className="w-full gradient-primary gap-2" disabled={loading}>
                {loading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Rocket className="h-4 w-4" /> Generate Marketing Plan
                  </>
                )}
              </Button>
            </CardContent>
          </form>
        </Card>
      </main>
    </div>
  );
};

export default NewPlan;
