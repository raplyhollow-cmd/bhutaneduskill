"use client";

/**
 * SCHOOL ADMIN INFIRMARY DASHBOARD PAGE
 *
 * School administrators can:
 * - View infirmary statistics
 * - See recent medical visits
 * - View students with allergies
 * - Check low stock medicines
 * - Manage pending referrals
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  HeartPulse,
  Users,
  AlertTriangle,
  Package,
  Calendar,
  Loader2,
  RefreshCw,
  Plus,
  Search,
  ArrowRight,
  TrendingUp,
  Activity,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";

interface MedicalRecord {
  id: string;
  visitDate: string;
  visitType: string;
  chiefComplaint: string;
  isEmergency: boolean;
  student: {
    id: string;
    name: string;
    classGrade?: number;
    section?: string;
  };
}

interface StudentAllergy {
  id: string;
  allergenType: string;
  allergenName?: string;
  severity: string;
  conditionType?: string;
  student: {
    id: string;
    name: string;
    classGrade?: number;
  };
}

interface MedicineInventory {
  id: string;
  medicineName: string;
  category: string;
  currentStock: number;
  minimumStock: number;
  unit: string;
  status: string;
}

interface MedicalReferral {
  id: string;
  referralDate: string;
  facilityName: string;
  urgency: string;
  status: string;
  student: {
    id: string;
    name: string;
  };
}

interface DashboardData {
  stats: {
    totalVisits: number;
    emergencyVisits: number;
    studentsWithAllergies: number;
    lowStockMedicines: number;
    pendingReferrals: number;
  };
  recentVisits: MedicalRecord[];
  studentsWithAllergies: StudentAllergy[];
  lowStockMedicines: MedicineInventory[];
  pendingReferrals: MedicalReferral[];
}

export default function InfirmaryDashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "visits" | "allergies" | "inventory">("overview");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/school-admin/medical");
      const data = await res.json();

      if (data.success) {
        setDashboardData(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "mild":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "moderate":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "severe":
        return "bg-red-100 text-red-700 border-red-200";
      case "life_threatening":
        return "bg-purple-100 text-purple-700 border-purple-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "emergency":
        return "bg-red-600 text-white";
      case "urgent":
        return "bg-orange-500 text-white";
      case "routine":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const filteredVisits = dashboardData?.recentVisits.filter((visit) =>
    visit.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    visit.chiefComplaint.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const filteredAllergies = dashboardData?.studentsWithAllergies.filter((allergy) =>
    allergy.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (allergy.allergenName && allergy.allergenName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (allergy.conditionType && allergy.conditionType.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <HeartPulse className="w-8 h-8 text-purple-600" />
            Infirmary Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Manage medical records, inventory, and student health
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/school-admin/infirmary/visits">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Visit
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={fetchDashboardData}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {dashboardData && (
        <div className="grid md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-gray-500 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Total Visits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{dashboardData.stats.totalVisits}</div>
              <p className="text-xs text-gray-500 mt-1">This period</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-gray-500 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Emergency Visits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{dashboardData.stats.emergencyVisits}</div>
              <p className="text-xs text-gray-500 mt-1">Requires attention</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-gray-500 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Students w/ Allergies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{dashboardData.stats.studentsWithAllergies}</div>
              <p className="text-xs text-gray-500 mt-1">Known conditions</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-gray-500 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Low Stock Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{dashboardData.stats.lowStockMedicines}</div>
              <p className="text-xs text-gray-500 mt-1">Needs restocking</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-gray-500 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Pending Referrals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{dashboardData.stats.pendingReferrals}</div>
              <p className="text-xs text-gray-500 mt-1">Awaiting action</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid md:grid-cols-4 gap-4">
        <Link href="/school-admin/infirmary/visits" className="block">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Plus className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Log Visit</p>
                <p className="text-sm text-gray-500">Record student visit</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/school-admin/infirmary/inventory" className="block">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Package className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Inventory</p>
                <p className="text-sm text-gray-500">Manage medicines</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/school-admin/infirmary/vaccinations" className="block">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Vaccinations</p>
                <p className="text-sm text-gray-500">Immunization records</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/school-admin/infirmary/referrals" className="block">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Calendar className="w-5 h-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Referrals</p>
                <p className="text-sm text-gray-500">External referrals</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "overview" | "visits" | "allergies" | "inventory")}>
        <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="visits">Recent Visits</TabsTrigger>
          <TabsTrigger value="allergies">Allergies</TabsTrigger>
          <TabsTrigger value="inventory">Low Stock</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Recent Visits */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Medical Visits</CardTitle>
                <CardDescription>Latest infirmary visits</CardDescription>
              </div>
              <Link href="/school-admin/infirmary/visits">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {filteredVisits.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No recent visits</p>
              ) : (
                <div className="space-y-3">
                  {filteredVisits.slice(0, 5).map((visit) => (
                    <div
                      key={visit.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{visit.student.name}</p>
                          <p className="text-sm text-gray-500">
                            {visit.student.classGrade && `Class ${visit.student.classGrade}`}
                            {visit.student.section && `-${visit.student.section}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{visit.chiefComplaint}</p>
                        <p className="text-xs text-gray-500">{formatDate(visit.visitDate)}</p>
                      </div>
                      {visit.isEmergency && (
                        <Badge className="bg-red-600 text-white">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Emergency
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Students with Allergies Alert */}
          {dashboardData?.studentsWithAllergies && dashboardData.studentsWithAllergies.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  Students with Known Allergies/Conditions
                </CardTitle>
                <CardDescription>Students requiring special attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-3">
                  {filteredAllergies.slice(0, 6).map((allergy) => (
                    <div
                      key={allergy.id}
                      className="p-3 border rounded-lg hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-gray-900">{allergy.student.name}</p>
                        <Badge className={getSeverityColor(allergy.severity)} variant="outline">
                          {allergy.severity}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        {allergy.allergenName && (
                          <p>Allergy: {allergy.allergenName}</p>
                        )}
                        {allergy.conditionType && (
                          <p>Condition: {allergy.conditionType.replace(/_/g, " ")}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Visits Tab */}
        <TabsContent value="visits">
          <Card>
            <CardHeader>
              <CardTitle>All Medical Visits</CardTitle>
              <CardDescription>Complete visit history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Search by student name or complaint..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              {filteredVisits.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No visits found</p>
              ) : (
                <div className="space-y-3">
                  {filteredVisits.map((visit) => (
                    <div
                      key={visit.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{visit.student.name}</p>
                          <p className="text-sm text-gray-500">
                            {visit.student.classGrade && `Class ${visit.student.classGrade}`}
                            {visit.student.section && `-${visit.student.section}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-900">{visit.chiefComplaint}</p>
                        <p className="text-xs text-gray-500">{formatDate(visit.visitDate)}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge className="bg-purple-100 text-purple-700 border-purple-200" variant="outline">
                          {visit.visitType}
                        </Badge>
                        {visit.isEmergency && (
                          <Badge className="bg-red-600 text-white">Emergency</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Allergies Tab */}
        <TabsContent value="allergies">
          <Card>
            <CardHeader>
              <CardTitle>Students with Allergies & Conditions</CardTitle>
              <CardDescription>Complete list of known medical conditions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Search by student name, allergy, or condition..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              {filteredAllergies.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No records found</p>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {filteredAllergies.map((allergy) => (
                    <div
                      key={allergy.id}
                      className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold text-gray-900">{allergy.student.name}</p>
                          <p className="text-sm text-gray-500">
                            {allergy.student.classGrade && `Class ${allergy.student.classGrade}`}
                          </p>
                        </div>
                        <Badge className={getSeverityColor(allergy.severity)} variant="outline">
                          {allergy.severity}
                        </Badge>
                      </div>
                      {allergy.allergenName && (
                        <div className="flex items-center gap-2 text-sm">
                          <AlertTriangle className="w-4 h-4 text-orange-500" />
                          <span className="font-medium">Allergy:</span>
                          <span>{allergy.allergenName}</span>
                          <Badge variant="outline" className="text-xs ml-auto">
                            {allergy.allergenType}
                          </Badge>
                        </div>
                      )}
                      {allergy.conditionType && (
                        <div className="flex items-center gap-2 text-sm mt-2">
                          <HeartPulse className="w-4 h-4 text-purple-500" />
                          <span className="font-medium">Condition:</span>
                          <span>{allergy.conditionType.replace(/_/g, " ")}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Low Stock Tab */}
        <TabsContent value="inventory">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-yellow-600" />
                  Low Stock Medicines
                </CardTitle>
                <CardDescription>Items that need restocking</CardDescription>
              </div>
              <Link href="/school-admin/infirmary/inventory">
                <Button variant="outline" size="sm">Manage Inventory</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {dashboardData?.lowStockMedicines && dashboardData.lowStockMedicines.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto text-green-300 mb-3" />
                  <p>All medicines are well stocked!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dashboardData?.lowStockMedicines.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 border border-yellow-200 bg-yellow-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-200 rounded-lg">
                          <Package className="w-5 h-5 text-yellow-700" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{item.medicineName}</p>
                          <p className="text-sm text-gray-500">{item.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-red-600">
                          {item.currentStock} {item.unit}
                        </p>
                        <p className="text-xs text-gray-500">
                          Min: {item.minimumStock} {item.unit}
                        </p>
                      </div>
                      <Badge className="bg-red-600 text-white">
                        Low Stock
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
