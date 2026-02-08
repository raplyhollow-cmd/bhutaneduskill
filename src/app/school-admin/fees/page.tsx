/**
 * SCHOOL ADMIN - FEE MANAGEMENT
 */
"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Plus, Search, Receipt, AlertCircle, CheckCircle, Eye, Printer } from "lucide-react";

const mockFees = [
  { id: "FEE001", student: "Tashi Dorji", class: "Class 10 A", total: 45000, paid: 45000, pending: 0, status: "paid", lastPayment: "2025-01-15" },
  { id: "FEE002", student: "Karma Wangmo", class: "Class 10 B", total: 45000, paid: 30000, pending: 15000, status: "partial", lastPayment: "2025-01-20" },
  { id: "FEE003", student: "Pema Lhamo", class: "Class 11 A", total: 50000, paid: 0, pending: 50000, status: "pending", lastPayment: null },
];

export default function SchoolAdminFeesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  
  const filtered = mockFees.filter(f => {
    const matches = f.student.toLowerCase().includes(searchQuery.toLowerCase());
    const status = selectedStatus === "All" || f.status === selectedStatus;
    return matches && status;
  });

  const getStatusBadge = (status: string) => {
    const styles = { paid: "bg-green-100 text-green-700 border-green-200", partial: "bg-yellow-100 text-yellow-700 border-yellow-200", pending: "bg-red-100 text-red-700 border-red-200" };
    return styles[status as keyof typeof styles];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Fee Management</h1><p className="text-gray-600">{filtered.length} records</p></div>
        <Button className="bg-primary-600"><Plus className="w-4 h-4 mr-2" />Record Payment</Button>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center"><DollarSign className="w-6 h-6 text-green-600" /></div><div><p className="text-2xl font-bold">Nu. {mockFees.reduce((s,f) => s+f.paid,0).toLocaleString()}</p><p className="text-sm text-gray-500">Collected</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center"><AlertCircle className="w-6 h-6 text-red-600" /></div><div><p className="text-2xl font-bold">Nu. {mockFees.reduce((s,f) => s+f.pending,0).toLocaleString()}</p><p className="text-sm text-gray-500">Pending</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center"><CheckCircle className="w-6 h-6 text-blue-600" /></div><div><p className="text-2xl font-bold">{mockFees.filter(f => f.status === 'paid').length}</p><p className="text-sm text-gray-500">Fully Paid</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center"><Receipt className="w-6 h-6 text-purple-600" /></div><div><p className="text-2xl font-bold">{Math.round((mockFees.filter(f => f.status === 'paid').length/mockFees.length)*100)}%</p><p className="text-sm text-gray-500">Collection Rate</p></div></div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><Input placeholder="Search student..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" /></div>
            <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="px-3 py-2 border rounded-lg bg-white"><option value="All">All Status</option><option value="paid">Paid</option><option value="partial">Partial</option><option value="pending">Pending</option></select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b"><th className="text-left py-3 px-4">Student</th><th className="text-left py-3 px-4">Class</th><th className="text-left py-3 px-4">Total</th><th className="text-left py-3 px-4">Paid</th><th className="text-left py-3 px-4">Pending</th><th className="text-left py-3 px-4">Last Payment</th><th className="text-left py-3 px-4">Status</th><th className="text-right py-3 px-4">Actions</th></tr></thead>
              <tbody>
                {filtered.map(f => (
                  <tr key={f.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{f.student}</td><td className="py-3 px-4">{f.class}</td><td className="py-3 px-4">Nu. {f.total.toLocaleString()}</td><td className="py-3 px-4 text-green-600">Nu. {f.paid.toLocaleString()}</td><td className="py-3 px-4 text-red-600">Nu. {f.pending.toLocaleString()}</td><td className="py-3 px-4">{f.lastPayment || <span className="text-gray-400">-</span>}</td><td className="py-3 px-4"><Badge className={getStatusBadge(f.status)} variant="outline">{f.status}</Badge></td><td className="py-3 px-4 text-right"><div className="flex justify-end gap-1"><Button variant="outline" size="sm"><Receipt className="w-4 h-4" /></Button><Button variant="outline" size="sm"><Eye className="w-4 h-4" /></Button><Button variant="outline" size="sm"><Printer className="w-4 h-4" /></Button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
