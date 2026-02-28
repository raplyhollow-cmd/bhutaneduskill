"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Event {
  id: string;
  title: string;
  description: string;
  eventType: string;
  startDate: string;
  endDate: string;
  location: string;
  isAllDay: boolean;
  targetAudience: string[];
  status: string;
  requiresRegistration?: boolean;
  registeredCount?: number;
  createdAt: string;
  organizer?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface EventFormData {
  title: string;
  description: string;
  eventType: "academic" | "sports" | "cultural" | "holiday" | "exam" | "meeting" | "other";
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
  location: string;
  targetAudience: string[];
  requiresRegistration: boolean;
  maxParticipants?: number;
  color?: string;
  status: "upcoming" | "ongoing" | "completed" | "cancelled" | "draft";
}

export default function EventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [selectedEventType, setSelectedEventType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [formData, setFormData] = useState<EventFormData>({
    title: "",
    description: "",
    eventType: "academic",
    startDate: "",
    endDate: "",
    startTime: "09:00",
    endTime: "10:00",
    isAllDay: false,
    location: "",
    targetAudience: ["all"],
    requiresRegistration: false,
    status: "upcoming",
  });

  useEffect(() => {
    fetchEvents();
  }, [selectedEventType, selectedStatus]);

  async function fetchEvents() {
    try {
      const params = new URLSearchParams();
      if (selectedEventType !== "all") params.append("eventType", selectedEventType);
      if (selectedStatus !== "all") params.append("status", selectedStatus);
      params.append("includeDraft", "true");

      const response = await fetch(`/api/events?${params.toString()}`);
      const data = await response.json();
      if (data.success) {
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error("Failed to fetch events:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const url = editingEvent
        ? `/api/events?id=${editingEvent.id}`
        : "/api/events";
      const method = editingEvent ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        setShowModal(false);
        setEditingEvent(null);
        setFormData({
          title: "",
          description: "",
          eventType: "academic",
          startDate: "",
          endDate: "",
          startTime: "09:00",
          endTime: "10:00",
          isAllDay: false,
          location: "",
          targetAudience: ["all"],
          requiresRegistration: false,
          status: "upcoming",
        });
        fetchEvents();
      } else {
        alert(data.error || "Failed to save event");
      }
    } catch (error) {
      console.error("Failed to save event:", error);
      alert("Failed to save event");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      const response = await fetch(`/api/events?id=${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (data.success) {
        fetchEvents();
      } else {
        alert(data.error || "Failed to delete event");
      }
    } catch (error) {
      console.error("Failed to delete event:", error);
      alert("Failed to delete event");
    }
  }

  function openEditModal(event: Event) {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      eventType: event.eventType as "academic" | "sports" | "cultural" | "holiday" | "exam" | "meeting" | "other",
      startDate: event.startDate,
      endDate: event.endDate,
      startTime: "09:00",
      endTime: "10:00",
      isAllDay: event.isAllDay,
      location: event.location,
      targetAudience: event.targetAudience,
      requiresRegistration: event.requiresRegistration || false,
      status: event.status as "upcoming" | "ongoing" | "completed" | "cancelled" | "draft",
    });
    setShowModal(true);
  }

  function getEventTypeColor(eventType: string): string {
    const colors: Record<string, string> = {
      academic: "bg-blue-100 text-blue-800",
      sports: "bg-green-100 text-green-800",
      cultural: "bg-purple-100 text-purple-800",
      holiday: "bg-red-100 text-red-800",
      exam: "bg-amber-100 text-amber-800",
      meeting: "bg-gray-100 text-gray-800",
      other: "bg-indigo-100 text-indigo-800",
    };
    return colors[eventType] || colors.other;
  }

  function getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      upcoming: "bg-blue-100 text-blue-800",
      ongoing: "bg-green-100 text-green-800",
      completed: "bg-gray-100 text-gray-800",
      cancelled: "bg-red-100 text-red-800",
      draft: "bg-amber-100 text-amber-800",
    };
    return colors[status] || colors.upcoming;
  }

  const stats = {
    total: events.length,
    upcoming: events.filter((e) => e.status === "upcoming").length,
    ongoing: events.filter((e) => e.status === "ongoing").length,
    withRegistration: events.filter((e) => e.requiresRegistration).length,
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Events Calendar</h1>
          <p className="text-gray-500">
            Create and manage school events, activities, and programs
          </p>
        </div>
        <button
          onClick={() => {
            setEditingEvent(null);
            setShowModal(true);
          }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Create Event
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total Events" value={stats.total} color="bg-gray-100" />
        <StatCard label="Upcoming" value={stats.upcoming} color="bg-blue-50" />
        <StatCard label="Ongoing" value={stats.ongoing} color="bg-green-50" />
        <StatCard
          label="Requires RSVP"
          value={stats.withRegistration}
          color="bg-purple-50"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Event Type:</label>
          <select
            value={selectedEventType}
            onChange={(e) => setSelectedEventType(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="all">All Types</option>
            <option value="academic">Academic</option>
            <option value="sports">Sports</option>
            <option value="cultural">Cultural</option>
            <option value="holiday">Holiday</option>
            <option value="exam">Exam</option>
            <option value="meeting">Meeting</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Status:</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="all">All Status</option>
            <option value="upcoming">Upcoming</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Events List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading events...</div>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No events found. Create your first event to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onEdit={() => openEditModal(event)}
              onDelete={() => handleDelete(event.id)}
              getEventTypeColor={getEventTypeColor}
              getStatusColor={getStatusColor}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">
                {editingEvent ? "Edit Event" : "Create New Event"}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Event title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                  placeholder="Event description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Event Type *</label>
                  <select
                    required
                    value={formData.eventType}
                    onChange={(e) => setFormData({ ...formData, eventType: e.target.value as "academic" | "sports" | "cultural" | "holiday" | "exam" | "meeting" | "other" })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="academic">Academic</option>
                    <option value="sports">Sports</option>
                    <option value="cultural">Cultural</option>
                    <option value="holiday">Holiday</option>
                    <option value="exam">Exam</option>
                    <option value="meeting">Meeting</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as "upcoming" | "ongoing" | "completed" | "cancelled" | "draft" })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isAllDay}
                    onChange={(e) => setFormData({ ...formData, isAllDay: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">All day event</span>
                </label>
              </div>

              {!formData.isAllDay && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Start Time</label>
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">End Time</label>
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Event location or venue"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.requiresRegistration}
                    onChange={(e) => setFormData({ ...formData, requiresRegistration: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Requires registration</span>
                </label>
              </div>

              {formData.requiresRegistration && (
                <div>
                  <label className="block text-sm font-medium mb-1">Max Participants</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxParticipants || ""}
                    onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Leave empty for unlimited"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingEvent(null);
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  {editingEvent ? "Update Event" : "Create Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`${color} rounded-lg p-4`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );
}

function EventCard({
  event,
  onEdit,
  onDelete,
  getEventTypeColor,
  getStatusColor,
}: {
  event: Event;
  onEdit: () => void;
  onDelete: () => void;
  getEventTypeColor: (type: string) => string;
  getStatusColor: (status: string) => string;
}) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="bg-white border rounded-xl p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEventTypeColor(event.eventType)}`}>
            {event.eventType}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
            {event.status}
          </span>
        </div>
        {event.requiresRegistration && (
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {event.registeredCount || 0}
          </span>
        )}
      </div>

      <h3 className="font-semibold text-lg mb-2">{event.title}</h3>

      {event.description && (
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{event.description}</p>
      )}

      <div className="space-y-2 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{formatDate(event.startDate)}</span>
        </div>

        {event.location && (
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{event.location}</span>
          </div>
        )}

        {event.organizer && (
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>{event.organizer.firstName} {event.organizer.lastName}</span>
          </div>
        )}
      </div>

      <div className="flex gap-2 mt-4 pt-4 border-t">
        <button
          onClick={onEdit}
          className="flex-1 px-3 py-2 text-sm font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50"
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          className="flex-1 px-3 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
