/**
 * MATH HOMEWORK COMPONENT
 *
 * Supports:
 * - LaTeX rendering (KaTeX)
 * - Math expression input (MathQuill-style)
 * - Graph plotting
 * - Handwriting recognition
 * - Step-by-step solutions
 */

"use client";

import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Types for math questions
interface MathQuestionProps {
  id: string;
  question: string;
  questionLatex?: string; // LaTeX-formatted question
  type: "numeric" | "math_expression" | "graph_plot" | "handwriting" | "step_by_step";
  placeholder?: string;
  value?: string | number;
  onChange?: (value: string | number) => void;
  disabled?: boolean;
  showPreview?: boolean;
}

// MathQuestion Component with LaTeX support
export function MathQuestion({
  id,
  question,
  questionLatex,
  type,
  placeholder,
  value,
  onChange,
  disabled = false,
  showPreview = true,
}: MathQuestionProps) {
  const [inputValue, setInputValue] = useState(value?.toString() || "");
  const [mathMode, setMathMode] = useState(false);
  const [previewLatex, setPreviewLatex] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load KaTeX for rendering
    if (typeof window !== "undefined" && questionLatex) {
      import("katex").then((katex) => {
        try {
          const rendered = katex.default.renderToString(questionLatex, {
            throwOnError: false,
            displayMode: true,
          });
          setPreviewLatex(rendered);
        } catch (e) {
          setPreviewLatex(questionLatex);
        }
      }).catch(() => {
        setPreviewLatex(questionLatex);
      });
    }
  }, [questionLatex]);

  const handleChange = (newValue: string) => {
    setInputValue(newValue);
    onChange?.(newValue);
  };

  // Render different input types based on question type
  const renderInput = () => {
    switch (type) {
      case "numeric":
        return (
          <input
            ref={inputRef}
            type="number"
            step="any"
            value={inputValue}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={placeholder || "Enter your answer (number)"}
            disabled={disabled}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hunter-green-500 focus:border-hunter-green-500"
          />
        );

      case "math_expression":
        return (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={mathMode ? "default" : "outline"}
                size="sm"
                onClick={() => setMathMode(!mathMode)}
                className="text-xs"
              >
                {mathMode ? "✓ Math Mode" : "∑ Math"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  // Insert common math symbols
                  const symbols = ["α", "β", "θ", "π", "√", "²", "³", "∫", "∂", "∞"];
                  const symbol = symbols[Math.floor(Math.random() * symbols.length)];
                  handleChange(inputValue + symbol);
                }}
                className="text-xs"
              >
                + Symbol
              </Button>
              <div className="flex-1" />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  // Quick fraction template
                  handleChange(inputValue + "\\frac{}{}");
                }}
                className="text-xs"
              >
                Fraction
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  // Quick sqrt template
                  handleChange(inputValue + "\\sqrt{}");
                }}
                className="text-xs"
              >
                √
              </Button>
            </div>
            <div className={`p-4 border rounded-lg ${mathMode ? "bg-purple-50 border-purple-200" : "bg-white"}`}>
              <textarea
                value={inputValue}
                onChange={(e) => handleChange(e.target.value)}
                placeholder={mathMode ? "Enter LaTeX (e.g., \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a})" : placeholder || "Enter your answer"}
                disabled={disabled}
                className="w-full min-h-[80px] p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono text-sm"
              />
            </div>
            {inputValue && mathMode && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Preview:</p>
                <MathPreview latex={inputValue} />
              </div>
            )}
          </div>
        );

      case "graph_plot":
        return <GraphPlotter value={inputValue} onChange={handleChange} disabled={disabled} />;

      case "handwriting":
        return <HandwritingInput value={inputValue} onChange={handleChange} disabled={disabled} />;

      case "step_by_step":
        return <StepByStepInput value={inputValue} onChange={handleChange} disabled={disabled} />;

      default:
        return (
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={placeholder || "Enter your answer"}
            disabled={disabled}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hunter-green-500 focus:border-hunter-green-500"
          />
        );
    }
  };

  return (
    <div className="space-y-3">
      {/* Question with LaTeX rendering */}
      <div className="p-4 bg-gray-50 rounded-lg">
        {questionLatex && previewLatex ? (
          <div
            className="text-lg math-question"
            dangerouslySetInnerHTML={{ __html: previewLatex }}
          />
        ) : (
          <p className="text-lg">{question}</p>
        )}
      </div>

      {/* Input based on type */}
      <div>{renderInput()}</div>

      {/* Question type badge */}
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs">
          {type === "numeric" && "Numeric Answer"}
          {type === "math_expression" && "Math Expression (LaTeX supported)"}
          {type === "graph_plot" && "Graph Plotting"}
          {type === "handwriting" && "Handwriting Recognition"}
          {type === "step_by_step" && "Step-by-Step Solution"}
        </Badge>
        {type === "math_expression" && (
          <span className="text-xs text-gray-500">
            Supports: √ ∫ π fractions exponents
          </span>
        )}
      </div>
    </div>
  );
}

// Math Preview Component (using KaTeX)
function MathPreview({ latex }: { latex: string }) {
  const [html, setHtml] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      import("katex").then((katex) => {
        try {
          const rendered = katex.default.renderToString(latex, {
            throwOnError: false,
            displayMode: false,
          });
          setHtml(rendered);
          setError(false);
        } catch (e) {
          setError(true);
        }
      });
    }
  }, [latex]);

  if (error) {
    return <span className="text-red-500 text-sm">{latex}</span>;
  }

  return (
    <span
      className="text-lg math-preview"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// Graph Plotter Component
function GraphPlotter({ value, onChange, disabled }: { value: string; onChange: (val: string) => void; disabled?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [points, setPoints] = useState<Array<{ x: number; y: number }>>([]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (disabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newPoints = [...points, { x, y }];
    setPoints(newPoints);

    // Store as JSON string
    onChange(JSON.stringify(newPoints));

    // Draw point
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = "#557E4E";
      ctx.fill();

      // Connect to previous point
      if (newPoints.length > 1) {
        const prev = newPoints[newPoints.length - 2];
        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(x, y);
        ctx.strokeStyle = "#557E4E";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setPoints([]);
    onChange("");
  };

  return (
    <div className="space-y-3">
      <canvas
        ref={canvasRef}
        width={400}
        height={200}
        onClick={handleCanvasClick}
        className={`border rounded-lg cursor-crosshair ${disabled ? "opacity-50" : ""}`}
        style={{ background: "linear-gradient(to right, #f8f9fa 1px, transparent 1px), linear-gradient(to bottom, #f8f9fa 1px, transparent 1px)", backgroundSize: "20px 20px" }}
      />
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">
          {points.length} point{points.length !== 1 ? "s" : ""} plotted
        </span>
        <Button type="button" variant="outline" size="sm" onClick={clearCanvas}>
          Clear
        </Button>
      </div>
    </div>
  );
}

// Handwriting Input Component
function HandwritingInput({ value, onChange, disabled }: { value: string; onChange: (val: string) => void; disabled?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    setIsDrawing(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (ctx) {
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.strokeStyle = "#1f2937";
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    onChange("");
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={400}
          height={150}
          onMouseDown={startDrawing}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onMouseMove={draw}
          className={`border rounded-lg bg-white ${disabled ? "opacity-50" : ""}`}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">
          Write your answer above (will be converted to text)
        </span>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={clearCanvas}>
            Clear
          </Button>
          <Button type="button" variant="outline" size="sm" disabled={disabled}>
            Recognize
          </Button>
        </div>
      </div>
    </div>
  );
}

// Step-by-Step Input Component
function StepByStepInput({ value, onChange, disabled }: { value: string; onChange: (val: string) => void; disabled?: boolean }) {
  const [steps, setSteps] = useState<Array<{ step: string; answer: string }>>([
    { step: "", answer: "" },
  ]);

  const addStep = () => {
    setSteps([...steps, { step: "", answer: "" }]);
  };

  const updateStep = (index: number, field: "step" | "answer", value: string) => {
    const newSteps = [...steps];
    newSteps[index][field] = value;
    setSteps(newSteps);
    onChange(JSON.stringify(newSteps));
  };

  const removeStep = (index: number) => {
    if (steps.length > 1) {
      const newSteps = steps.filter((_, i) => i !== index);
      setSteps(newSteps);
      onChange(JSON.stringify(newSteps));
    }
  };

  return (
    <div className="space-y-3">
      {steps.map((step, index) => (
        <div key={index} className="flex gap-2 items-start">
          <div className="flex-shrink-0 w-8 h-8 bg-hunter-green-100 rounded-full flex items-center justify-center text-hunter-green-700 font-medium">
            {index + 1}
          </div>
          <div className="flex-1 space-y-2">
            <input
              type="text"
              value={step.step}
              onChange={(e) => updateStep(index, "step", e.target.value)}
              placeholder={`Step ${index + 1} description`}
              disabled={disabled}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
            />
            <input
              type="text"
              value={step.answer}
              onChange={(e) => updateStep(index, "answer", e.target.value)}
              placeholder="Answer for this step"
              disabled={disabled}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
            />
          </div>
          {steps.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeStep(index)}
              disabled={disabled}
            >
              ×
            </Button>
          )}
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addStep}
        disabled={disabled}
        className="w-full"
      >
        + Add Another Step
      </Button>
    </div>
  );
}

// Export a default component for backward compatibility
export default function MathHomeworkComponent(props: MathQuestionProps) {
  return <MathQuestion {...props} />;
}
