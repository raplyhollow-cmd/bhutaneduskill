/**
 * DATA EXPORT PAGE
 *
 * Central hub for exporting all ecosystem data in any format.
 * This is where the main asset (DATA) becomes accessible and portable.
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataManager } from "@/components/data/data-manager";
import {
  Download,
  FileJson,
  FileSpreadsheet,
  FileText,
  Database,
  FilePieChart,
  Sparkles,
  ChevronRight,
  Info,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { dataSources, reportTemplates } from "@/lib/data-export";

const dataCategories = [
  {
    id: "assessments",
    name: "Assessment Data",
    description: "All personality, aptitude, and career assessment results",
    icon: Sparkles,
    sources: ["riasecResults", "mbtiResults", "discResults", "workValuesResults", "learningStylesResults"],
    color: "bg-orange-100 text-orange-700",
  },
  {
    id: "users",
    name: "User Data",
    description: "Student, teacher, parent, and counselor information",
    icon: Database,
    sources: ["users", "classes", "schools"],
    color: "bg-blue-100 text-blue-700",
  },
  {
    id: "careers",
    name: "Career Data",
    description: "Career matches, plans, and pathways",
    icon: Briefcase,
    sources: ["careerMatches", "careerPlans"],
    color: "bg-red-100 text-red-700",
  },
  {
    id: "academic",
    name: "Academic Data",
    description: "Exam results and academic performance",
    icon: FilePieChart,
    sources: ["examResults"],
    color: "bg-gray-100 text-gray-700",
  },
];

const exportFormats = [
  { id: "json", name: "JSON", description: "Machine-readable, full data structure", icon: FileJson },
  { id: "csv", name: "CSV", description: "Spreadsheet compatible", icon: FileSpreadsheet },
  { id: "xml", name: "XML", description: "Structured data format", icon: FileText },
  { id: "excel", name: "Excel", description: "Microsoft Excel format", icon: FileSpreadsheet },
];

const recentExports = [
  { id: "exp-1", name: "Student Assessment Report", format: "PDF", date: "2 hours ago", status: "completed" },
  { id: "exp-2", name: "RIASEC Results All", format: "CSV", date: "Yesterday", status: "completed" },
  { id: "exp-3", name: "Career Analytics Q1", format: "Excel", date: "3 days ago", status: "completed" },
];

export default function DataExportPage() {
  const [selectedCategory, setSelectedCategory] = useState("assessments");
  const [selectedSource, setSelectedSource] = useState("riasecResults");
  const [selectedFormat, setSelectedFormat] = useState("json");
  const [viewMode, setViewMode] = useState<"quick" | "advanced">("quick");

  const category = dataCategories.find((c) => c.id === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Data Export Center</h1>
        <p className="text-gray-600">
          Export ecosystem data in any format. Data is the main asset - keep it portable and accessible.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Database className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{Object.keys(dataSources).length}</p>
                <p className="text-sm text-gray-500">Data Sources</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileJson className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{exportFormats.length}</p>
                <p className="text-sm text-gray-500">Export Formats</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <FilePieChart className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{reportTemplates.length}</p>
                <p className="text-sm text-gray-500">Report Templates</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <Download className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{recentExports.length}</p>
                <p className="text-sm text-gray-500">Recent Exports</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="quick" value={viewMode} onValueChange={(v) => setViewMode(v as "quick" | "advanced")} className="w-full">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="quick">Quick Export</TabsTrigger>
            <TabsTrigger value="advanced">Advanced Data Manager</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Info className="w-4 h-4" />
            <span>All exports are logged for audit purposes</span>
          </div>
        </div>

        {/* Quick Export Tab */}
        <TabsContent value="quick" className="space-y-6 mt-6">
          {/* Category Selection */}
          <div className="grid md:grid-cols-4 gap-4">
            {dataCategories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;

              return (
                <Card
                  key={cat.id}
                  className={`cursor-pointer transition-all ${
                    isSelected ? "ring-2 ring-orange-500 bg-orange-50" : "hover:bg-gray-50"
                  }`}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${cat.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <CardTitle className="text-base">{cat.name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-2">{cat.description}</p>
                    <Badge variant="outline">{cat.sources.length} sources</Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Source Selection */}
          {category && (
            <Card>
              <CardHeader>
                <CardTitle>Select Data Source</CardTitle>
                <CardDescription>Choose the specific data table to export</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  {category.sources.map((sourceKey) => {
                    const source = dataSources[sourceKey as keyof typeof dataSources];
                    if (!source) return null;

                    const isSelected = selectedSource === sourceKey;

                    return (
                      <Card
                        key={sourceKey}
                        className={`cursor-pointer transition-all ${
                          isSelected
                            ? "ring-2 ring-orange-500 bg-orange-50"
                            : "hover:bg-gray-50"
                        }`}
                        onClick={() => setSelectedSource(sourceKey)}
                      >
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold">{source.name}</h3>
                            {isSelected && (
                              <CheckCircle className="w-5 h-5 text-orange-600" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{source.description}</p>
                          <Badge variant="outline">{source.fields.length} fields</Badge>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Format Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Export Format</CardTitle>
              <CardDescription>Choose the output format for your data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                {exportFormats.map((format) => {
                  const Icon = format.icon;
                  const isSelected = selectedFormat === format.id;

                  return (
                    <Card
                      key={format.id}
                      className={`cursor-pointer transition-all ${
                        isSelected
                          ? "ring-2 ring-orange-500 bg-orange-50"
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() => setSelectedFormat(format.id)}
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-3 mb-2">
                          <Icon className={`w-6 h-6 ${isSelected ? "text-orange-600" : "text-gray-500"}`} />
                          <h3 className="font-semibold">{format.name}</h3>
                        </div>
                        <p className="text-sm text-gray-600">{format.description}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Export Button */}
          <Card
            className="border-orange-200"
            style={{ background: 'linear-gradient(to right, rgb(255 247 237), rgb(219 234 254))' }}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg mb-1">Ready to Export</h3>
                  <p className="text-sm text-gray-600">
                    {dataSources[selectedSource as keyof typeof dataSources]?.name} → {selectedFormat.toUpperCase()}
                  </p>
                </div>
                <Button
                  size="lg"
                  className="bg-orange-600 hover:bg-orange-700"
                  onClick={async () => {
                    const response = await fetch("/api/data-export", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        dataSource: selectedSource,
                        format: selectedFormat,
                      }),
                    });

                    if (response.ok) {
                      const blob = await response.blob();
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = response.headers.get("Content-Disposition")?.split("filename=")[1]?.replace(/"/g, "") || `export.${selectedFormat}`;
                      a.click();
                    }
                  }}
                >
                  <Download className="w-5 h-5 mr-2" />
                  Export Now
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Data Manager Tab */}
        <TabsContent value="advanced" className="mt-6">
          <DataManager embedded />
        </TabsContent>
      </Tabs>

      {/* Recent Exports */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Exports</CardTitle>
              <CardDescription>Your export history</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              View All
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentExports.map((export_) => (
              <div
                key={export_.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    {export_.format === "PDF" ? (
                      <FileText className="w-5 h-5 text-red-500" />
                    ) : export_.format === "CSV" ? (
                      <FileSpreadsheet className="w-5 h-5 text-green-500" />
                    ) : (
                      <FileSpreadsheet className="w-5 h-5 text-blue-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{export_.name}</p>
                    <p className="text-sm text-gray-500">{export_.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="bg-white">
                    {export_.format}
                  </Badge>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    {export_.status === "completed" ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <Clock className="w-4 h-4 text-yellow-500" />
                    )}
                    {export_.status}
                  </div>
                  <Button variant="ghost" size="sm">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Info Banner */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900 mb-1">About Data Export</h4>
              <p className="text-sm text-blue-800">
                All exported data is logged for audit purposes. Ensure you have proper authorization before exporting
                sensitive user information. Data exports containing PII (Personally Identifiable Information) should be
                handled according to data protection regulations and stored securely.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Briefcase({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}
