"use client";

import { logger } from "@/lib/logger";
/**
 * SCHOOL ADMIN - TRANSPORT MANAGEMENT
 *
 * Complete transport management system for school administrators.
 * Features:
 * - Route management (create, edit, delete)
 * - Vehicle registration and tracking
 * - Driver management
 * - Student transport allocations
 * - Real-time vehicle tracking overview
 */

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Bus,
  MapPin,
  Clock,
  User,
  Phone,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Navigation,
  Users,
  Car,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Search,
  Calendar,
  DollarSign,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Types with proper TypeScript
interface RouteStop {
  name: string;
  location: { lat: string; lng: string };
  time: string;
  order?: number;
}

interface TransportRoute {
  id: string;
  routeNumber: string;
  name: string;
  routeName?: string;
  startLocation: string;
  endLocation: string;
  stops?: RouteStop[];
  distance?: number;
  estimatedTime?: number;
  fee?: number;
  capacity?: number;
  morningStartTime?: string;
  afternoonEndTime?: string;
  vehicleId?: string;
  isActive?: boolean;
  currentStudents?: number;
  availableSeats?: number;
  vehicle?: {
    id: string;
    registrationNumber: string;
    vehicleType: string;
    capacity?: number;
    driverName?: string;
    driverPhone?: string;
  };
}

interface Vehicle {
  id: string;
  registrationNumber: string;
  vehicleNumber?: string;
  vehicleType: string;
  make?: string;
  model?: string;
  year?: number;
  capacity?: number;
  hasAC?: boolean;
  hasCCTV?: boolean;
  hasGPS?: boolean;
  status: string;
  driverName?: string;
  driverPhone?: string;
  conductorName?: string;
  conductorPhone?: string;
  routeId?: string;
}

interface Driver {
  id: string;
  firstName: string;
  lastName?: string;
  phone: string;
  licenseNumber: string;
  licenseType?: string;
  licenseExpiry?: string;
  badgeNumber?: string;
  status: string;
  assignedVehicles?: number;
  assignedVehicleList?: Vehicle[];
}

interface TransportAllocation {
  id: string;
  studentId: string;
  routeId: string;
  vehicleId: string | null;
  stopName: string;
  pickupTime: string;
  dropTime: string;
  fee: number;
  isPaid: boolean;
  isActive: boolean;
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    classGrade: string;
    section: string;
  };
  route?: TransportRoute;
  vehicle?: Vehicle;
}

interface TransportStats {
  totalRoutes: number;
  totalVehicles: number;
  totalDrivers: number;
  totalAllocations: number;
  activeRoutes: number;
  activeVehicles: number;
}

type TabValue = "routes" | "vehicles" | "drivers" | "allocations" | "overview";
type DialogType = "addRoute" | "editRoute" | "addVehicle" | "editVehicle" | "addDriver" | "editDriver" | "allocate" | null;

export default function SchoolAdminTransportPage() {
  // Stats and data
  const [stats, setStats] = useState<TransportStats>({
    totalRoutes: 0,
    totalVehicles: 0,
    totalDrivers: 0,
    totalAllocations: 0,
    activeRoutes: 0,
    activeVehicles: 0,
  });

  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [allocations, setAllocations] = useState<TransportAllocation[]>([]);

  // UI state
  const [activeTab, setActiveTab] = useState<TabValue>("overview");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState<DialogType>(null);
  const [selectedItem, setSelectedItem] = useState<TransportRoute | Vehicle | Driver | TransportAllocation | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  // Form states
  const [routeForm, setRouteForm] = useState({
    routeNumber: "",
    name: "",
    startLocation: "",
    endLocation: "",
    distance: "",
    estimatedTime: "",
    fee: "",
    capacity: "40",
    morningStartTime: "",
    afternoonEndTime: "",
    vehicleId: "",
    stops: [] as RouteStop[],
  });

  const [vehicleForm, setVehicleForm] = useState({
    registrationNumber: "",
    vehicleNumber: "",
    vehicleType: "Bus",
    make: "",
    model: "",
    year: "",
    seatingCapacity: "40",
    hasAC: false,
    hasCCTV: false,
    hasGPS: false,
    driverName: "",
    driverPhone: "",
    conductorName: "",
    conductorPhone: "",
  });

  const [driverForm, setDriverForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    emergencyContact: "",
    address: "",
    licenseNumber: "",
    licenseType: "Heavy",
    licenseExpiry: "",
    badgeNumber: "",
    employeeId: "",
  });

  const [allocationForm, setAllocationForm] = useState({
    studentId: "",
    routeId: "",
    vehicleId: "",
    stopName: "",
    pickupTime: "",
    dropTime: "",
  });

  // Students for allocation dropdown
  const [students, setStudents] = useState<Array<{ id: string; name: string; classGrade: string }>>([]);

  // Fetch all transport data
  const fetchTransportData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [routesRes, vehiclesRes, driversRes, allocationsRes] = await Promise.all([
        fetch("/api/transport/routes?includeVehicle=true&includeAllocations=true"),
        fetch("/api/transport/vehicles?includeRoute=true"),
        fetch("/api/transport/drivers?includeVehicles=true"),
        fetch("/api/transport/allocations"),
      ]);

      const [routesData, vehiclesData, driversData, allocationsData] = await Promise.all([
        routesRes.json(),
        vehiclesRes.json(),
        driversRes.json(),
        allocationsRes.json(),
      ]);

      if (routesData.routes) {
        setRoutes(routesData.routes);
      }
      if (vehiclesData.vehicles) {
        setVehicles(vehiclesData.vehicles);
      }
      if (driversData.drivers) {
        setDrivers(driversData.drivers);
      }
      if (allocationsData.allocations) {
        setAllocations(allocationsData.allocations);
      }

      // Calculate stats
      setStats({
        totalRoutes: routesData.routes?.length || 0,
        totalVehicles: vehiclesData.vehicles?.length || 0,
        totalDrivers: driversData.drivers?.length || 0,
        totalAllocations: allocationsData.allocations?.length || 0,
        activeRoutes: routesData.routes?.filter((r: TransportRoute) => r.isActive).length || 0,
        activeVehicles: vehiclesData.vehicles?.filter((v: Vehicle) => v.status === "active").length || 0,
      });
    } catch (err) {
      logger.error("Error fetching transport data:", err);
      setError("Failed to load transport data");
    } finally {
      setLoading(false);
    }
  };

  // Fetch students for allocation
  const fetchStudents = async () => {
    try {
      const response = await fetch("/api/school-admin/students?limit=100");
      const data = await response.json();
      if (data.students) {
        setStudents(data.students.map((s: { id: string; firstName: string; lastName: string; classGrade: string }) => ({
          id: s.id,
          name: `${s.firstName} ${s.lastName}`.trim(),
          classGrade: s.classGrade,
        })));
      }
    } catch (err) {
      logger.error("Error fetching students:", err);
    }
  };

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchTransportData();
  }, []);

  useEffect(() => {
    if (dialogOpen === "allocate") {
      fetchStudents();
    }
  }, [dialogOpen]);

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTransportData();
    setRefreshing(false);
  };

  // Open dialog
  const openDialog = (type: DialogType, item?: TransportRoute | Vehicle | Driver | TransportAllocation) => {
    setSelectedItem(item || null);
    setDialogOpen(type);

    if (type === "addRoute" || type === "editRoute") {
      if (item && type === "editRoute") {
        const route = item as TransportRoute;
        setRouteForm({
          routeNumber: route.routeNumber,
          name: route.name,
          startLocation: route.startLocation,
          endLocation: route.endLocation,
          distance: route.distance?.toString() || "",
          estimatedTime: route.estimatedTime?.toString() || "",
          fee: route.fee?.toString() || "",
          capacity: route.capacity?.toString() || "40",
          morningStartTime: route.morningStartTime || "",
          afternoonEndTime: route.afternoonEndTime || "",
          vehicleId: route.vehicleId || "",
          stops: route.stops || [],
        });
      } else {
        setRouteForm({
          routeNumber: "",
          name: "",
          startLocation: "",
          endLocation: "",
          distance: "",
          estimatedTime: "",
          fee: "",
          capacity: "40",
          morningStartTime: "",
          afternoonEndTime: "",
          vehicleId: "",
          stops: [],
        });
      }
    } else if (type === "addVehicle" || type === "editVehicle") {
      if (item && type === "editVehicle") {
        const vehicle = item as Vehicle;
        setVehicleForm({
          registrationNumber: vehicle.registrationNumber,
          vehicleNumber: vehicle.vehicleNumber || "",
          vehicleType: vehicle.vehicleType,
          make: vehicle.make || "",
          model: vehicle.model || "",
          year: vehicle.year?.toString() || "",
          seatingCapacity: vehicle.capacity?.toString() || "40",
          hasAC: vehicle.hasAC || false,
          hasCCTV: vehicle.hasCCTV || false,
          hasGPS: vehicle.hasGPS || false,
          driverName: vehicle.driverName || "",
          driverPhone: vehicle.driverPhone || "",
          conductorName: vehicle.conductorName || "",
          conductorPhone: vehicle.conductorPhone || "",
        });
      } else {
        setVehicleForm({
          registrationNumber: "",
          vehicleNumber: "",
          vehicleType: "Bus",
          make: "",
          model: "",
          year: "",
          seatingCapacity: "40",
          hasAC: false,
          hasCCTV: false,
          hasGPS: false,
          driverName: "",
          driverPhone: "",
          conductorName: "",
          conductorPhone: "",
        });
      }
    } else if (type === "addDriver" || type === "editDriver") {
      if (item && type === "editDriver") {
        const driver = item as Driver;
        setDriverForm({
          firstName: driver.firstName,
          lastName: driver.lastName || "",
          phone: driver.phone,
          emergencyContact: "",
          address: "",
          licenseNumber: driver.licenseNumber,
          licenseType: driver.licenseType || "Heavy",
          licenseExpiry: driver.licenseExpiry || "",
          badgeNumber: driver.badgeNumber || "",
          employeeId: "",
        });
      } else {
        setDriverForm({
          firstName: "",
          lastName: "",
          phone: "",
          emergencyContact: "",
          address: "",
          licenseNumber: "",
          licenseType: "Heavy",
          licenseExpiry: "",
          badgeNumber: "",
          employeeId: "",
        });
      }
    }
  };

  // Close dialog
  const closeDialog = () => {
    setDialogOpen(null);
    setSelectedItem(null);
    setError(null);
  };

  // Submit handlers
  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      if (dialogOpen === "addRoute") {
        const response = await fetch("/api/transport/routes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            routeNumber: routeForm.routeNumber,
            name: routeForm.name,
            startLocation: routeForm.startLocation,
            endLocation: routeForm.endLocation,
            stops: routeForm.stops,
            distance: parseFloat(routeForm.distance) || 0,
            estimatedTime: parseInt(routeForm.estimatedTime) || 0,
            fee: parseFloat(routeForm.fee) || 0,
            capacity: parseInt(routeForm.capacity) || 40,
            morningStartTime: routeForm.morningStartTime || undefined,
            afternoonEndTime: routeForm.afternoonEndTime || undefined,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to create route");
        }
      } else if (dialogOpen === "editRoute") {
        const route = selectedItem as TransportRoute;
        const response = await fetch("/api/transport/routes", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            routeId: route.id,
            ...routeForm,
            distance: parseFloat(routeForm.distance) || undefined,
            estimatedTime: parseInt(routeForm.estimatedTime) || undefined,
            fee: parseFloat(routeForm.fee) || undefined,
            capacity: parseInt(routeForm.capacity) || undefined,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to update route");
        }
      } else if (dialogOpen === "addVehicle") {
        const response = await fetch("/api/transport/vehicles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(vehicleForm),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to create vehicle");
        }
      } else if (dialogOpen === "editVehicle") {
        const vehicle = selectedItem as Vehicle;
        const response = await fetch("/api/transport/vehicles", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vehicleId: vehicle.id,
            ...vehicleForm,
            seatingCapacity: parseInt(vehicleForm.seatingCapacity) || undefined,
            year: vehicleForm.year ? parseInt(vehicleForm.year) : undefined,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to update vehicle");
        }
      } else if (dialogOpen === "addDriver") {
        const response = await fetch("/api/transport/drivers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(driverForm),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to create driver");
        }
      } else if (dialogOpen === "editDriver") {
        const driver = selectedItem as Driver;
        const response = await fetch("/api/transport/drivers", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            driverId: driver.id,
            ...driverForm,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to update driver");
        }
      } else if (dialogOpen === "allocate") {
        const response = await fetch("/api/transport/allocations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(allocationForm),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to allocate student");
        }
      }

      closeDialog();
      await fetchTransportData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete handlers
  const handleDelete = async (type: "route" | "vehicle" | "driver", id: string) => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;

    try {
      const response = await fetch(`/api/transport/${type}s?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to delete ${type}`);
      }

      await fetchTransportData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  // Filter helpers
  const filteredRoutes = routes.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.routeNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredVehicles = vehicles.filter((v) =>
    v.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.vehicleType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDrivers = drivers.filter((d) =>
    d.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.lastName && d.lastName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    d.phone.includes(searchQuery)
  );

  const filteredAllocations = allocations.filter((a) =>
    a.student?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.student?.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.route?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (time: string) => {
    if (!time) return "--:--";
    try {
      const [hours, minutes] = time.split(":");
      const h = parseInt(hours);
      const ampm = h >= 12 ? "PM" : "AM";
      const h12 = h % 12 || 12;
      return `${h12}:${minutes} ${ampm}`;
    } catch {
      return time;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Bus className="w-8 h-8 text-violet-600" />
            Transport Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage school buses, routes, drivers, and student allocations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                <Navigation className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalRoutes}</p>
                <p className="text-xs text-gray-600">Total Routes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.activeRoutes}</p>
                <p className="text-xs text-gray-600">Active Routes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Car className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalVehicles}</p>
                <p className="text-xs text-gray-600">Total Vehicles</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                <Bus className="w-5 h-5 text-cyan-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.activeVehicles}</p>
                <p className="text-xs text-gray-600">Active Vehicles</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDrivers}</p>
                <p className="text-xs text-gray-600">Drivers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalAllocations}</p>
                <p className="text-xs text-gray-600">Allocations</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <TabsList className="grid w-full sm:w-auto grid-cols-2 lg:grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="routes">Routes</TabsTrigger>
            <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
            <TabsTrigger value="drivers">Drivers</TabsTrigger>
            <TabsTrigger value="allocations">Allocations</TabsTrigger>
          </TabsList>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Routes Summary */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Active Routes</CardTitle>
                  <CardDescription>Currently operating bus routes</CardDescription>
                </div>
                <Button
                  size="sm"
                  onClick={() => openDialog("addRoute")}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Route
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {routes.filter((r) => r.isActive).slice(0, 5).map((route) => (
                    <div
                      key={route.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          Route {route.routeNumber} - {route.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {route.startLocation} to {route.endLocation}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">
                          {route.currentStudents || 0}/{route.capacity || 0}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {routes.filter((r) => r.isActive).length === 0 && (
                    <p className="text-center text-gray-500 py-4">No active routes</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Vehicles Summary */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Active Vehicles</CardTitle>
                  <CardDescription>Currently in service</CardDescription>
                </div>
                <Button
                  size="sm"
                  onClick={() => openDialog("addVehicle")}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Vehicle
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {vehicles.filter((v) => v.status === "active").slice(0, 5).map((vehicle) => (
                    <div
                      key={vehicle.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {vehicle.registrationNumber}
                        </p>
                        <p className="text-sm text-gray-600">
                          {vehicle.vehicleType} {vehicle.make && `- ${vehicle.make}`}
                        </p>
                      </div>
                      <div>
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </div>
                    </div>
                  ))}
                  {vehicles.filter((v) => v.status === "active").length === 0 && (
                    <p className="text-center text-gray-500 py-4">No active vehicles</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Routes Tab */}
        <TabsContent value="routes">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Transport Routes</CardTitle>
                <CardDescription>Manage bus routes and schedules</CardDescription>
              </div>
              <Button onClick={() => openDialog("addRoute")}>
                <Plus className="w-4 h-4 mr-2" />
                Add Route
              </Button>
            </CardHeader>
            <CardContent>
              {filteredRoutes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Navigation className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p>No routes found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredRoutes.map((route) => (
                    <div
                      key={route.id}
                      className="border rounded-lg p-4 hover:border-violet-300 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">
                              Route {route.routeNumber} - {route.name}
                            </h3>
                            {route.isActive ? (
                              <Badge className="bg-green-100 text-green-800">Active</Badge>
                            ) : (
                              <Badge variant="outline">Inactive</Badge>
                            )}
                          </div>
                          <p className="text-gray-600 mb-3">
                            {route.startLocation} to {route.endLocation}
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Distance:</span>{" "}
                              <span className="font-medium">{route.distance || 0} km</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Duration:</span>{" "}
                              <span className="font-medium">{route.estimatedTime || 0} mins</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Fee:</span>{" "}
                              <span className="font-medium">Nu. {route.fee || 0}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Students:</span>{" "}
                              <span className="font-medium">
                                {route.currentStudents || 0}/{route.capacity || 0}
                              </span>
                            </div>
                          </div>
                          {route.vehicle && (
                            <div className="mt-3 text-sm flex items-center gap-2">
                              <Car className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-600">
                                {route.vehicle.registrationNumber} - {route.vehicle.vehicleType}
                              </span>
                              {route.vehicle.driverName && (
                                <>
                                  <span>•</span>
                                  <User className="w-4 h-4 text-gray-500" />
                                  <span className="text-gray-600">{route.vehicle.driverName}</span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openDialog("editRoute", route)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete("route", route.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vehicles Tab */}
        <TabsContent value="vehicles">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Transport Vehicles</CardTitle>
                <CardDescription>Manage school buses and vehicles</CardDescription>
              </div>
              <Button onClick={() => openDialog("addVehicle")}>
                <Plus className="w-4 h-4 mr-2" />
                Add Vehicle
              </Button>
            </CardHeader>
            <CardContent>
              {filteredVehicles.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Car className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p>No vehicles found</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {filteredVehicles.map((vehicle) => (
                    <div
                      key={vehicle.id}
                      className="border rounded-lg p-4 hover:border-violet-300 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{vehicle.registrationNumber}</h3>
                            <Badge
                              className={
                                vehicle.status === "active"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }
                            >
                              {vehicle.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            {vehicle.vehicleType} {vehicle.make && `(${vehicle.make} ${vehicle.model || ""}`.trim()}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openDialog("editVehicle", vehicle)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete("vehicle", vehicle.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500">Capacity:</span>{" "}
                          <span className="font-medium">{vehicle.capacity || 0}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">AC:</span>{" "}
                          <span className="font-medium">{vehicle.hasAC ? "Yes" : "No"}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">CCTV:</span>{" "}
                          <span className="font-medium">{vehicle.hasCCTV ? "Yes" : "No"}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">GPS:</span>{" "}
                          <span className="font-medium">{vehicle.hasGPS ? "Yes" : "No"}</span>
                        </div>
                      </div>
                      {vehicle.driverName && (
                        <div className="mt-3 pt-3 border-t flex items-center gap-2 text-sm">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-600">{vehicle.driverName}</span>
                          {vehicle.driverPhone && (
                            <>
                              <span>•</span>
                              <Phone className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-600">{vehicle.driverPhone}</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Drivers Tab */}
        <TabsContent value="drivers">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Transport Drivers</CardTitle>
                <CardDescription>Manage bus driver information</CardDescription>
              </div>
              <Button onClick={() => openDialog("addDriver")}>
                <Plus className="w-4 h-4 mr-2" />
                Add Driver
              </Button>
            </CardHeader>
            <CardContent>
              {filteredDrivers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <User className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p>No drivers found</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {filteredDrivers.map((driver) => (
                    <div
                      key={driver.id}
                      className="border rounded-lg p-4 hover:border-violet-300 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">
                              {driver.firstName} {driver.lastName || ""}
                            </h3>
                            <Badge
                              className={
                                driver.status === "active"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }
                            >
                              {driver.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{driver.phone}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openDialog("editDriver", driver)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete("driver", driver.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-500">License:</span>{" "}
                          <span className="font-medium">{driver.licenseNumber}</span>
                          {driver.licenseType && <span className="text-gray-500"> ({driver.licenseType})</span>}
                        </div>
                        {driver.badgeNumber && (
                          <div>
                            <span className="text-gray-500">Badge:</span>{" "}
                            <span className="font-medium">{driver.badgeNumber}</span>
                          </div>
                        )}
                        {driver.assignedVehicles !== undefined && (
                          <div>
                            <span className="text-gray-500">Assigned Vehicles:</span>{" "}
                            <span className="font-medium">{driver.assignedVehicles}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Allocations Tab */}
        <TabsContent value="allocations">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Student Allocations</CardTitle>
                <CardDescription>Manage student transport assignments</CardDescription>
              </div>
              <Button onClick={() => openDialog("allocate")}>
                <Plus className="w-4 h-4 mr-2" />
                Allocate Student
              </Button>
            </CardHeader>
            <CardContent>
              {filteredAllocations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p>No allocations found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Student</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Route</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Pickup</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Drop</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Fee</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAllocations.map((allocation) => (
                        <tr key={allocation.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium">
                                {allocation.student?.firstName} {allocation.student?.lastName}
                              </p>
                              <p className="text-sm text-gray-500">
                                Class {allocation.student?.classGrade}
                                {allocation.student?.section && `-${allocation.student.section}`}
                              </p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium">{allocation.route?.name}</p>
                              <p className="text-sm text-gray-500">
                                Route {allocation.route?.routeNumber}
                              </p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1 text-sm">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span>{formatTime(allocation.pickupTime)}</span>
                            </div>
                            <p className="text-sm text-gray-500">{allocation.stopName}</p>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1 text-sm">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span>{formatTime(allocation.dropTime)}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-medium">Nu. {allocation.fee}</span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {allocation.isPaid ? (
                                <Badge className="bg-green-100 text-green-800">Paid</Badge>
                              ) : (
                                <Badge variant="outline">Unpaid</Badge>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                fetch(`/api/transport/allocations?id=${allocation.id}`, {
                                  method: "DELETE",
                                }).then(() => fetchTransportData());
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Route Dialog */}
      <Dialog open={dialogOpen === "addRoute" || dialogOpen === "editRoute"} onOpenChange={closeDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogOpen === "addRoute" ? "Add New Route" : "Edit Route"}
            </DialogTitle>
            <DialogDescription>
              Configure bus route details and schedule
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="routeNumber">Route Number *</Label>
                <Input
                  id="routeNumber"
                  value={routeForm.routeNumber}
                  onChange={(e) => setRouteForm({ ...routeForm, routeNumber: e.target.value })}
                  placeholder="R1"
                />
              </div>
              <div>
                <Label htmlFor="routeName">Route Name *</Label>
                <Input
                  id="routeName"
                  value={routeForm.name}
                  onChange={(e) => setRouteForm({ ...routeForm, name: e.target.value })}
                  placeholder="Thimphu City Route"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startLocation">Start Location *</Label>
                <Input
                  id="startLocation"
                  value={routeForm.startLocation}
                  onChange={(e) => setRouteForm({ ...routeForm, startLocation: e.target.value })}
                  placeholder="Memorial Chorten"
                />
              </div>
              <div>
                <Label htmlFor="endLocation">End Location *</Label>
                <Input
                  id="endLocation"
                  value={routeForm.endLocation}
                  onChange={(e) => setRouteForm({ ...routeForm, endLocation: e.target.value })}
                  placeholder="School Campus"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="distance">Distance (km)</Label>
                <Input
                  id="distance"
                  type="number"
                  value={routeForm.distance}
                  onChange={(e) => setRouteForm({ ...routeForm, distance: e.target.value })}
                  placeholder="10"
                />
              </div>
              <div>
                <Label htmlFor="estimatedTime">Duration (mins)</Label>
                <Input
                  id="estimatedTime"
                  type="number"
                  value={routeForm.estimatedTime}
                  onChange={(e) => setRouteForm({ ...routeForm, estimatedTime: e.target.value })}
                  placeholder="30"
                />
              </div>
              <div>
                <Label htmlFor="fee">Monthly Fee (Nu.)</Label>
                <Input
                  id="fee"
                  type="number"
                  value={routeForm.fee}
                  onChange={(e) => setRouteForm({ ...routeForm, fee: e.target.value })}
                  placeholder="500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={routeForm.capacity}
                  onChange={(e) => setRouteForm({ ...routeForm, capacity: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="vehicleId">Assign Vehicle</Label>
                <Select
                  value={routeForm.vehicleId}
                  onValueChange={(value) => setRouteForm({ ...routeForm, vehicleId: value })}
                >
                  <SelectTrigger id="vehicleId">
                    <SelectValue placeholder="Select vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No vehicle assigned</SelectItem>
                    {vehicles.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.registrationNumber} - {v.vehicleType}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="morningStartTime">Morning Pickup Time</Label>
                <Input
                  id="morningStartTime"
                  type="time"
                  value={routeForm.morningStartTime}
                  onChange={(e) => setRouteForm({ ...routeForm, morningStartTime: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="afternoonEndTime">Afternoon Drop Time</Label>
                <Input
                  id="afternoonEndTime"
                  type="time"
                  value={routeForm.afternoonEndTime}
                  onChange={(e) => setRouteForm({ ...routeForm, afternoonEndTime: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {dialogOpen === "addRoute" ? "Create Route" : "Update Route"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Vehicle Dialog */}
      <Dialog open={dialogOpen === "addVehicle" || dialogOpen === "editVehicle"} onOpenChange={closeDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogOpen === "addVehicle" ? "Add New Vehicle" : "Edit Vehicle"}
            </DialogTitle>
            <DialogDescription>
              Register and configure transport vehicle
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="registrationNumber">Registration Number *</Label>
                <Input
                  id="registrationNumber"
                  value={vehicleForm.registrationNumber}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, registrationNumber: e.target.value })}
                  placeholder="BP-1-1234"
                />
              </div>
              <div>
                <Label htmlFor="vehicleNumber">Vehicle Number</Label>
                <Input
                  id="vehicleNumber"
                  value={vehicleForm.vehicleNumber}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleNumber: e.target.value })}
                  placeholder="Optional internal number"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="vehicleType">Vehicle Type *</Label>
                <Select
                  value={vehicleForm.vehicleType}
                  onValueChange={(value) => setVehicleForm({ ...vehicleForm, vehicleType: value })}
                >
                  <SelectTrigger id="vehicleType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bus">Bus</SelectItem>
                    <SelectItem value="Minibus">Minibus</SelectItem>
                    <SelectItem value="Van">Van</SelectItem>
                    <SelectItem value="Coach">Coach</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="make">Make</Label>
                <Input
                  id="make"
                  value={vehicleForm.make}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, make: e.target.value })}
                  placeholder="Tata"
                />
              </div>
              <div>
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  value={vehicleForm.model}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })}
                  placeholder="Starbus"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  type="number"
                  value={vehicleForm.year}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, year: e.target.value })}
                  placeholder="2020"
                />
              </div>
              <div>
                <Label htmlFor="seatingCapacity">Seating Capacity *</Label>
                <Input
                  id="seatingCapacity"
                  type="number"
                  value={vehicleForm.seatingCapacity}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, seatingCapacity: e.target.value })}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={vehicleForm.hasAC}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, hasAC: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">AC Available</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={vehicleForm.hasCCTV}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, hasCCTV: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">CCTV Installed</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={vehicleForm.hasGPS}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, hasGPS: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">GPS Tracking</span>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="driverName">Driver Name</Label>
                <Input
                  id="driverName"
                  value={vehicleForm.driverName}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, driverName: e.target.value })}
                  placeholder="Auto-assigned from driver records"
                />
              </div>
              <div>
                <Label htmlFor="driverPhone">Driver Phone</Label>
                <Input
                  id="driverPhone"
                  value={vehicleForm.driverPhone}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, driverPhone: e.target.value })}
                  placeholder="+975 17 123 456"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="conductorName">Conductor Name</Label>
                <Input
                  id="conductorName"
                  value={vehicleForm.conductorName}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, conductorName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="conductorPhone">Conductor Phone</Label>
                <Input
                  id="conductorPhone"
                  value={vehicleForm.conductorPhone}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, conductorPhone: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {dialogOpen === "addVehicle" ? "Add Vehicle" : "Update Vehicle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Driver Dialog */}
      <Dialog open={dialogOpen === "addDriver" || dialogOpen === "editDriver"} onOpenChange={closeDialog}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogOpen === "addDriver" ? "Add New Driver" : "Edit Driver"}
            </DialogTitle>
            <DialogDescription>
              Register transport driver information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={driverForm.firstName}
                  onChange={(e) => setDriverForm({ ...driverForm, firstName: e.target.value })}
                  placeholder="Karma"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={driverForm.lastName}
                  onChange={(e) => setDriverForm({ ...driverForm, lastName: e.target.value })}
                  placeholder="Wangyel"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                value={driverForm.phone}
                onChange={(e) => setDriverForm({ ...driverForm, phone: e.target.value })}
                placeholder="+975 17 123 456"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="licenseNumber">License Number *</Label>
                <Input
                  id="licenseNumber"
                  value={driverForm.licenseNumber}
                  onChange={(e) => setDriverForm({ ...driverForm, licenseNumber: e.target.value })}
                  placeholder="DL-12345"
                />
              </div>
              <div>
                <Label htmlFor="licenseType">License Type</Label>
                <Select
                  value={driverForm.licenseType}
                  onValueChange={(value) => setDriverForm({ ...driverForm, licenseType: value })}
                >
                  <SelectTrigger id="licenseType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Light">Light Vehicle</SelectItem>
                    <SelectItem value="Heavy">Heavy Vehicle</SelectItem>
                    <SelectItem value="Public">Public Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="licenseExpiry">License Expiry</Label>
                <Input
                  id="licenseExpiry"
                  type="date"
                  value={driverForm.licenseExpiry}
                  onChange={(e) => setDriverForm({ ...driverForm, licenseExpiry: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="badgeNumber">Badge Number</Label>
                <Input
                  id="badgeNumber"
                  value={driverForm.badgeNumber}
                  onChange={(e) => setDriverForm({ ...driverForm, badgeNumber: e.target.value })}
                  placeholder="BD-123"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="employeeId">Employee ID</Label>
              <Input
                id="employeeId"
                value={driverForm.employeeId}
                onChange={(e) => setDriverForm({ ...driverForm, employeeId: e.target.value })}
                placeholder="EMP-001"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {dialogOpen === "addDriver" ? "Add Driver" : "Update Driver"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Allocate Student Dialog */}
      <Dialog open={dialogOpen === "allocate"} onOpenChange={closeDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Allocate Transport to Student</DialogTitle>
            <DialogDescription>
              Assign a student to a transport route
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="studentId">Student *</Label>
              <Select
                value={allocationForm.studentId}
                onValueChange={(value) => setAllocationForm({ ...allocationForm, studentId: value })}
              >
                <SelectTrigger id="studentId">
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} - Class {s.classGrade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="allocatedRouteId">Route *</Label>
              <Select
                value={allocationForm.routeId}
                onValueChange={(value) => setAllocationForm({ ...allocationForm, routeId: value })}
              >
                <SelectTrigger id="allocatedRouteId">
                  <SelectValue placeholder="Select route" />
                </SelectTrigger>
                <SelectContent>
                  {routes.filter((r) => r.isActive).map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      Route {r.routeNumber} - {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="stopName">Pickup Point *</Label>
              <Input
                id="stopName"
                value={allocationForm.stopName}
                onChange={(e) => setAllocationForm({ ...allocationForm, stopName: e.target.value })}
                placeholder="Memorial Chorten"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pickupTime">Pickup Time *</Label>
                <Input
                  id="pickupTime"
                  type="time"
                  value={allocationForm.pickupTime}
                  onChange={(e) => setAllocationForm({ ...allocationForm, pickupTime: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="dropTime">Drop Time *</Label>
                <Input
                  id="dropTime"
                  type="time"
                  value={allocationForm.dropTime}
                  onChange={(e) => setAllocationForm({ ...allocationForm, dropTime: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Allocate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
