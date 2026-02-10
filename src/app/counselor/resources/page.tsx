/**
 * COUNSELOR - COUNSELING RESOURCES
 *
 * Features:
 * - Career resource library
 * - College application guides
 * - Scholarship information
 * - Mental health resources
 * - Study skills materials
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Search,
  Filter,
  Download,
  ExternalLink,
  GraduationCap,
  Heart,
  Brain,
  FileText,
  Video,
  Link as LinkIcon,
  TrendingUp,
  Award,
  Building2,
  Globe,
  ChevronDown,
  Plus,
  Edit,
  Trash2,
  X as XIcon,
} from "lucide-react";
import Link from "next/link";

// Resource categories
const resourceCategories = [
  { id: "all", name: "All Resources", icon: BookOpen, color: "bg-gray-100 text-gray-600" },
  { id: "career", name: "Career Resources", icon: TrendingUp, color: "bg-purple-100 text-purple-600" },
  { id: "college", name: "College Applications", icon: GraduationCap, color: "bg-blue-100 text-blue-600" },
  { id: "scholarship", name: "Scholarships", icon: Award, color: "bg-green-100 text-green-600" },
  { id: "mental-health", name: "Mental Health", icon: Heart, color: "bg-red-100 text-red-600" },
  { id: "study-skills", name: "Study Skills", icon: Brain, color: "bg-yellow-100 text-yellow-600" },
  { id: "rub", name: "RUB Colleges", icon: Building2, color: "bg-violet-100 text-violet-600" },
  { id: "international", name: "Study Abroad", icon: Globe, color: "bg-cyan-100 text-cyan-600" },
];

// Mock resources
const mockResources = [
  // Career Resources
  {
    id: "RES001",
    title: "Bhutan Career Guide 2024",
    description: "Comprehensive guide to career opportunities in Bhutan including emerging sectors and required qualifications",
    category: "career",
    type: "pdf",
    url: "/resources/bhutan-career-guide-2024.pdf",
    fileSize: "4.2 MB",
    pages: 48,
    tags: ["career", "bhutan", "guide", "emerging-sectors"],
    isFeatured: true,
    downloads: 1247,
    addedDate: "2024-01-15",
  },
  {
    id: "RES002",
    title: "Resume Writing Workshop",
    description: "Step-by-step guide to creating effective resumes for Bhutanese job market",
    category: "career",
    type: "video",
    url: "https://youtube.com/watch?v=example",
    duration: "25 min",
    tags: ["resume", "workshop", "job-search"],
    isFeatured: false,
    views: 856,
    addedDate: "2024-02-01",
  },
  {
    id: "RES003",
    title: "Interview Preparation Checklist",
    description: "Essential tips and common questions for job interviews in Bhutan",
    category: "career",
    type: "document",
    url: "/resources/interview-checklist.pdf",
    fileSize: "1.1 MB",
    pages: 8,
    tags: ["interview", "checklist", "job-search"],
    isFeatured: false,
    downloads: 634,
    addedDate: "2024-01-28",
  },

  // College Applications
  {
    id: "RES004",
    title: "RUB Application Guide 2024",
    description: "Complete guide to applying to Royal University of Bhutan colleges and programs",
    category: "college",
    type: "pdf",
    url: "/resources/rub-application-guide.pdf",
    fileSize: "3.8 MB",
    pages: 36,
    tags: ["RUB", "application", "college", "undergraduate"],
    isFeatured: true,
    downloads: 2341,
    addedDate: "2024-01-10",
  },
  {
    id: "RES005",
    title: "Personal Statement Writing Guide",
    description: "How to write compelling personal statements for college applications",
    category: "college",
    type: "document",
    url: "/resources/personal-statement-guide.pdf",
    fileSize: "2.4 MB",
    pages: 24,
    tags: ["personal-statement", "essay", "application"],
    isFeatured: false,
    downloads: 1123,
    addedDate: "2024-02-05",
  },
  {
    id: "RES006",
    title: "College Selection Framework",
    description: "Framework for helping students choose the right college and program",
    category: "college",
    type: "pdf",
    url: "/resources/college-selection.pdf",
    fileSize: "1.9 MB",
    pages: 16,
    tags: ["college-selection", "decision-making", "framework"],
    isFeatured: true,
    downloads: 892,
    addedDate: "2024-01-22",
  },

  // Scholarships
  {
    id: "RES007",
    title: "Scholarship Database 2024",
    description: "Comprehensive list of scholarships available for Bhutanese students",
    category: "scholarship",
    type: "spreadsheet",
    url: "/resources/scholarship-database.xlsx",
    fileSize: "856 KB",
    tags: ["scholarship", "database", "financial-aid"],
    isFeatured: true,
    downloads: 3456,
    addedDate: "2024-01-05",
  },
  {
    id: "RES008",
    title: "Scholarship Essay Tips",
    description: "Guide to writing winning scholarship essays",
    category: "scholarship",
    type: "document",
    url: "/resources/scholarship-essay-tips.pdf",
    fileSize: "1.5 MB",
    pages: 12,
    tags: ["scholarship", "essay", "writing"],
    isFeatured: false,
    downloads: 743,
    addedDate: "2024-02-03",
  },

  // Mental Health
  {
    id: "RES009",
    title: "Student Mental Health Resources",
    description: "Directory of mental health support services for students in Bhutan",
    category: "mental-health",
    type: "pdf",
    url: "/resources/mental-health-resources.pdf",
    fileSize: "2.1 MB",
    pages: 20,
    tags: ["mental-health", "support", "counseling"],
    isFeatured: true,
    downloads: 1567,
    addedDate: "2024-01-18",
  },
  {
    id: "RES010",
    title: "Stress Management Techniques",
    description: "Practical stress management strategies for students during exams",
    category: "mental-health",
    type: "video",
    url: "https://youtube.com/watch?v=example2",
    duration: "18 min",
    tags: ["stress", "wellness", "exams"],
    isFeatured: false,
    views: 1234,
    addedDate: "2024-01-30",
  },
  {
    id: "RES011",
    title: "Mindfulness for Students",
    description: "Introduction to mindfulness practices for academic success",
    category: "mental-health",
    type: "document",
    url: "/resources/mindfulness-guide.pdf",
    fileSize: "1.8 MB",
    pages: 14,
    tags: ["mindfulness", "wellness", "academic"],
    isFeatured: false,
    downloads: 567,
    addedDate: "2024-02-07",
  },

  // Study Skills
  {
    id: "RES012",
    title: "Effective Study Strategies",
    description: "Evidence-based study techniques for improved learning and retention",
    category: "study-skills",
    type: "pdf",
    url: "/resources/study-strategies.pdf",
    fileSize: "3.2 MB",
    pages: 32,
    tags: ["study-skills", "learning", "techniques"],
    isFeatured: true,
    downloads: 2134,
    addedDate: "2024-01-12",
  },
  {
    id: "RES013",
    title: "Time Management for Students",
    description: "Practical time management tools and strategies for busy students",
    category: "study-skills",
    type: "document",
    url: "/resources/time-management.pdf",
    fileSize: "1.4 MB",
    pages: 18,
    tags: ["time-management", "productivity", "planning"],
    isFeatured: false,
    downloads: 1789,
    addedDate: "2024-01-25",
  },
  {
    id: "RES014",
    title: "Note-Taking Methods",
    description: "Comparison of different note-taking methods with examples",
    category: "study-skills",
    type: "pdf",
    url: "/resources/note-taking-methods.pdf",
    fileSize: "2.6 MB",
    pages: 22,
    tags: ["note-taking", "study-skills", "methods"],
    isFeatured: false,
    downloads: 1456,
    addedDate: "2024-02-02",
  },

  // RUB Colleges
  {
    id: "RES015",
    title: "RUB Program Catalog 2024",
    description: "Complete list of all programs offered by RUB constituent colleges",
    category: "rub",
    type: "pdf",
    url: "/resources/rub-program-catalog.pdf",
    fileSize: "5.4 MB",
    pages: 124,
    tags: ["RUB", "programs", "catalog"],
    isFeatured: true,
    downloads: 4521,
    addedDate: "2024-01-08",
  },
  {
    id: "RES016",
    title: "College of Science and Technology Overview",
    description: "Detailed overview of CST programs, facilities, and admission requirements",
    category: "rub",
    type: "document",
    url: "/resources/cst-overview.pdf",
    fileSize: "2.8 MB",
    pages: 28,
    tags: ["CST", "engineering", "technology"],
    isFeatured: false,
    downloads: 876,
    addedDate: "2024-01-20",
  },

  // International
  {
    id: "RES017",
    title: "Study Abroad Guide",
    description: "Guide for Bhutanese students considering international education",
    category: "international",
    type: "pdf",
    url: "/resources/study-abroad-guide.pdf",
    fileSize: "4.6 MB",
    pages: 56,
    tags: ["study-abroad", "international", "guide"],
    isFeatured: true,
    downloads: 1987,
    addedDate: "2024-01-14",
  },
  {
    id: "RES018",
    title: "IELTS Preparation Tips",
    description: "Tips and resources for IELTS exam preparation",
    category: "international",
    type: "document",
    url: "/resources/ielts-preparation.pdf",
    fileSize: "2.2 MB",
    pages: 26,
    tags: ["IELTS", "english", "exam-prep"],
    isFeatured: false,
    downloads: 2341,
    addedDate: "2024-01-16",
  },
];

const typeOptions = ["All", "PDF", "Video", "Document", "Spreadsheet", "Link"];

export default function CounselorResourcesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedType, setSelectedType] = useState("All");
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"recent" | "popular" | "name">("recent");

  // Filter resources
  const filteredResources = mockResources.filter((resource) => {
    const matchesSearch =
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === "all" || resource.category === selectedCategory;
    const matchesType = selectedType === "All" || resource.type.toLowerCase() === selectedType.toLowerCase();
    const matchesFeatured = !showFeaturedOnly || resource.isFeatured;

    return matchesSearch && matchesCategory && matchesType && matchesFeatured;
  });

  // Sort resources
  const sortedResources = [...filteredResources].sort((a, b) => {
    if (sortBy === "recent") {
      return new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime();
    } else if (sortBy === "popular") {
      return (b.downloads || b.views || 0) - (a.downloads || a.views || 0);
    } else {
      return a.title.localeCompare(b.title);
    }
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return <FileText className="w-4 h-4 text-red-500" />;
      case "video":
        return <Video className="w-4 h-4 text-purple-500" />;
      case "spreadsheet":
        return <FileText className="w-4 h-4 text-green-500" />;
      case "link":
        return <LinkIcon className="w-4 h-4 text-blue-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const getCategoryBadge = (category: string) => {
    const categoryData = resourceCategories.find((c) => c.id === category);
    return categoryData?.color || "bg-gray-100 text-gray-600";
  };

  // Stats
  const totalResources = mockResources.length;
  const totalDownloads = mockResources.reduce((sum, r) => sum + (r.downloads || 0), 0);
  const featuredCount = mockResources.filter((r) => r.isFeatured).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Counseling Resources</h1>
          <p className="text-gray-600 mt-1">
            Library of career, college, and wellness resources
          </p>
        </div>
        <Button
          className="gap-2"
          style={{ background: 'linear-gradient(135deg, rgb(168 85 247), rgb(147 51 234))' }}
        >
          <Plus className="w-4 h-4" />
          Add Resource
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgb(168 85 247 / 0.2), rgb(147 51 234 / 0.2))' }}>
                <BookOpen className="w-6 h-6" style={{ color: 'rgb(147 51 234)' }} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalResources}</p>
                <p className="text-sm text-gray-500">Total Resources</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Download className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalDownloads.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Total Downloads</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{featuredCount}</p>
                <p className="text-sm text-gray-500">Featured</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{resourceCategories.length - 1}</p>
                <p className="text-sm text-gray-500">Categories</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        {resourceCategories.map((category) => {
          const Icon = category.icon;
          const isSelected = selectedCategory === category.id;
          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all min-h-[44px] ${
                isSelected
                  ? "border-purple-500 bg-purple-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <Icon className={`w-4 h-4 ${isSelected ? "text-purple-600" : "text-gray-400"}`} />
              <span className={`text-sm font-medium ${isSelected ? "text-purple-700" : "text-gray-600"}`}>
                {category.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search resources..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              {typeOptions.map((type) => (
                <option key={type} value={type.toLowerCase()}>
                  {type === "All" ? "All Types" : type}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "recent" | "popular" | "name")}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="recent">Sort: Recent</option>
              <option value="popular">Sort: Popular</option>
              <option value="name">Sort: Name</option>
            </select>

            <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg bg-white cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={showFeaturedOnly}
                onChange={(e) => setShowFeaturedOnly(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm">Featured Only</span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Featured Resources */}
      {selectedCategory === "all" && !showFeaturedOnly && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Featured Resources</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {mockResources.filter((r) => r.isFeatured).slice(0, 3).map((resource) => (
              <Card key={resource.id} className="border-purple-200" style={{ background: 'linear-gradient(to bottom, rgb(168 85 247 / 0.05), white)' }}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(resource.type)}
                      <Badge className={getCategoryBadge(resource.category)} variant="outline">
                        {resourceCategories.find((c) => c.id === resource.category)?.name}
                      </Badge>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200" variant="outline">
                      <Award className="w-3 h-3 mr-1" />
                      Featured
                    </Badge>
                  </div>
                  <CardTitle className="text-base">{resource.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">{resource.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {resource.downloads ? `${resource.downloads} downloads` : `${resource.views} views`}
                    </span>
                    <Button size="sm" style={{ background: 'linear-gradient(135deg, rgb(168 85 247), rgb(147 51 234))' }}>
                      <Download className="w-4 h-4 mr-1" />
                      Access
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Resources Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {sortedResources.length} {sortedResources.length === 1 ? "Resource" : "Resources"}
            {selectedCategory !== "all" && ` in ${resourceCategories.find((c) => c.id === selectedCategory)?.name}`}
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedResources.map((resource) => (
            <Card key={resource.id} className="hover:shadow-md transition-shadow group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(resource.type)}
                    <Badge className={getCategoryBadge(resource.category)} variant="outline">
                      {resourceCategories.find((c) => c.id === resource.category)?.name}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon-xs" className="h-7 w-7">
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="icon-xs" className="h-7 w-7">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <CardTitle className="text-base line-clamp-2">{resource.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{resource.description}</p>

                {/* Metadata */}
                <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
                  {resource.fileSize && (
                    <span>{resource.fileSize}</span>
                  )}
                  {resource.pages && (
                    <span>{resource.pages} pages</span>
                  )}
                  {resource.duration && (
                    <span>{resource.duration}</span>
                  )}
                  {resource.downloads && (
                    <span>{resource.downloads} downloads</span>
                  )}
                  {resource.views && (
                    <span>{resource.views} views</span>
                  )}
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {resource.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} className="bg-gray-100 text-gray-600 border-gray-200 text-xs" variant="outline">
                      {tag}
                    </Badge>
                  ))}
                  {resource.tags.length > 3 && (
                    <span className="text-xs text-gray-400">+{resource.tags.length - 3}</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    asChild
                  >
                    <Link href={resource.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Open
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    style={{ background: 'linear-gradient(135deg, rgb(168 85 247), rgb(147 51 234))' }}
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Save
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {sortedResources.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No resources found</h3>
            <p className="text-gray-500 mb-4">Try adjusting your filters or search query</p>
            <Button variant="outline" onClick={() => {
              setSearchQuery("");
              setSelectedCategory("all");
              setSelectedType("All");
              setShowFeaturedOnly(false);
            }}>
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Add Resource Card */}
      <Card className="border-dashed border-2">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                <Plus className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Add New Resource</h3>
                <p className="text-sm text-gray-500">Upload PDFs, videos, or add links to resources</p>
              </div>
            </div>
            <Button style={{ background: 'linear-gradient(135deg, rgb(168 85 247), rgb(147 51 234))' }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Resource
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
