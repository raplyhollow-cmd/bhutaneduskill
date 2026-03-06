/**
 * AI RESUME BUILDER API
 *
 * Generate resumes for RUB applications, scholarships, and jobs
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

async function callGemini(prompt: string, context?: Record<string, any>) {
  if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

  const systemPrompt = "You are a Resume Writer for Bhutanese students. Create professional, ATS-friendly resumes for RUB applications.";

  const enhancedPrompt = context
    ? `${systemPrompt}\n\nPROFILE:\n${JSON.stringify(context)}\n\nREQUEST:\n${prompt}`
    : `${systemPrompt}\n\nREQUEST:\n${prompt}`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: enhancedPrompt }] }],
      generationConfig: { temperature: 0.6, maxOutputTokens: 2000 },
    }),
  });

  if (!response.ok) throw new Error("Gemini API error");
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { action, ...params } = body;

    let result;

    switch (action) {
      case "generate": {
        const prompt = `Generate a resume for RUB application.
Name: ${params.name}
Grade: ${params.grade}
School: ${params.school}
Overall: ${params.overallPercentage}%
Skills: ${params.skills?.map((s: any) => s.name).join(", ")}
Target: ${params.targetProgram?.name || "General"}`;

        result = { resume: await callGemini(prompt, params) };
        break;
      }

      case "tailor": {
        const prompt = `Tailor resume for: ${params.targetProgram?.name} at ${params.targetProgram?.college}
\nCurrent: ${params.currentResume}`;
        result = { tailoredResume: await callGemini(prompt, params) };
        break;
      }

      case "cover-letter": {
        const prompt = `Write a cover letter for ${params.targetProgram?.name}
\nStudent: ${params.name}\nQualifications: ${params.qualifications}`;
        result = { coverLetter: await callGemini(prompt, params) };
        break;
      }

      case "improve": {
        const prompt = `Improve this resume section: ${params.content}\n\nProvide 2-3 improved versions.`;
        result = { improvements: await callGemini(prompt) };
        break;
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    return NextResponse.json({ success: true, action, result });
  } catch (error) {
    console.error("Resume Builder error:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
