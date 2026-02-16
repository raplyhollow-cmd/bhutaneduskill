"use client";

import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ArrowRight, Download, Share2 } from "lucide-react";
import Link from "next/link";

interface ResultsCardProps {
  title: string;
  description: string;
  badge?: string;
  children: ReactNode;
  actions?: Array<{
    label: string;
    href?: string;
    onClick?: () => void;
    variant?: "default" | "outline" | "secondary";
  }>;
  showActions?: boolean;
}

export function ResultsCard({
  title,
  description,
  badge,
  children,
  actions,
  showActions = true,
}: ResultsCardProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-gray-600">{description}</p>
      </div>

      {/* Badge */}
      {badge && (
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Your Result</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-5xl font-bold mb-4">{badge}</div>
          </CardContent>
        </Card>
      )}

      {/* Results Content */}
      {children}

      {/* Default Actions */}
      {showActions && !actions && (
        <div className="flex flex-wrap gap-4">
          <Button asChild>
            <Link href="/dashboard/careers">
              View Career Matches
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Download Report
          </Button>
          <Button variant="outline">
            <Share2 className="w-4 h-4 mr-2" />
            Share Results
          </Button>
        </div>
      )}

      {/* Custom Actions */}
      {actions && (
        <div className="flex flex-wrap gap-4">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || "default"}
              onClick={action.onClick}
              asChild={!!action.href}
            >
              {action.href ? <Link href={action.href}>{action.label}</Link> : action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

interface ScoreBarProps {
  label: string;
  description: string;
  score: number;
  isHighest?: boolean;
  color?: string;
}

export function ScoreBar({ label, description, score, isHighest, color }: ScoreBarProps) {
  const defaultColor = color || (isHighest ? "bg-blue-500" : "bg-gray-400");

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg">{label}</span>
          {isHighest && <Badge variant="default">Dominant</Badge>}
        </div>
        <span className="text-sm text-gray-500">{score}%</span>
      </div>
      <p className="text-sm text-gray-600 mb-2">{description}</p>
      <Progress value={score} className="h-3" />
    </div>
  );
}

interface TraitCardProps {
  title: string;
  icon: string;
  description: string;
  items: string[];
}

export function TraitCard({ title, icon, description, items }: TraitCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">•</span>
              <span className="text-gray-700">{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

interface SuggestionCardProps {
  title: string;
  suggestions: string[];
  icon?: string;
}

export function SuggestionCard({ title, suggestions, icon }: SuggestionCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon && <span>{icon}</span>}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion, index) => (
            <Badge key={index} variant="secondary" className="px-3 py-1">
              {suggestion}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
