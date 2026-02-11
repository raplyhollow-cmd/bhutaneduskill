/**
 * COUNSELORS MANAGEMENT - CLIENT COMPONENT
 *
 * Client-side component with interactivity for counselor management.
 */

"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { UserCheck, Plus, Search, Mail, Phone, Users, MapPin, Edit, Eye } from "lucide-react";
import { fetchCounselors } from "../_actions";

interface Counselor {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  assignedSchools: string[];
  totalStudents: number;
  isActive: boolean;
}

interface CounselorsClientProps {
  initialCounselors: Counselor[];
  initialTotal: number;
}

export function CounselorsClient({ initialCounselors, initialTotal }: CounselorsClientProps) {
  const [counselors, setCounselors] = useState<Counselor[]>(initialCounselors);
  const [total, setTotal] = useState(initialTotal);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const filtered = counselors.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const data = await fetchCounselors({ limit: 100, offset: 0 });
      setCounselors(data.counselors);
      setTotal(data.total);
    } catch (error) {
      console.error("Failed to refresh counselors:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Counselors Management</h1>
          <p className="text-gray-600">{total} counselors</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            Refresh
          </Button>
          <Button
            style={{
              background: 'linear-gradient(135deg, rgb(139 92 246) 0%, rgb(124 58 237) 100%)',
            color: 'white'
            }}
            onClick={() => setShowAssignModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" />Assign Counselor
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{counselors.length}</p>
                <p className="text-sm text-gray-500">Total Counselors</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {counselors.reduce((s, c) => s + (c.totalStudents || 0), 0)}
                </p>
                <p className="text-sm text-gray-500">Students Assigned</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {counselors.reduce((s, c) => s + (c.assignedSchools?.length || 0), 0)}
                </p>
                <p className="text-sm text-gray-500">Schools Covered</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search counselors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {filtered.map((c) => (
              <Card key={c.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4 mb-4">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold"
                      style={{
                        background: 'linear-gradient(135deg, rgb(139 92 246) 0%, rgb(124 58 237) 100%)'
                      }}
                    >
                      {c.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{c.name}</h3>
                      <Badge className={c.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
                        {c.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-4 h-4" />{c.email}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-4 h-4" />{c.phone}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Users className="w-4 h-4" />{c.totalStudents || 0} students
                    </div>
                  </div>
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-2">Assigned Schools</p>
                    <div className="flex flex-wrap gap-1">
                      {c.assignedSchools?.map((s) => (
                        <Badge key={s} variant="outline">{s}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="w-4 h-4 mr-1" />View
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit className="w-4 h-4 mr-1" />Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl max-w-lg w-full p-6">
            <h2 className="text-xl font-bold mb-4">Assign Counselor to School</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Counselor</label>
                <select className="w-full px-3 py-2 border rounded-lg">
                  <option>Select counselor</option>
                  {counselors.map((c) => (
                    <option key={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">School</label>
                <select className="w-full px-3 py-2 border rounded-lg">
                  <option>Select school</option>
                  <option>Thimphu HSS</option>
                  <option>Yangchenphug HSS</option>
                  <option>Moi HSS</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Is Primary School?</label>
                <select className="w-full px-3 py-2 border rounded-lg">
                  <option>Yes</option>
                  <option>No</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowAssignModal(false)}>
                Cancel
              </Button>
              <Button
                style={{
                  background: 'linear-gradient(135deg, rgb(139 92 246) 0%, rgb(124 58 237) 100%)',
                  color: 'white'
                }}
              >
                Assign
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
