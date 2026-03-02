/**
 * SCHOOL ADMIN - TEACHERS MANAGEMENT
 *
 * Premium compact list view
 */

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  Loader2,
  Sparkles,
  Check,
  X,
  Square,
  Trash2,
  Building2,
  UserCheck,
  UserX,
  MoreHorizontal,
} from "lucide-react";
import { AddTeacherModal } from "@/components/school-admin/add-teacher-modal";
import { ExpressAddModal, useExpressAdd } from "@/components/ui/express-add-modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface Teacher {
  id: string;
  firstName: string | null;
  lastName: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  employeeId: string | null;
  subjects: string[] | null;
  department?: string;
  isActive: boolean;
  classGrade?: string | null;
  section?: string | null;
}

export default function SchoolAdminTeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean }>({ open: false });
  const [assignDeptOpen, setAssignDeptOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState("");

  const quickAdd = useExpressAdd();

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/school-admin/teachers");
      if (response.ok) {
        const data = await response.json();
        setTeachers(data.data?.teachers || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdd = async (name: string): Promise<{ success: true } | { success: false; error: string }> => {
    const [first, ...rest] = name.trim().split(" ");
    const last = rest.join(" ") || "";
    const res = await fetch("/api/school-admin/teachers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: first,
        lastName: last || "Teacher",
        email: `${first.toLowerCase()}@school.edu`,
        phone: "",
        employeeId: `TCH${Date.now().toString().slice(-4)}`,
        department: "General",
        subjects: [],
      }),
    });
    if (res.ok) { await fetchTeachers(); return { success: true }; }
    const d = await res.json();
    return { success: false, error: d.error || "Failed" };
  };

  const departments = Array.from(new Set(teachers.map(t => t.department).filter(Boolean)));

  const filtered = teachers.filter(t => {
    const m = searchQuery === "" ||
      t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.employeeId?.toLowerCase().includes(searchQuery.toLowerCase());
    const d = departmentFilter === "all" || t.department === departmentFilter;
    return m && d;
  });

  const toggle = (id: string) => {
    setSelectedIds(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const toggleAll = () => {
    setSelectedIds(s => s.size === filtered.length ? new Set() : new Set(filtered.map(t => t.id)));
  };

  const allSelected = filtered.length > 0 && selectedIds.size === filtered.length;

  const bulkAction = async (action: string, value?: any) => {
    setIsProcessing(true);
    try {
      if (action === "delete") {
        await Promise.allSettled(Array.from(selectedIds).map(id => fetch(`/api/school-admin/teachers/${id}`, { method: "DELETE" })));
        setTeachers(p => p.filter(t => !selectedIds.has(t.id)));
      } else if (action === "department") {
        await Promise.allSettled(Array.from(selectedIds).map(id =>
          fetch(`/api/school-admin/teachers/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ department: value }),
          })
        ));
        await fetchTeachers();
      } else if (action === "status") {
        await Promise.allSettled(Array.from(selectedIds).map(id =>
          fetch(`/api/school-admin/teachers/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isActive: value }),
          })
        ));
        await fetchTeachers();
      }
      setSelectedIds(new Set());
      setDeleteDialog({ open: false });
      setAssignDeptOpen(false);
    } catch { alert("Action failed"); }
    setIsProcessing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
      </div>
    );
  }

  const getInitials = (f: string | null, l: string | null) => {
    const a = (f?.[0] || "") + (l?.[0] || "");
    return a.toUpperCase() || "T";
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Teachers</h1>
          <p className="text-xs text-gray-500">{teachers.length} total</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={quickAdd.open} className="h-8 text-xs">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Quick Add
          </Button>
          <Button size="sm" onClick={() => setIsAddModalOpen(true)} className="h-8 bg-violet-600 hover:bg-violet-700 text-xs">
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Teacher
          </Button>
        </div>
      </div>

      {/* Bulk Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between px-3 py-2 bg-violet-50 border border-violet-200 rounded-lg mb-3">
          <span className="text-sm font-medium text-violet-900">{selectedIds.size} selected</span>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" className="h-7 text-xs text-violet-700 hover:bg-violet-100" onClick={() => setSelectedIds(new Set())}>
              <X className="w-3.5 h-3.5 mr-1" /> Clear
            </Button>
            <Select onValueChange={(v) => { setSelectedDept(v); setAssignDeptOpen(true); }}>
              <SelectTrigger className="w-[110px] h-7 text-xs border-violet-200">
                <Building2 className="w-3 h-3 mr-1" /> Dept
              </SelectTrigger>
              <SelectContent>
                {departments.map(d => <SelectItem key={d} value={d || ""}>{d}</SelectItem>)}
                <SelectItem value="Science">Science</SelectItem>
                <SelectItem value="Mathematics">Mathematics</SelectItem>
                <SelectItem value="English">English</SelectItem>
                <SelectItem value="Dzongkha">Dzongkha</SelectItem>
                <SelectItem value="Social Studies">Social Studies</SelectItem>
                <SelectItem value="ICT">ICT</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" variant="ghost" className="h-7 text-xs text-violet-700 hover:bg-violet-100" onClick={() => bulkAction("status", false)}>
              <UserX className="w-3.5 h-3.5 mr-1" /> Disable
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs text-violet-700 hover:bg-violet-100" onClick={() => bulkAction("status", true)}>
              <UserCheck className="w-3.5 h-3.5 mr-1" /> Enable
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs text-red-600 hover:bg-red-50" onClick={() => setDeleteDialog({ open: true })}>
              <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
            </Button>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-2 pb-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search..." className="pl-8 h-9 text-sm border-gray-200" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="w-[140px] h-9 text-sm border-gray-200">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map(d => <SelectItem key={d} value={d || ""}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
        {filtered.length > 0 && (
          <button onClick={toggleAll} className="ml-auto flex items-center gap-1.5 px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
            {allSelected ? <Check className="w-4 h-4 text-violet-600" /> : <Square className="w-4 h-4 text-gray-400" />}
            {allSelected ? "Deselect All" : "Select All"}
          </button>
        )}
        <span className="text-xs text-gray-400">{filtered.length} of {teachers.length}</span>
      </div>

      {/* Table */}
      <div className="flex-1 border border-gray-200 rounded-xl overflow-hidden bg-white">
        {/* Header */}
        <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-50/80 border-b border-gray-200 text-xs font-medium text-gray-500">
          <div className="col-span-1"></div>
          <div className="col-span-3">Teacher</div>
          <div className="col-span-3">Email</div>
          <div className="col-span-2">Department</div>
          <div className="col-span-2">Classes</div>
          <div className="col-span-1 text-right">Status</div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-gray-100">
          {filtered.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
              {searchQuery || departmentFilter !== "all" ? "No results found" : "No teachers yet"}
            </div>
          ) : (
            filtered.map(teacher => {
              const selected = selectedIds.has(teacher.id);
              return (
                <div
                  key={teacher.id}
                  className={cn(
                    "grid grid-cols-12 gap-2 px-4 py-2.5 items-center text-sm transition-colors cursor-pointer group",
                    selected ? "bg-violet-50" : "hover:bg-gray-50"
                  )}
                  onClick={e => { if (!(e.target as HTMLElement).closest("button")) toggle(teacher.id); }}
                >
                  <div className="col-span-1" onClick={e => { e.stopPropagation(); toggle(teacher.id); }}>
                    <div className={cn(
                      "w-4 h-4 rounded border-2 flex items-center justify-center transition-all",
                      selected ? "bg-violet-600 border-violet-600" : "border-gray-300 group-hover:border-violet-400"
                    )}>
                      {selected && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                  <div className="col-span-3 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium" style={{ background: "linear-gradient(135deg, #8b5cf6, #7c3aed)" }}>
                      {getInitials(teacher.firstName, teacher.lastName)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{teacher.name}</p>
                      <p className="text-xs text-gray-400 font-mono">{teacher.employeeId || "-"}</p>
                    </div>
                  </div>
                  <div className="col-span-3 text-gray-600 truncate text-xs">{teacher.email || "-"}</div>
                  <div className="col-span-2">
                    {teacher.department ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-xs">
                        {teacher.department}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </div>
                  <div className="col-span-2 text-xs text-gray-500">
                    {teacher.subjects && teacher.subjects.length > 0 ? (
                      <span>{teacher.subjects.length} subject{teacher.subjects.length > 1 ? "s" : ""}</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>
                  <div className="col-span-1 text-right">
                    <span className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                      teacher.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                    )}>
                      {teacher.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={o => !o && setDeleteDialog({ open: false })}>
        <AlertDialogContent className="sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} teacher{selectedIds.size > 1 ? "s" : ""}?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-9 text-sm">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => bulkAction("delete")} className="h-9 text-sm bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Assign Dept Dialog */}
      <AlertDialog open={assignDeptOpen} onOpenChange={o => !o && setAssignDeptOpen(false)}>
        <AlertDialogContent className="sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Assign Department</AlertDialogTitle>
            <AlertDialogDescription>Assign {selectedIds.size} teacher{selectedIds.size > 1 ? "s" : ""} to <strong>{selectedDept}</strong>?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-9 text-sm">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => bulkAction("department", selectedDept)} className="h-9 text-sm">Assign</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AddTeacherModal open={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSuccess={() => { fetchTeachers(); setIsAddModalOpen(false); }} />
      <ExpressAddModal isOpen={quickAdd.isOpen} onClose={quickAdd.close} onSubmit={handleQuickAdd} title="Quick Add Teacher" placeholder="John Doe" successMessage="Teacher added!" icon={Plus} minLength={2} />
    </div>
  );
}
