"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bookmark,
  Heart,
  TrendingUp,
  GraduationCap,
  DollarSign,
  Award,
  ExternalLink,
  Trash2,
  Filter,
} from "lucide-react";
import Link from "next/link";
import { CAREERS_DATABASE } from "@/lib/tenant";
import { SCHOLARSHIPS } from "@/lib/scholarship-database";

type SavedItem = {
  id: string;
  type: "career" | "scholarship";
  itemId: string;
  savedAt: string;
};

export default function SavedPage() {
  const [savedCareers, setSavedCareers] = useState<string[]>([]);
  const [savedScholarships, setSavedScholarships] = useState<string[]>([]);
  const [filter, setFilter] = useState<"all" | "career" | "scholarship">("all");

  useEffect(() => {
    loadSavedItems();
  }, []);

  const loadSavedItems = async () => {
    try {
      const response = await fetch("/api/saved-careers");
      if (response.ok) {
        const data = await response.json();
        setSavedCareers(data.savedCareers || []);
      }
    } catch (error) {
      console.error("Failed to load saved items:", error);
    }
  };

  const unsaveItem = async (id: string, type: "career" | "scholarship") => {
    try {
      await fetch("/api/saved-careers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ careerId: id, action: "unsave" }),
      });
      loadSavedItems();
    } catch (error) {
      console.error("Failed to unsave:", error);
    }
  };

  const careerItems = CAREERS_DATABASE.filter((c) => savedCareers.includes(c.id));
  const scholarshipItems = SCHOLARSHIPS.filter((s) => savedScholarships.includes(s.id));

  let filteredItems: Array<{ type: string; item: any; savedAt: string }> = [];

  if (filter === "all" || filter === "career") {
    filteredItems = [
      ...filteredItems,
      ...careerItems.map((c) => ({ type: "career", item: c, savedAt: "" })),
    ];
  }
  if (filter === "all" || filter === "scholarship") {
    filteredItems = [
      ...filteredItems,
      ...scholarshipItems.map((s) => ({ type: "scholarship", item: s, savedAt: "" })),
    ];
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Bookmark className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">
            Saved Items
          </h1>
        </div>
        <p className="text-gray-600">
          Careers and scholarships you've bookmarked for later
        </p>
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <Card className="p-12 text-center">
          <Bookmark className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No saved items yet
          </h3>
          <p className="text-gray-500 mb-6">
            Save careers and scholarships to compare them later
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild>
              <Link href="/dashboard/careers">
                <TrendingUp className="w-4 h-4 mr-2" />
                Browse Careers
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/scholarships">
                <Award className="w-4 h-4 mr-2" />
                Browse Scholarships
              </Link>
            </Button>
          </div>
        </Card>
      )}

      {/* Filter Tabs */}
      {filteredItems.length > 0 && (
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "all"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All ({filteredItems.length})
          </button>
          <button
            onClick={() => setFilter("career")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "career"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Careers ({careerItems.length})
          </button>
          <button
            onClick={() => setFilter("scholarship")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "scholarship"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Scholarships ({scholarshipItems.length})
          </button>
        </div>
      )}

      {/* Saved Items */}
      <div className="grid md:grid-cols-2 gap-6">
        {filteredItems.map(({ type, item }) => (
          <Card key={item.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  {type === "career" ? (
                    <>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">
                        {item.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">{item.salaryRange}</Badge>
                        <Badge variant="outline">RIASEC: {item.riasecCode}</Badge>
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">
                        {item.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-1">{item.provider}</p>
                      <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                      <div className="flex flex-wrap gap-2">
                        <Badge className="bg-green-100 text-green-800">
                          {item.type === "full" ? "Full Scholarship" : "Partial"}
                        </Badge>
                        <Badge variant="outline">{item.amount}</Badge>
                      </div>
                    </>
                  )}
                </div>
                <button
                  onClick={() => unsaveItem(item.id, type)}
                  className="text-gray-400 hover:text-red-500 transition-colors ml-2"
                  title="Remove from saved"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              <div className="flex gap-2">
                {type === "career" ? (
                  <Button size="sm" className="flex-1" asChild>
                    <Link href={`/dashboard/careers/${item.slug}`}>
                      View Details
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                ) : (
                  <Button size="sm" className="flex-1" asChild>
                    <a href={item.link} target="_blank" rel="noopener noreferrer">
                      Apply Now
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Comparison Section */}
      {filteredItems.length >= 2 && (
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
          <CardHeader>
            <CardTitle>Compare Your Options</CardTitle>
            <CardDescription className="text-blue-100">
              You have {filteredItems.length} saved items - compare them side by side
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="secondary" size="lg" asChild>
              <Link href="/dashboard/study-abroad/compare">
                Compare Study Abroad Options
                <TrendingUp className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
