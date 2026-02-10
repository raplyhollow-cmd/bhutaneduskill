"use client";

import { useState } from "react";
import { AnnouncementData } from "@/app/school-admin/_actions";
import { AnnouncementCard } from "./announcement-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Search, Filter, ChevronDown, ChevronUp } from "lucide-react";

interface AnnouncementListProps {
  announcements: AnnouncementData[];
  total: number;
  isLoading?: boolean;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onTogglePin?: (id: string) => void;
  onRefresh?: () => void;
}

const priorityOptions = [
  { value: "", label: "All Priorities" },
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "normal", label: "Normal" },
  { value: "low", label: "Low" },
];

const statusOptions = [
  { value: "", label: "All Status" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
];

const categoryOptions = [
  { value: "", label: "All Categories" },
  { value: "general", label: "General" },
  { value: "academic", label: "Academic" },
  { value: "event", label: "Event" },
  { value: "holiday", label: "Holiday" },
  { value: "exam", label: "Exam" },
  { value: "emergency", label: "Emergency" },
];

export function AnnouncementList({
  announcements,
  total,
  isLoading = false,
  onView,
  onEdit,
  onDelete,
  onTogglePin,
  onRefresh,
}: AnnouncementListProps) {
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Filter announcements locally (for instant feedback)
  const filteredAnnouncements = announcements.filter((announcement) => {
    const matchesSearch =
      !search ||
      announcement.title.toLowerCase().includes(search.toLowerCase()) ||
      announcement.content.toLowerCase().includes(search.toLowerCase());

    const matchesPriority = !priorityFilter || announcement.priority === priorityFilter;

    const matchesStatus =
      !statusFilter ||
      (statusFilter === "published" && announcement.isPublished) ||
      (statusFilter === "draft" && !announcement.isPublished);

    const matchesCategory = !categoryFilter || announcement.category === categoryFilter;

    return matchesSearch && matchesPriority && matchesStatus && matchesCategory;
  });

  const hasActiveFilters = search || priorityFilter || statusFilter || categoryFilter;

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search announcements..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Toggle */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-1">
                    {[search, priorityFilter, statusFilter, categoryFilter].filter(Boolean).length}
                  </Badge>
                )}
                {showFilters ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>

              {onRefresh && (
                <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <span>Refresh</span>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Expandable Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t">
              <div>
                <label className="text-sm font-medium mb-2 block">Priority</label>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Category</label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          Showing {filteredAnnouncements.length} of {total} announcement{total !== 1 ? "s" : ""}
        </span>
        {hasActiveFilters && (
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0"
            onClick={() => {
              setSearch("");
              setPriorityFilter("");
              setStatusFilter("");
              setCategoryFilter("");
            }}
          >
            Clear all filters
          </Button>
        )}
      </div>

      {/* Announcements Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Filter className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No announcements found</h3>
            <p className="text-gray-500 max-w-sm">
              {hasActiveFilters
                ? "Try adjusting your filters or search terms"
                : "Get started by creating your first announcement"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredAnnouncements.map((announcement) => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
              onTogglePin={onTogglePin}
            />
          ))}
        </div>
      )}
    </div>
  );
}
