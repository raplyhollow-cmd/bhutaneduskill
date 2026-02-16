/**
 * Add Content Dropdown Component
 *
 * Client component that provides a dropdown menu for adding different content types.
 * Displays options for adding colleges, scholarships, and RUB programs.
 */

"use client";

import { useState } from "react";
import { Plus, GraduationCap, Award, BookOpen, ChevronDown } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function AddContentDropdown() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        style={{ background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }}
        className="text-white"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Content
        <ChevronDown className="w-4 h-4 ml-2" />
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <Link
            href="/admin/content/colleges"
            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors rounded-t-lg"
            onClick={() => setIsOpen(false)}
          >
            <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Add College</p>
              <p className="text-xs text-gray-500">RUB Colleges & Institutions</p>
            </div>
          </Link>

          <Link
            href="/admin/content/scholarships"
            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <div className="w-8 h-8 rounded bg-green-100 flex items-center justify-center">
              <Award className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Add Scholarship</p>
              <p className="text-xs text-gray-500">Financial aid & awards</p>
            </div>
          </Link>

          <Link
            href="/admin/content/programs"
            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors rounded-b-lg"
            onClick={() => setIsOpen(false)}
          >
            <div className="w-8 h-8 rounded bg-purple-100 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Add RUB Program</p>
              <p className="text-xs text-gray-500">Academic programs</p>
            </div>
          </Link>
        </div>
      )}

      {/* Close dropdown when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
