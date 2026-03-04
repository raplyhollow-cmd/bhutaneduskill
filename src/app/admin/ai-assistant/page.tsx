/**
 * AI ASSISTANT PAGE
 *
 * Demonstrates the Gemini Layer in action.
 * Accessible at: /admin/ai-assistant
 */

import { GeminiAssistant, SelfHealingDiagnostic } from "@/components/intelligence";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Sparkles, Database, Shield, Zap } from "lucide-react";

export default function AIAssistantPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          AI Assistant
        </h1>
        <p className="text-muted-foreground">
          Powered by the Gemini Layer - Metadata-Driven AI Architecture
        </p>
      </div>

      {/* Feature Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <FeatureCard
          icon={<Database className="h-5 w-5" />}
          title="System Awareness"
          description="AI reads your feature configurations directly to understand your data model."
        />
        <FeatureCard
          icon={<Zap className="h-5 w-5" />}
          title="Autonomous Querying"
          description="AI autonomously queries the universal API to answer questions."
        />
        <FeatureCard
          icon={<Shield className="h-5 w-5" />}
          title="Self-Healing"
          description="AI analyzes errors and provides intelligent fix suggestions."
        />
      </div>

      {/* Main Content */}
      <Tabs defaultValue="chat" className="space-y-4">
        <TabsList>
          <TabsTrigger value="chat">AI Chat</TabsTrigger>
          <TabsTrigger value="diagnostic">Error Diagnostic</TabsTrigger>
          <TabsTrigger value="docs">Documentation</TabsTrigger>
        </TabsList>

        <TabsContent value="chat">
          <GeminiAssistant />
        </TabsContent>

        <TabsContent value="diagnostic">
          <Card>
            <CardHeader>
              <CardTitle>Self-Healing Diagnostic Demo</CardTitle>
              <CardDescription>
                See how the AI analyzes errors and suggests fixes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SelfHealingDiagnostic
                error={new Error("column 'email' does not exist in table 'students'")}
                context={{
                  feature: "students",
                  operation: "create",
                  testData: { name: "John Doe", classId: "class-10a" },
                }}
                onFix={(suggestion) => {
                  console.log("Would apply fix:", suggestion);
                  alert(`Fix: ${suggestion}`);
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="docs">
          <Card>
            <CardHeader>
              <CardTitle>Gemini Layer Documentation</CardTitle>
              <CardDescription>
                Learn how the metadata-driven AI architecture works
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">How It Works</h3>
                <p className="text-sm text-muted-foreground">
                  The Gemini Layer leverages your Unified Architecture. Because all features
                  follow a declarative pattern, the AI can read your system configuration directly
                  without any custom glue code.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">API Endpoints</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• GET /api/intelligence/gemini?mode=metadata - Get system metadata</li>
                  <li>• GET /api/intelligence/gemini?mode=system-prompt - Get AI system prompt</li>
                  <li>• POST /api/intelligence/gemini - Ask questions or analyze errors</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Example Questions</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• "How many students are in Class 10A?"</li>
                  <li>• "Show me teachers who teach Mathematics"</li>
                  <li>• "Which subjects have no assigned teachers?"</li>
                  <li>• "What's our attendance rate this month?"</li>
                </ul>
              </div>

              <Button asChild>
                <a href="/docs/intelligence/gemini-layer" target="_blank">
                  View Full Documentation
                </a>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card>
      <CardHeader className="space-y-2">
        <div className="flex items-center gap-2">
          {icon}
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}
