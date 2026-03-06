"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Award,
  BookOpen,
  Code2,
  Palette,
  Briefcase,
  Heart,
  Plus,
  Star,
  Trash2,
  Download,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Video,
  Trophy,
} from "lucide-react";

const CATEGORY_ICONS = {
  academic: BookOpen,
  soft: Heart,
  technical: Code2,
  creative: Palette,
  service: Briefcase,
  vocational: Trophy,
};

const EVIDENCE_TYPES = {
  project: { icon: Code2, label: "Project" },
  certificate: { icon: Award, label: "Certificate" },
  competition: { icon: Trophy, label: "Competition" },
  homework: { icon: FileText, label: "Homework" },
  presentation: { icon: Video, label: "Presentation" },
  internship: { icon: Briefcase, label: "Internship" },
  volunteer: { icon: Heart, label: "Volunteer" },
};

const PROFICIENCY_COLORS = {
  beginner: "bg-gray-100 text-gray-700 border-gray-300",
  intermediate: "bg-blue-100 text-blue-700 border-blue-300",
  advanced: "bg-purple-100 text-purple-700 border-purple-300",
  expert: "bg-green-100 text-green-700 border-green-300",
};

interface SkillEvidence {
  id: string;
  skillId: string;
  skillName: string;
  skillCategory: string;
  evidenceType: string;
  title: string;
  description?: string;
  fileUrl?: string;
  completedDate?: string;
  proficiencyLevel?: string;
  status: "pending" | "approved" | "rejected";
  isFeatured: boolean;
}

export default function PortfolioPage() {
  const [evidence, setEvidence] = useState<SkillEvidence[]>([]);
  const [filteredEvidence, setFilteredEvidence] = useState<SkillEvidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    byCategory: {} as Record<string, number>,
  });

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const fetchPortfolio = async () => {
    try {
      const [statsRes, evidenceRes] = await Promise.all([
        fetch("/api/student/portfolio?action=stats"),
        fetch("/api/student/portfolio?action=all"),
      ]);

      const statsData = await statsRes.json();
      const evidenceData = await evidenceRes.json();

      if (statsData.success) {
        setStats(statsData.result);
      }

      if (evidenceData.success) {
        setEvidence(evidenceData.result.all);
        setFilteredEvidence(evidenceData.result.all);
      }
    } catch (error) {
      console.error("Failed to fetch portfolio:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFeatured = async (id: string) => {
    const res = await fetch("/api/student/portfolio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle-featured", evidenceId: id }),
    });

    if (res.ok) {
      setEvidence(evidence.map((e) =>
        e.id === id ? { ...e, isFeatured: !e.isFeatured } : e
      ));
    }
  };

  const deleteEvidence = async (id: string) => {
    if (!confirm("Are you sure you want to delete this evidence?")) return;

    const res = await fetch(`/api/student/portfolio?id=${id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      setEvidence(evidence.filter((e) => e.id !== id));
      setFilteredEvidence(filteredEvidence.filter((e) => e.id !== id));
    }
  };

  const exportPortfolio = async () => {
    const res = await fetch("/api/student/portfolio?action=for-export");
    const data = await res.json();

    if (data.success) {
      // Create a simple text export
      const text = `
PORTFOLIO - ${data.result.student.firstName} ${data.result.student.lastName}
Exported: ${data.result.exportDate}

${data.result.evidence.map((e: SkillEvidence) => `
${e.title}
Skill: ${e.skillName} (${e.skillCategory})
Type: ${e.evidenceType}
Proficiency: ${e.proficiencyLevel || "N/A"}
${e.description ? `Description: ${e.description}` : ""}
${e.completedDate ? `Date: ${new Date(e.completedDate).toLocaleDateString()}` : ""}
`).join("\n---\n")}
      `.trim();

      const blob = new Blob([text], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "portfolio.txt";
      a.click();
    }
  };

  const filterByCategory = (category: string) => {
    setActiveTab(category);
    if (category === "all") {
      setFilteredEvidence(evidence);
    } else if (category === "featured") {
      setFilteredEvidence(evidence.filter((e) => e.isFeatured));
    } else {
      setFilteredEvidence(evidence.filter((e) => e.skillCategory === category));
    }
  };

  const EvidenceCard = ({ item }: { item: SkillEvidence }) => {
    const TypeIcon = EVIDENCE_TYPES[item.evidenceType as keyof typeof EVIDENCE_TYPES]?.icon || FileText;
    const CategoryIcon = CATEGORY_ICONS[item.skillCategory as keyof typeof CATEGORY_ICONS] || BookOpen;

    return (
      <Card className={`hover:shadow-md transition-all ${item.isFeatured ? "border-yellow-400 bg-yellow-50/30" : ""}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <TypeIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-base">{item.title}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <CategoryIcon className="w-3 h-3" />
                  {item.skillName}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {item.isFeatured && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
              <Badge
                variant={item.status === "approved" ? "default" : item.status === "rejected" ? "destructive" : "secondary"}
                className="text-xs"
              >
                {item.status}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {item.description && (
            <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
          )}

          <div className="flex flex-wrap gap-2">
            {item.proficiencyLevel && (
              <Badge
                variant="outline"
                className={PROFICIENCY_COLORS[item.proficiencyLevel as keyof typeof PROFICIENCY_COLORS]}
              >
                {item.proficiencyLevel}
              </Badge>
            )}
            <Badge variant="outline" className="capitalize">
              {item.evidenceType}
            </Badge>
            {item.completedDate && (
              <Badge variant="outline" className="text-xs">
                {new Date(item.completedDate).toLocaleDateString()}
              </Badge>
            )}
          </div>

          {item.fileUrl && (
            <Button size="sm" variant="outline" className="w-full" asChild>
              <a href={item.fileUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3 h-3 mr-2" />
                View Evidence
              </a>
            </Button>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              variant="ghost"
              className="flex-1"
              onClick={() => toggleFeatured(item.id)}
            >
              <Star className={`w-3 h-3 mr-1 ${item.isFeatured ? "fill-yellow-500 text-yellow-500" : ""}`} />
              {item.isFeatured ? "Unfeature" : "Feature"}
            </Button>
            {item.status === "pending" && (
              <Button
                size="sm"
                variant="ghost"
                className="text-red-500 hover:text-red-600"
                onClick={() => deleteEvidence(item.id)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Loading your portfolio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Portfolio</h1>
          <p className="text-gray-600 mt-1">Showcase your skills and achievements</p>
        </div>
        <Button onClick={exportPortfolio}>
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Items</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{stats.approved}</div>
              <div className="text-sm text-gray-600">Approved</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-600">{stats.pending}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {evidence.filter((e) => e.isFeatured).length}
              </div>
              <div className="text-sm text-gray-600">Featured</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={filterByCategory}>
        <TabsList className="grid w-full md:grid-cols-8">
          <TabsTrigger value="all">All ({evidence.length})</TabsTrigger>
          <TabsTrigger value="featured">
            <Star className="w-3 h-3 mr-1" /> Featured
          </TabsTrigger>
          <TabsTrigger value="academic">Academic</TabsTrigger>
          <TabsTrigger value="soft">Soft Skills</TabsTrigger>
          <TabsTrigger value="technical">Technical</TabsTrigger>
          <TabsTrigger value="creative">Creative</TabsTrigger>
          <TabsTrigger value="service">Service</TabsTrigger>
          <TabsTrigger value="vocational">Vocational</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredEvidence.length === 0 ? (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No evidence yet</h3>
                <p className="text-gray-600 mb-6">
                  Start building your portfolio by adding your skills and achievements
                </p>
                <Button asChild>
                  <a href="/student/skills">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Evidence
                  </a>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {filteredEvidence.map((item) => (
                <EvidenceCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Info Card */}
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            Why Build a Portfolio?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-blue-100">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-white rounded-full mt-2 flex-shrink-0" />
              <span>Strengthen your RUB and scholarship applications with verified evidence</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-white rounded-full mt-2 flex-shrink-0" />
              <span>Showcase your unique skills beyond just grades</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-white rounded-full mt-2 flex-shrink-0" />
              <span>Track your growth and achievements over time</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-white rounded-full mt-2 flex-shrink-0" />
              <span>Share with counselors, teachers, and potential employers</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
