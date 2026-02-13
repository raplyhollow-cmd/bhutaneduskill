/**
 * PLATFORM ADMIN - CONTENT MANAGEMENT
 *
 * Content management page for platform administrators.
 * Manage careers, colleges, and scholarships across the platform.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Briefcase,
  GraduationCap,
  Award,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Upload,
  Download,
  Database,
  RefreshCw,
  CheckCircle,
  XCircle,
  Globe,
  Building2,
  Calendar,
  DollarSign,
  FileText,
  BookOpen,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";
import { careers, colleges, rubPrograms, scholarships } from "@/lib/db/schema";
import { desc, eq, sql, count } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

// Content type tabs
const contentTypes = [
  { id: "all", name: "All Content", icon: Database },
  { id: "careers", name: "Careers", icon: Briefcase },
  { id: "colleges", name: "Colleges", icon: GraduationCap },
  { id: "rub", name: "RUB Programs", icon: BookOpen },
  { id: "scholarships", name: "Scholarships", icon: Award },
];

async function getContentStats() {
  const [careerCount, collegeCount, rubCount, scholarshipCount, activeCareerCount, bhutanCareerCount] =
    await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(careers),
      db.select({ count: sql<number>`count(*)` }).from(colleges),
      db.select({ count: sql<number>`count(*)` }).from(rubPrograms),
      db.select({ count: sql<number>`count(*)` }).from(scholarships),
      db.select({ count: sql<number>`count(*)` }).from(careers).where(eq(careers.isActive, true)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(careers)
        .where(eq(careers.bhutanSpecific, true)),
    ]);

  return {
    careers: Number(careerCount[0]?.count) || 0,
    colleges: Number(collegeCount[0]?.count) || 0,
    rubPrograms: Number(rubCount[0]?.count) || 0,
    scholarships: Number(scholarshipCount[0]?.count) || 0,
    activeCareers: Number(activeCareerCount[0]?.count) || 0,
    bhutanCareers: Number(bhutanCareerCount[0]?.count) || 0,
    total:
      (Number(careerCount[0]?.count) || 0) +
      (Number(collegeCount[0]?.count) || 0) +
      (Number(rubCount[0]?.count) || 0) +
      (Number(scholarshipCount[0]?.count) || 0),
  };
}

async function getRecentContent() {
  // Get recent items from each content type
  const [recentCareers, recentColleges, recentScholarships] = await Promise.all([
    db
      .select({
        id: careers.id,
        name: careers.name,
        riasecCode: careers.riasecCode,
        isActive: careers.isActive,
        bhutanSpecific: careers.bhutanSpecific,
        updatedAt: careers.updatedAt,
        type: sql<string>`'career'`,
      })
      .from(careers)
      .orderBy(desc(careers.updatedAt))
      .limit(5),
    db
      .select({
        id: colleges.id,
        name: colleges.name,
        type: colleges.type,
        dzongkhag: colleges.dzongkhag,
        updatedAt: colleges.updatedAt,
        location: colleges.location,
        careerType: sql<string>`'college'`,
      })
      .from(colleges)
      .orderBy(desc(colleges.updatedAt))
      .limit(5),
    db
      .select({
        id: scholarships.id,
        name: scholarships.name,
        provider: scholarships.provider,
        type: scholarships.type,
        applicationCloseDate: scholarships.applicationCloseDate,
        academicYear: scholarships.academicYear,
        scholarshipType: sql<string>`'scholarship'`,
      })
      .from(scholarships)
      .orderBy(desc(scholarships.createdAt))
      .limit(5),
  ]);

  // Combine and sort by date
  const allContent = [
    ...recentCareers.map((c) => ({ ...c, contentType: "career" as const })),
    ...recentColleges.map((c) => ({ ...c, contentType: "college" as const })),
    ...recentScholarships.map((c) => ({ ...c, contentType: "scholarship" as const })),
  ]
    .sort((a, b) => {
      // Use type guards to safely access properties
      const aDate =
        "updatedAt" in a ? (a.updatedAt as Date) : "createdAt" in a ? (a.createdAt as Date) : 0;
      const bDate =
        "updatedAt" in b ? (b.updatedAt as Date) : "createdAt" in b ? (b.createdAt as Date) : 0;
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    })
    .slice(0, 10);

  return allContent;
}

async function getTopCareers() {
  return await db
    .select({
      id: careers.id,
      name: careers.name,
      riasecCode: careers.riasecCode,
      growthOutlook: careers.growthOutlook,
      bhutanSpecific: careers.bhutanSpecific,
    })
    .from(careers)
    .where(eq(careers.isActive, true))
    .orderBy(desc(careers.createdAt))
    .limit(10);
}

async function getUpcomingScholarships() {
  const today = new Date().toISOString().split("T")[0];
  return await db
    .select({
      id: scholarships.id,
      name: scholarships.name,
      provider: scholarships.provider,
      applicationCloseDate: scholarships.applicationCloseDate,
      type: scholarships.type,
      coveragePercentage: scholarships.coveragePercentage,
    })
    .from(scholarships)
    .where(eq(scholarships.isActive, true))
    .orderBy(desc(scholarships.applicationCloseDate))
    .limit(5);
}

export default async function AdminContentPage({
  searchParams,
}: {
  searchParams: { type?: string; tab?: string };
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const activeTab = searchParams.tab || "all";
  const stats = await getContentStats();
  const recentContent = await getRecentContent();
  const topCareers = await getTopCareers();
  const upcomingScholarships = await getUpcomingScholarships();

  const contentTypeIcons = {
    career: Briefcase,
    college: GraduationCap,
    scholarship: Award,
    rub: BookOpen,
  };

  const demandColors = {
    high: "bg-green-100 text-green-700 border-green-200",
    medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
    low: "bg-gray-100 text-gray-700 border-gray-200",
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Content Management</h1>
          <p className="text-gray-600">
            Manage careers, colleges, and scholarships content
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Import Content
          </Button>
          <Button
            style={{ background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }}
            className="text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Content
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Database className="w-4 h-4" />
              Total Content
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
            <p className="text-xs text-gray-500 mt-1">All content items</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Careers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-pink-600">{stats.careers}</div>
            <p className="text-xs text-green-600 mt-1">
              {stats.activeCareers} active • {stats.bhutanCareers} Bhutan-specific
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              Colleges
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.colleges}</div>
            <p className="text-xs text-gray-500 mt-1">Including RUB colleges</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              RUB Programs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{stats.rubPrograms}</div>
            <p className="text-xs text-gray-500 mt-1">Royal University programs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Award className="w-4 h-4" />
              Scholarships
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.scholarships}</div>
            <p className="text-xs text-gray-500 mt-1">Available scholarships</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2 overflow-x-auto">
            {contentTypes.map((type) => {
              const Icon = type.icon;
              const isActive = activeTab === type.id;
              return (
                <Link
                  key={type.id}
                  href={`/admin/content?tab=${type.id}`}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? "text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                  style={
                    isActive
                      ? { background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }
                      : undefined
                  }
                >
                  <Icon className="w-4 h-4" />
                  {type.name}
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search content by name, category, or keywords..."
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
              />
            </div>
            <select className="px-4 py-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none">
              <option value="">All Categories</option>
              <option value="stem">STEM</option>
              <option value="healthcare">Healthcare</option>
              <option value="business">Business</option>
              <option value="arts">Arts & Humanities</option>
              <option value="education">Education</option>
            </select>
            <select className="px-4 py-3 rounded-lg border border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <Button
              style={{ background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }}
              className="text-white"
            >
              <Filter className="w-4 h-4 mr-2" />
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Content */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Content</CardTitle>
                <CardDescription>Latest updated content items</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Sync Data
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentContent.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No content found</p>
                </div>
              ) : (
                recentContent.map((item) => {
                  const Icon =
                    contentTypeIcons[item.contentType as keyof typeof contentTypeIcons];
                  const isActive = "isActive" in item ? item.isActive : true;
                  return (
                    <div
                      key={`${item.contentType}-${item.id}`}
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          item.contentType === "career"
                            ? "bg-pink-100"
                            : item.contentType === "college"
                            ? "bg-blue-100"
                            : "bg-green-100"
                        }`}
                      >
                        <Icon
                          className={`w-5 h-5 ${
                            item.contentType === "career"
                              ? "text-pink-600"
                              : item.contentType === "college"
                              ? "text-blue-600"
                              : "text-green-600"
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 truncate">{item.name}</p>
                          <Badge variant="outline" className="text-xs capitalize">
                            {item.contentType}
                          </Badge>
                          {isActive && (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          {"riasecCode" in item && item.riasecCode && (
                            <span>Holland Code: {item.riasecCode}</span>
                          )}
                          {"location" in item && item.location && <span>{item.location}</span>}
                          {"provider" in item && item.provider && <span>{item.provider}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-pink-50 hover:text-pink-600"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-pink-50 hover:text-pink-600"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="space-y-6">
          {/* Top Careers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-pink-600" />
                High Demand Careers
              </CardTitle>
              <CardDescription>Careers with high growth potential</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topCareers.slice(0, 5).map((career, index) => (
                  <div
                    key={career.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50"
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">
                        {career.name}
                      </p>
                      {career.riasecCode && (
                        <p className="text-xs text-gray-500">{career.riasecCode}</p>
                      )}
                    </div>
                    {career.bhutanSpecific && (
                      <Sparkles className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Scholarships */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-green-600" />
                Upcoming Deadlines
              </CardTitle>
              <CardDescription>Scholarships closing soon</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingScholarships.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No upcoming deadlines
                  </p>
                ) : (
                  upcomingScholarships.map((scholarship) => (
                    <div
                      key={scholarship.id}
                      className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">
                            {scholarship.name}
                          </p>
                          <p className="text-xs text-gray-500">{scholarship.provider}</p>
                        </div>
                        {scholarship.coveragePercentage && (
                          <div className="flex items-center gap-1 text-green-600">
                            <DollarSign className="w-3 h-3" />
                            <span className="text-xs font-medium">
                              {scholarship.coveragePercentage}%
                            </span>
                          </div>
                        )}
                      </div>
                      {scholarship.applicationCloseDate && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-red-600">
                          <Calendar className="w-3 h-3" />
                          Due: {scholarship.applicationCloseDate}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Data Sources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            External Data Sources
          </CardTitle>
          <CardDescription>Manage external content integrations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 border border-gray-200 rounded-lg hover:border-pink-300 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-600" />
                  <span className="font-medium">IPEDx</span>
                </div>
                <Badge className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Connected
                </Badge>
              </div>
              <p className="text-sm text-gray-500 mb-3">
                US college data integration
              </p>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Last sync: 2 hours ago</span>
                <Button variant="ghost" size="sm" className="h-6 text-xs">
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Sync
                </Button>
              </div>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg hover:border-pink-300 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-purple-600" />
                  <span className="font-medium">RUB</span>
                </div>
                <Badge className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Connected
                </Badge>
              </div>
              <p className="text-sm text-gray-500 mb-3">
                Royal University of Bhutan programs
              </p>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Last sync: 1 day ago</span>
                <Button variant="ghost" size="sm" className="h-6 text-xs">
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Sync
                </Button>
              </div>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg hover:border-pink-300 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-green-600" />
                  <span className="font-medium">Scholarships</span>
                </div>
                <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200">
                  <XCircle className="w-3 h-3 mr-1" />
                  Manual
                </Badge>
              </div>
              <p className="text-sm text-gray-500 mb-3">
                Scholarship database (manual entry)
              </p>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{stats.scholarships} entries</span>
                <Button variant="ghost" size="sm" className="h-6 text-xs">
                  <Upload className="w-3 h-3 mr-1" />
                  Import
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Bulk Content Operations</CardTitle>
          <CardDescription>Perform batch operations on content items</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Import CSV/JSON
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Content
            </Button>
            <Button variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Sync All Sources
            </Button>
            <Button variant="outline" className="text-red-600 hover:bg-red-50">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Selected
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
