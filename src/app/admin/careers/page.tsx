"use client";

import { logger } from "@/lib/logger";
/**
 * PLATFORM ADMIN - CAREERS CONTENT MANAGEMENT
 *
 * Multi-tenant career database management page for platform administrators.
 * CRUD operations for career profiles, salary data, and demand outlook.
 */


import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Briefcase,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  TrendingUp,
  TrendingDown,
  Minus,
  GraduationCap,
  DollarSign,
  MapPin,
  Award,
  BookOpen,
  CheckCircle,
  XCircle,
  Sparkles,
  MoreVertical,
  ChevronDown,
  ArrowUpDown,
  Download,
  Upload,
} from "lucide-react";

type CareerData = {
  id: string;
  name: string;
  slug: string;
  title?: string;
  description?: string | null;
  riasecCode?: string | null;
  hollandCodes?: Record<string, number> | null;
  skills?: string[] | null;
  educationLevel?: string[] | null;
  subjects?: string[] | null;
  workEnvironment?: string | null;
  typicalSalary?: string | null;
  bhutanDemand?: string | null;
  bhutanSpecific?: boolean;
  isActive?: boolean;
  // Computed/alias fields for UI
  demandOutlook?: string;
  educationPath?: string[];
  salaryRange?: string;
};

// Type for raw API response from getCareers()
type RawCareerData = {
  id: string;
  name: string;
  slug: string;
  title?: string;
  description?: string | null;
  riasecCode?: string | null;
  hollandCodes?: Record<string, number> | string[] | null;
  skills?: string[] | null;
  educationLevel?: string[] | string | null;
  subjects?: string[] | string[][] | null;
  workEnvironment?: string | null;
  typicalSalary?: string | null;
  bhutanDemand?: string | null;
  bhutanSpecific?: boolean;
  isActive?: boolean;
  category?: string;
  industry?: string;
  demandOutlook?: string;
  salaryRange?: string;
  educationPath?: string[];
};
import Link from "next/link";
import {
  getCareers,
  createCareer,
  updateCareer,
  deleteCareer,
} from "@/app/admin/careers/actions";
import { AddCareerModal } from "@/components/admin/add-career-modal";
import { EditCareerModal } from "@/components/admin/edit-career-modal";

// Demand level icons and colors
const demandConfig = {
  high: { icon: TrendingUp, color: "text-green-600", bgColor: "bg-green-100", label: "High Demand" },
  medium: { icon: Minus, color: "text-yellow-600", bgColor: "bg-yellow-100", label: "Medium Demand" },
  low: { icon: TrendingDown, color: "text-red-600", bgColor: "bg-red-100", label: "Low Demand" },
};

// RIASEC code colors
const riasecColors: Record<string, string> = {
  R: "bg-red-100 text-red-700",
  I: "bg-blue-100 text-blue-700",
  A: "bg-pink-100 text-pink-700",
  S: "bg-green-100 text-green-700",
  E: "bg-yellow-100 text-yellow-700",
  C: "bg-purple-100 text-purple-700",
};

export default function AdminCareersPage() {
  const [careers, setCareers] = useState<CareerData[]>([]);
  const [filteredCareers, setFilteredCareers] = useState<CareerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [demandFilter, setDemandFilter] = useState("all");
  const [bhutanFilter, setBhutanFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedCareers, setSelectedCareers] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [careerToDelete, setCareerToDelete] = useState<string | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingCareer, setEditingCareer] = useState<CareerData | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Fetch careers on mount
  useEffect(() => {
    fetchCareers();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...careers];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (career) =>
          career.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          career.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          career.riasecCode?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Demand filter
    if (demandFilter !== "all") {
      filtered = filtered.filter((career) => career.demandOutlook === demandFilter);
    }

    // Bhutan-specific filter
    if (bhutanFilter === "bhutan") {
      filtered = filtered.filter((career) => !!career.bhutanSpecific);
    } else if (bhutanFilter === "general") {
      filtered = filtered.filter((career) => !career.bhutanSpecific);
    }

    // Sort
    filtered.sort((a, b) => {
      let compareA = a[sortBy];
      let compareB = b[sortBy];

      if (sortBy === "demandOutlook") {
        const order = { high: 3, medium: 2, low: 1 };
        compareA = order[compareA as keyof typeof order] || 0;
        compareB = order[compareB as keyof typeof order] || 0;
      }

      if (compareA < compareB) return sortOrder === "asc" ? -1 : 1;
      if (compareA > compareB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    setFilteredCareers(filtered);
  }, [careers, searchQuery, demandFilter, bhutanFilter, sortBy, sortOrder]);

  const fetchCareers = async () => {
    setLoading(true);
    try {
      const data = await getCareers();
      // Transform data to match CareerData type with computed fields
      const transformedData = data.map((career: RawCareerData): CareerData => ({
        id: career.id,
        name: career.name,
        slug: career.slug,
        title: career.title,
        description: career.description,
        riasecCode: career.riasecCode,
        hollandCodes: typeof career.hollandCodes === 'object' && !Array.isArray(career.hollandCodes)
          ? career.hollandCodes as Record<string, number>
          : null,
        skills: career.skills,
        educationLevel: Array.isArray(career.educationLevel)
          ? career.educationLevel
          : undefined,
        subjects: Array.isArray(career.subjects)
          ? Array.isArray(career.subjects[0])
            ? (career.subjects as string[][]).flat()
            : career.subjects as string[]
          : undefined,
        workEnvironment: career.workEnvironment,
        typicalSalary: career.typicalSalary,
        bhutanDemand: career.bhutanDemand,
        bhutanSpecific: career.bhutanSpecific,
        isActive: career.isActive,
        demandOutlook: (career.bhutanDemand === "high" || career.bhutanDemand === "medium" || career.bhutanDemand === "low")
          ? career.bhutanDemand
          : "medium",
        salaryRange: career.typicalSalary || undefined,
        educationPath: career.educationLevel
          ? Array.isArray(career.educationLevel)
            ? career.educationLevel
            : [career.educationLevel]
          : undefined,
      }));
      setCareers(transformedData);
      setFilteredCareers(transformedData);
    } catch (error) {
      logger.error("Failed to fetch careers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCareer(id);
      setCareers(careers.filter((c) => c.id !== id));
      setShowDeleteDialog(false);
      setCareerToDelete(null);
    } catch (error) {
      logger.error("Failed to delete career:", error);
    }
  };

  const toggleSelectAll = () => {
    if (selectedCareers.size === filteredCareers.length) {
      setSelectedCareers(new Set());
    } else {
      setSelectedCareers(new Set(filteredCareers.map((c) => c.id)));
    }
  };

  const toggleSelectCareer = (id: string) => {
    const newSelected = new Set(selectedCareers);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedCareers(newSelected);
  };

  // Calculate stats
  const totalCareers = careers.length;
  const bhutanCareers = careers.filter((c) => !!c.bhutanSpecific).length;
  const highDemandCareers = careers.filter((c) => c.demandOutlook === "high").length;
  const mediumDemandCareers = careers.filter((c) => c.demandOutlook === "medium").length;
  const lowDemandCareers = careers.filter((c) => c.demandOutlook === "low").length;

  // Get unique skills count
  const allSkills = careers.flatMap((c) => c.skills || []);
  const uniqueSkills = Array.from(new Set(allSkills));

  // Get unique education paths
  const allPaths = careers.flatMap((c) => c.educationPath || []);
  const uniquePaths = Array.from(new Set(allPaths));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Careers Database</h1>
          <p className="text-gray-600">
            Manage career profiles, salary data, and demand outlook
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="min-h-[44px]">
            <Upload className="w-4 h-4 mr-2" />
            Import Careers
          </Button>
          <Button
            style={{ background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }}
            className="text-white min-h-[44px]"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Career
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Total Careers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{totalCareers}</div>
            <p className="text-xs text-gray-500 mt-1">In database</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-500" />
              Bhutan-Specific
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{bhutanCareers}</div>
            <p className="text-xs text-gray-500 mt-1">
              {((bhutanCareers / totalCareers) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              High Demand
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{highDemandCareers}</div>
            <p className="text-xs text-gray-500 mt-1">
              {((highDemandCareers / totalCareers) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Minus className="w-4 h-4 text-yellow-500" />
              Medium Demand
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{mediumDemandCareers}</div>
            <p className="text-xs text-gray-500 mt-1">
              {((mediumDemandCareers / totalCareers) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-500" />
              Low Demand
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{lowDemandCareers}</div>
            <p className="text-xs text-gray-500 mt-1">
              {((lowDemandCareers / totalCareers) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Award className="w-4 h-4" />
              Unique Skills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{uniqueSkills.length}</div>
            <p className="text-xs text-gray-500 mt-1">Across careers</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search careers by name, description, or RIASEC code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 min-h-[44px] rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
              />
            </div>
            <select
              value={demandFilter}
              onChange={(e) => setDemandFilter(e.target.value)}
              className="px-4 py-3 min-h-[44px] rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none bg-white"
            >
              <option value="all">All Demand Levels</option>
              <option value="high">High Demand</option>
              <option value="medium">Medium Demand</option>
              <option value="low">Low Demand</option>
            </select>
            <select
              value={bhutanFilter}
              onChange={(e) => setBhutanFilter(e.target.value)}
              className="px-4 py-3 min-h-[44px] rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none bg-white"
            >
              <option value="all">All Careers</option>
              <option value="bhutan">Bhutan-Specific Only</option>
              <option value="general">General Careers</option>
            </select>
            <Button
              variant="outline"
              className="min-h-[44px]"
              onClick={() => {
                setSearchQuery("");
                setDemandFilter("all");
                setBhutanFilter("all");
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Filters Display */}
      {(searchQuery || demandFilter !== "all" || bhutanFilter !== "all") && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-600">Active filters:</span>
          {searchQuery && (
            <Badge
              variant="outline"
              className="px-3 py-1 cursor-pointer hover:bg-gray-100"
              onClick={() => setSearchQuery("")}
              style={{ borderColor: "rgb(236 72 153)", color: "rgb(219 39 119)" }}
            >
              Search: "{searchQuery}" <XCircle className="w-3 h-3 ml-1" />
            </Badge>
          )}
          {demandFilter !== "all" && (
            <Badge
              variant="outline"
              className="px-3 py-1 cursor-pointer hover:bg-gray-100"
              onClick={() => setDemandFilter("all")}
              style={{ borderColor: "rgb(236 72 153)", color: "rgb(219 39 119)" }}
            >
              Demand: {demandFilter} <XCircle className="w-3 h-3 ml-1" />
            </Badge>
          )}
          {bhutanFilter !== "all" && (
            <Badge
              variant="outline"
              className="px-3 py-1 cursor-pointer hover:bg-gray-100"
              onClick={() => setBhutanFilter("all")}
              style={{ borderColor: "rgb(236 72 153)", color: "rgb(219 39 119)" }}
            >
              {bhutanFilter === "bhutan" ? "Bhutan-Specific" : "General"} <XCircle className="w-3 h-3 ml-1" />
            </Badge>
          )}
        </div>
      )}

      {/* Careers Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Careers</CardTitle>
              <CardDescription>
                {filteredCareers.length} careers in database
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {selectedCareers.size > 0 && (
                <Badge
                  className="min-h-[36px] px-3"
                  style={{ backgroundColor: "rgb(236 72 153)", color: "white" }}
                >
                  {selectedCareers.size} selected
                </Badge>
              )}
              <Button variant="outline" size="sm" className="min-h-[36px]">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin"></div>
              <p className="text-gray-500 mt-4">Loading careers...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedCareers.size === filteredCareers.length && filteredCareers.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                      />
                    </th>
                    <th
                      className="text-left py-3 px-4 font-medium text-gray-600 text-sm cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort("name")}
                    >
                      <div className="flex items-center gap-1">
                        Career
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">RIASEC</th>
                    <th
                      className="text-left py-3 px-4 font-medium text-gray-600 text-sm cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort("demandOutlook")}
                    >
                      <div className="flex items-center gap-1">
                        Demand
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Salary Range</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">Education</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-600 text-sm">Bhutan</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600 text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCareers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                            <Briefcase className="w-8 h-8 text-gray-400" />
                          </div>
                          <div>
                            <p className="text-gray-900 font-medium">No careers found</p>
                            <p className="text-gray-500 text-sm">Try adjusting your filters or add a new career</p>
                          </div>
                          <Button
                            style={{ background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }}
                            className="text-white"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add First Career
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredCareers.map((career) => {
                      const demandInfo = demandConfig[career.demandOutlook as keyof typeof demandConfig] || demandConfig.medium;
                      const DemandIcon = demandInfo.icon;

                      return (
                        <tr key={career.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-4 px-4">
                            <input
                              type="checkbox"
                              checked={selectedCareers.has(career.id)}
                              onChange={() => toggleSelectCareer(career.id)}
                              className="w-4 h-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                            />
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-start gap-3">
                              <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold flex-shrink-0"
                                style={{ background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }}
                              >
                                {career.name?.[0] || "?"}
                              </div>
                              <div>
                                <Link
                                  href={`/admin/careers/${career.id}`}
                                  className="font-medium text-gray-900 hover:text-pink-600 transition-colors"
                                >
                                  {career.name}
                                </Link>
                                {career.description && (
                                  <p className="text-sm text-gray-500 line-clamp-1 max-w-xs">
                                    {career.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            {career.riasecCode ? (
                              <div className="flex gap-1">
                                {career.riasecCode.split("").map((code: string, idx: number) => (
                                  <Badge
                                    key={idx}
                                    variant="outline"
                                    className={`w-6 h-6 flex items-center justify-center p-0 text-xs font-bold ${riasecColors[code as keyof typeof riasecColors] || "bg-gray-100"}`}
                                  >
                                    {code}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">N/A</span>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <Badge
                              variant="outline"
                              className={`${demandInfo.bgColor} ${demandInfo.color} border-0 text-xs`}
                            >
                              <DemandIcon className="w-3 h-3 mr-1" />
                              {demandInfo.label}
                            </Badge>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <DollarSign className="w-3 h-3 text-gray-400" />
                              {career.salaryRange || "N/A"}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {career.educationPath && career.educationPath.length > 0 ? (
                                career.educationPath.slice(0, 2).map((path: string, idx: number) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {path}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-sm text-gray-400">N/A</span>
                              )}
                              {career.educationPath && career.educationPath.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{career.educationPath.length - 2}
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            {career.bhutanSpecific ? (
                              <Badge className="bg-orange-50 text-orange-700 border-orange-200 text-xs">
                                <Sparkles className="w-3 h-3 mr-1" />
                                Yes
                              </Badge>
                            ) : (
                              <span className="text-sm text-gray-400">No</span>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-pink-50 hover:text-pink-600"
                                title="View details"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-pink-50 hover:text-pink-600"
                                title="Edit career"
                                onClick={() => {
                                  setEditingCareer(career);
                                  setShowEditDialog(true);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                                title="Delete career"
                                onClick={() => {
                                  setCareerToDelete(career.id);
                                  setShowDeleteDialog(true);
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && filteredCareers.length > 0 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Showing 1-{filteredCareers.length} of {totalCareers} careers
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled className="min-h-[36px]">
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="min-h-[36px]"
                  style={{
                    background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)",
                    color: "white",
                    border: "none",
                  }}
                >
                  1
                </Button>
                <Button variant="outline" size="sm" className="min-h-[36px]">
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Skills & Education Paths Overview */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Top Skills
            </CardTitle>
            <CardDescription>Most common skills across careers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(
                allSkills.reduce((acc: Record<string, number>, skill: string) => {
                  acc[skill] = (acc[skill] || 0) + 1;
                  return acc;
                }, {})
              )
                .sort(([, a], [, b]) => (a as number) - (b as number))
                .slice(0, 8)
                .map(([skill, count]) => (
                  <div key={skill} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{skill}</span>
                    <Badge
                      variant="outline"
                      className="text-xs"
                      style={{ borderColor: "rgb(236 72 153)", color: "rgb(219 39 119)" }}
                    >
                      {count as number} careers
                    </Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5" />
              Education Paths
            </CardTitle>
            <CardDescription>Common education requirements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {uniquePaths.slice(0, 12).map((path) => (
                <Badge
                  key={path}
                  variant="outline"
                  className="text-sm"
                  style={{ borderColor: "rgb(236 72 153)", color: "rgb(219 39 119)" }}
                >
                  {path}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Actions */}
      {selectedCareers.size > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Bulk Actions</CardTitle>
            <CardDescription>
              Perform actions on {selectedCareers.size} selected careers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" className="min-h-[44px]">
                <TrendingUp className="w-4 h-4 mr-2" />
                Set to High Demand
              </Button>
              <Button variant="outline" className="min-h-[44px]">
                <Sparkles className="w-4 h-4 mr-2" />
                Mark as Bhutan-Specific
              </Button>
              <Button variant="outline" className="min-h-[44px]">
                <Download className="w-4 h-4 mr-2" />
                Export Selected
              </Button>
              <Button variant="outline" className="min-h-[44px] text-red-600 hover:bg-red-50">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Selected
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Career</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this career? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteDialog(false);
                  setCareerToDelete(null);
                }}
                className="min-h-[44px]"
              >
                Cancel
              </Button>
              <Button
                style={{ background: "linear-gradient(135deg, rgb(239 68 68) 0%, rgb(220 38 38) 100%)" }}
                className="text-white min-h-[44px]"
                onClick={() => careerToDelete && handleDelete(careerToDelete)}
              >
                Delete Career
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Career Modal */}
      <AddCareerModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchCareers}
      />

      {/* Edit Career Modal */}
      <EditCareerModal
        open={showEditDialog}
        onClose={() => {
          setShowEditDialog(false);
          setEditingCareer(null);
        }}
        onSuccess={fetchCareers}
        career={editingCareer ? {
          id: editingCareer.id,
          name: editingCareer.name,
          slug: editingCareer.slug,
          description: editingCareer.description || undefined,
          riasecCode: editingCareer.riasecCode || undefined,
          skills: editingCareer.skills || undefined,
          educationLevel: Array.isArray(editingCareer.educationLevel)
            ? editingCareer.educationLevel[0] || "high_school"
            : editingCareer.educationLevel || "high_school",
          subjects: editingCareer.subjects || undefined,
          workEnvironment: editingCareer.workEnvironment || undefined,
          typicalSalary: editingCareer.typicalSalary || undefined,
          bhutanDemand: (editingCareer.bhutanDemand === "high" || editingCareer.bhutanDemand === "medium" || editingCareer.bhutanDemand === "low")
            ? editingCareer.bhutanDemand
            : undefined,
          bhutanSpecific: editingCareer.bhutanSpecific || undefined,
        } : null}
      />
    </div>
  );
}
