"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  GraduationCap,
  Globe,
  DollarSign,
  Calendar,
  ExternalLink,
  Award,
  Filter,
  Info,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SCHOLARSHIPS } from "@/lib/scholarship-database";

export default function ScholarshipsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedCountry, setSelectedCountry] = useState<string>("all");
  const [selectedScholarship, setSelectedScholarship] = useState<typeof SCHOLARSHIPS[0] | null>(null);

  // Check if link is valid (not # or internal URL)
  const isValidLink = (link: string) => {
    return link && link !== "#" && !link.startsWith("/dashboard");
  };

  const getApplicationSteps = (scholarship: typeof SCHOLARSHIPS[0]) => {
    return [
      "Check the official scholarship website for the latest application dates",
      `Ensure you meet the eligibility: ${scholarship.eligibility}`,
      "Prepare required documents: academic transcripts, certificates, ID proof",
      "Write a strong personal statement explaining why you deserve this scholarship",
      "Get recommendation letters from teachers or employers",
      `Submit before deadline: ${scholarship.deadline}`,
      scholarship.provider.includes("Australia")
        ? "Apply through Australia Awards Bhutan portal"
      : scholarship.provider.includes("Government")
        ? "Apply through the official government scholarship portal"
        : "Apply directly through the scholarship website",
    ];
  };

  const filteredScholarships = SCHOLARSHIPS.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.field.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "all" || s.type === selectedType;
    const matchesCountry = selectedCountry === "all" || s.country === selectedCountry;
    return matchesSearch && matchesType && matchesCountry;
  });

  const getTypeColor = (type: string) => {
    return type === "full" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800";
  };

  const getTypeLabel = (type: string) => {
    return type === "full" ? "Full Scholarship" : "Partial Scholarship";
  };

  const getFlag = (country: string) => {
    const flags: Record<string, string> = {
      bhutan: "🇧🇹",
      australia: "🇦🇺",
      "new-zealand": "🇳🇿",
      usa: "🇺🇸",
      uk: "🇬🇧",
      germany: "🇩🇪",
      singapore: "🇸🇬",
      europe: "🇪🇺",
      various: "🌍",
    };
    return flags[country] || "🌍";
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Award className="w-8 h-8 text-yellow-600" />
          <h1 className="text-3xl font-bold text-gray-900">
            Scholarship Finder
          </h1>
        </div>
        <p className="text-gray-600">
          Discover funding opportunities for your education abroad
        </p>
      </div>

      {/* Info Banner */}
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
        <CardHeader>
          <CardTitle className="text-xl">
            💡 Scholarship Application Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-blue-100">
            <li className="flex items-start gap-2">
              <span className="font-bold">•</span>
              <span>Start preparing at least 1 year before application deadlines</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">•</span>
              <span>Focus on academic excellence - most scholarships require 75%+ aggregate</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">•</span>
              <span>Build leadership and community service experience</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">•</span>
              <span>Prepare for IELTS/TOEFL - aim for 6.5+ IELTS or equivalent</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search scholarships..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium">Type:</span>
                <button
                  onClick={() => setSelectedType("all")}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    selectedType === "all" ? "bg-blue-500 text-white" : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setSelectedType("full")}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    selectedType === "full" ? "bg-blue-500 text-white" : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  Full
                </button>
                <button
                  onClick={() => setSelectedType("partial")}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    selectedType === "partial" ? "bg-blue-500 text-white" : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  Partial
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Scholarships
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{SCHOLARSHIPS.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">
              Full Scholarships
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {SCHOLARSHIPS.filter((s) => s.type === "full").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">$20M+</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">
              Destination Countries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">8+</div>
          </CardContent>
        </Card>
      </div>

      {/* Scholarships List */}
      <div className="space-y-4">
        {filteredScholarships.map((scholarship) => (
          <Card key={scholarship.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{scholarship.name}</h3>
                    <Badge className={getTypeColor(scholarship.type)}>
                      {getTypeLabel(scholarship.type)}
                    </Badge>
                    <Badge variant="outline" className="text-sm">
                      {getFlag(scholarship.country)} {scholarship.country.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-gray-700 mb-2">{scholarship.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <GraduationCap className="w-4 h-4" />
                      {scholarship.provider}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      {scholarship.amount}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Deadline: {scholarship.deadline}
                    </span>
                  </div>
                </div>
              </div>

              {/* Requirements */}
              <div className="grid md:grid-cols-2 gap-6 mt-4 pt-4 border-t">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Eligibility:</h4>
                  <p className="text-sm text-gray-600">{scholarship.eligibility}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Field of Study:</h4>
                  <Badge variant="secondary">{scholarship.field}</Badge>
                </div>
              </div>

              {/* Requirements List */}
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Requirements:</h4>
                <ul className="space-y-1">
                  {scholarship.requirements.map((req, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-4 pt-4 border-t">
                {isValidLink(scholarship.link) ? (
                  <Button size="sm" asChild>
                    <a
                      href={scholarship.link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Apply Now
                    </a>
                  </Button>
                ) : (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        onClick={() => setSelectedScholarship(scholarship)}
                      >
                        <Info className="w-4 h-4 mr-2" />
                        Application Info
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Application Instructions</DialogTitle>
                        <DialogDescription>
                          How to apply for {scholarship.name}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-sm mb-2">Official Source:</h4>
                          <p className="text-sm text-gray-600">{scholarship.provider}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm mb-2">Deadline:</h4>
                          <p className="text-sm text-gray-600">{scholarship.deadline}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm mb-2">Eligibility:</h4>
                          <p className="text-sm text-gray-600">{scholarship.eligibility}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm mb-2">Required Documents:</h4>
                          <ul className="text-sm text-gray-600 space-y-1">
                            <li>• Academic transcripts and certificates</li>
                            <li>• Citizenship ID (Bhutanese)</li>
                            <li>• Recommendation letters (2-3)</li>
                            <li>• Personal statement/essay</li>
                            <li>• English proficiency test (IELTS/TOEFL)</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm mb-2">How to Apply:</h4>
                          <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                            {getApplicationSteps(scholarship).map((step, i) => (
                              <li key={i}>{step}</li>
                            ))}
                          </ol>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <p className="text-sm text-blue-800">
                            <strong>Important:</strong> Always verify the latest application
                            details on the official {scholarship.provider} website.
                            Deadlines and requirements may change.
                          </p>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
                <Button size="sm" variant="outline" asChild>
                  <a
                    href="/dashboard/study-abroad"
                  >
                    <Globe className="w-4 h-4 mr-2" />
                    Country Info
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Related Links */}
      <Card className="bg-gradient-to-r from-green-600 to-teal-600 text-white border-0">
        <CardHeader>
          <CardTitle>Additional Resources</CardTitle>
          <CardDescription className="text-green-100">
            Official scholarship portals and databases
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-white/10 rounded-lg">
              <p className="font-semibold mb-1">Scholarships.gov.bt</p>
              <p className="text-sm text-green-100">Official Bhutan scholarship portal</p>
            </div>
            <div className="p-4 bg-white/10 rounded-lg">
              <p className="font-semibold mb-1">StudyinAustralia.gov.bt</p>
              <p className="text-sm text-green-100">Australia Awards in Bhutan</p>
            </div>
            <div className="p-4 bg-white/10 rounded-lg">
              <p className="font-semibold mb-1">RCSC Portal</p>
              <p className="text-sm text-green-100">Royal Civil Service Commission</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
