/**
 * SCHOOL ADMIN - STUDENTS MANAGEMENT
 *
 * Features:
 * - List all students with filters
 * - Add new student
 * - Edit student details
 * - Bulk upload via CSV
 * - View student profile
 * - Enroll in classes
 *
 * Now using real database data via server actions.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Plus,
  Search,
  Filter,
  Upload,
  Download,
  Edit,
  Trash2,
  Eye,
  UserCheck,
  GraduationCap,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { StudentsClient } from "./students-client";

// Grade and section options
const gradeOptions = ["All", "PP", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const sectionOptions = ["All", "A", "B", "C", "D"];
const statusOptions = ["All", "Active", "Inactive"];
const feeStatusOptions = ["All", "Paid", "Partial", "Pending"];

export default async function SchoolAdminStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; grade?: string; section?: string; status?: string; feeStatus?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const search = params.search || "";
  const grade = params.grade || "All";
  const section = params.section || "All";
  const status = params.status || "All";
  const feeStatus = params.feeStatus || "All";

  // Note: Since this is a server component, we'll pass initial data
  // The client component will handle filtering with server actions
  return (
    <StudentsClient
      initialSearch={search}
      initialGrade={grade}
      initialSection={section}
      initialStatus={status}
      initialFeeStatus={feeStatus}
      gradeOptions={gradeOptions}
      sectionOptions={sectionOptions}
      statusOptions={statusOptions}
      feeStatusOptions={feeStatusOptions}
    />
  );
}
