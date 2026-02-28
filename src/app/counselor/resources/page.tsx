"use client";

import { logger } from "@/lib/logger";
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


import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Search,
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
  Plus,
  Edit,
  Trash2,
  Loader2,
  Briefcase,
  Users,
  Share2,
} from "lucide-react";
import Link from "next/link";
import { AddResourceModal } from "@/components/counselor/add-resource-modal";
import { EditResourceModal } from "@/components/counselor/edit-resource-modal";
import { ShareResourceModal } from "@/components/counselor/share-resource-modal";

interface ResourceData {
  id: string;
  title: string;
  description: string;
  category: string;
  type: string;
  url: string;
  file: string;
  thumbnail: string;
  downloadCount: number;
  createdAt: Date;
  addedDate: Date;
  tags: string[];
  isFeatured: boolean;
  downloads?: number;
  views?: number;
  fileSize?: string;
  pages?: number;
  duration?: string;
}

interface ResourceCategory {
  id: string;
  name: string;
  icon: string;
  count: number;
  color: string;
}

interface ResourceStats {
  total: number;
  byCategory: Record<string, number>;
}

// Valid icon names for categories
type CategoryIconName = "career" | "college" | "scholarship" | "mental" | "study" | "tools" | "video";

// Helper function to get icon for category
function getCategoryIcon(iconName: string): React.ComponentType<{ className?: string }> {
  const icons: Record<CategoryIconName, React.ComponentType<{ className?: string }>> = {
    "career": GraduationCap,
    "college": Briefcase,
    "scholarship": Heart,
    "mental": Brain,
    "study": BookOpen,
    "tools": FileText,
    "video": Video,
  };
  return icons[iconName as CategoryIconName] || Users;
}

export default function CounselorResourcesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<ResourceData | null>(null);
  const [sharingResource, setSharingResource] = useState<{ id: string; title: string } | null>(null);

  // Data state
  const [resources, setResources] = useState<ResourceData[]>([]);
  const [categories, setCategories] = useState<ResourceCategory[]>([]);
  const [stats, setStats] = useState<{
    totalResources: number;
    totalDownloads: number;
    featuredCount: number;
    categoriesCount: number;
  }>({
    totalResources: 0,
    totalDownloads: 0,
    featuredCount: 0,
    categoriesCount: 0,
  });

  // Fetch data callback
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/counselor/resources");
      if (!response.ok) throw new Error("Failed to fetch resources");

      const data = await response.json();

      setResources(data.resources || []);
      setCategories(data.categories || []);
      setStats(data.stats || { totalResources: 0, totalDownloads: 0, featuredCount: 0, categoriesCount: 0 });
    } catch (err) {
      logger.error("Error fetching resources data:", err);
      setError("Failed to load resources. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedType, setSelectedType] = useState("All");
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"recent" | "popular" | "name">("recent");

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch from API
        const response = await fetch("/api/counselor/resources");
        if (!response.ok) throw new Error("Failed to fetch resources");

        const data = await response.json();

        setResources(data.resources || []);
        setCategories(data.categories || []);
        setStats(data.stats || { totalResources: 0, totalDownloads: 0, featuredCount: 0, categoriesCount: 0 });
      } catch (err) {
        logger.error("Error fetching resources data:", err);
        setError("Failed to load resources. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter resources
  const filteredResources = resources.filter((resource) => {
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
    const categoryData = categories.find((c) => c.id === category);
    return categoryData?.color || "bg-gray-100 text-gray-600";
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedType("All");
    setShowFeaturedOnly(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading resources...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Resources</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

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
          onClick={() => setIsAddModalOpen(true)}
          style={{ background: "linear-gradient(135deg, rgb(168 85 247), rgb(147 51 234))" }}
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
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, rgb(168 85 247 / 0.2), rgb(147 51 234 / 0.2))" }}
              >
                <BookOpen className="w-6 h-6" style={{ color: "rgb(147 51 234)" }} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalResources}</p>
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
                <p className="text-2xl font-bold text-gray-900">{stats.totalDownloads.toLocaleString()}</p>
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
                <p className="text-2xl font-bold text-gray-900">{stats.featuredCount}</p>
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
                <p className="text-2xl font-bold text-gray-900">{stats.categoriesCount}</p>
                <p className="text-sm text-gray-500">Categories</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => {
          const IconComponent = getCategoryIcon(category.icon);
          const isSelected = selectedCategory === category.id;
          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all min-h-[44px] ${
                isSelected ? "border-purple-500 bg-purple-50" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <IconComponent className={`w-4 h-4 ${isSelected ? "text-purple-600" : "text-gray-400"}`} />
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
              {["All", "PDF", "Video", "Document", "Spreadsheet", "Link"].map((type) => (
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
      {selectedCategory === "all" && !showFeaturedOnly && resources.filter((r) => r.isFeatured).length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Featured Resources</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {resources.filter((r) => r.isFeatured).slice(0, 3).map((resource) => (
              <Card key={resource.id} className="border-purple-200" style={{ background: "linear-gradient(to bottom, rgb(168 85 247 / 0.05), white)" }}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(resource.type)}
                      <Badge className={getCategoryBadge(resource.category)} variant="outline">
                        {categories.find((c) => c.id === resource.category)?.name}
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
                    <Button size="sm" style={{ background: "linear-gradient(135deg, rgb(168 85 247), rgb(147 51 234))" }}>
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
            {selectedCategory !== "all" && ` in ${categories.find((c) => c.id === selectedCategory)?.name}`}
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
                      {categories.find((c) => c.id === resource.category)?.name}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7"
                      onClick={() => setEditingResource(resource)}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7"
                      onClick={() => setSharingResource({ id: resource.id, title: resource.title })}
                    >
                      <Share2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <CardTitle className="text-base line-clamp-2">{resource.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{resource.description}</p>

                {/* Metadata */}
                <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
                  {resource.fileSize && <span>{resource.fileSize}</span>}
                  {resource.pages && <span>{resource.pages} pages</span>}
                  {resource.duration && <span>{resource.duration}</span>}
                  {resource.downloads && <span>{resource.downloads} downloads</span>}
                  {resource.views && <span>{resource.views} views</span>}
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
                    variant="outline"
                    className="flex-1"
                    onClick={() => setSharingResource({ id: resource.id, title: resource.title })}
                  >
                    <Share2 className="w-3 h-3 mr-1" />
                    Share
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
            <Button variant="outline" onClick={handleClearFilters}>
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
            <Button
              style={{ background: "linear-gradient(135deg, rgb(168 85 247), rgb(147 51 234))" }}
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Resource
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <AddResourceModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchData}
      />

      {editingResource && (
        <EditResourceModal
          open={!!editingResource}
          onClose={() => setEditingResource(null)}
          onSuccess={fetchData}
          resource={{
            id: editingResource.id,
            title: editingResource.title,
            description: editingResource.description,
            resourceType: editingResource.type,
            format: editingResource.type,
            category: editingResource.category,
            tags: editingResource.tags,
            accessUrl: editingResource.url,
            thumbnailUrl: editingResource.thumbnail,
            isFeatured: editingResource.isFeatured,
          }}
        />
      )}

      {sharingResource && (
        <ShareResourceModal
          open={!!sharingResource}
          onClose={() => setSharingResource(null)}
          resourceId={sharingResource.id}
          resourceTitle={sharingResource.title}
        />
      )}
    </div>
  );
}
