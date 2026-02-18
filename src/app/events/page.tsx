"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

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
  registrationDeadline?: string;
  maxParticipants?: number;
  registeredCount?: number;
  userRegistration?: {
    id: string;
    status: string;
  };
  organizer?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

function EventsCalendarContent() {
  const searchParams = useSearchParams();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventType, setSelectedEventType] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "calendar">("grid");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [registeringEventId, setRegisteringEventId] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  useEffect(() => {
    fetchEvents();
  }, [selectedEventType, selectedMonth]);

  async function fetchEvents() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedEventType !== "all") params.append("eventType", selectedEventType);
      if (selectedMonth) params.append("start", selectedMonth);

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

  async function handleRegister(eventId: string) {
    setRegisteringEventId(eventId);
    try {
      const response = await fetch(`/api/events/${eventId}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });

      const data = await response.json();
      if (data.success) {
        alert("Successfully registered for the event!");
        fetchEvents();
      } else {
        alert(data.error || "Failed to register for event");
      }
    } catch (error) {
      console.error("Failed to register:", error);
      alert("Failed to register for event");
    } finally {
      setRegisteringEventId(null);
    }
  }

  async function handleCancelRegistration(eventId: string, registrationId: string) {
    if (!confirm("Are you sure you want to cancel your registration?")) return;

    try {
      const response = await fetch(`/api/events/${eventId}/register?registrationId=${registrationId}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (data.success) {
        alert("Registration cancelled successfully");
        fetchEvents();
      } else {
        alert(data.error || "Failed to cancel registration");
      }
    } catch (error) {
      console.error("Failed to cancel registration:", error);
      alert("Failed to cancel registration");
    }
  }

  function openEventDetail(event: Event) {
    setSelectedEvent(event);
    setShowDetailModal(true);
  }

  function getEventTypeColor(eventType: string): string {
    const colors: Record<string, string> = {
      academic: "bg-blue-100 text-blue-800 border-blue-200",
      sports: "bg-green-100 text-green-800 border-green-200",
      cultural: "bg-purple-100 text-purple-800 border-purple-200",
      holiday: "bg-red-100 text-red-800 border-red-200",
      exam: "bg-amber-100 text-amber-800 border-amber-200",
      meeting: "bg-gray-100 text-gray-800 border-gray-200",
      other: "bg-indigo-100 text-indigo-800 border-indigo-200",
    };
    return colors[eventType] || colors.other;
  }

  function getEventTypeIcon(eventType: string): string {
    const icons: Record<string, string> = {
      academic: "",
      sports: "",
      cultural: "",
      holiday: "",
      exam: "",
      meeting: "",
      other: "",
    };
    return icons[eventType] || icons.other;
  }

  const eventTypes = ["all", "academic", "sports", "cultural", "holiday", "exam", "meeting", "other"];

  // Group events by month for the calendar view
  const eventsByMonth = events.reduce((acc, event) => {
    const date = new Date(event.startDate);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (!acc[monthKey]) acc[monthKey] = [];
    acc[monthKey].push(event);
    return acc;
  }, {} as Record<string, Event[]>);

  const sortedMonths = Object.keys(eventsByMonth).sort();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">School Events Calendar</h1>
              <p className="text-gray-500 mt-1">
                Stay updated with upcoming school activities, exams, and celebrations
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("grid")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === "grid"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Grid View
              </button>
              <button
                onClick={() => setViewMode("calendar")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === "calendar"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Calendar View
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Event Type:</label>
              <select
                value={selectedEventType}
                onChange={(e) => setSelectedEventType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {eventTypes.map((type) => (
                  <option key={type} value={type}>
                    {type === "all" ? "All Events" : type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Month:</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="ml-auto text-sm text-gray-500">
              {events.length} event{events.length !== 1 ? "s" : ""} found
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent mb-4"></div>
              <p className="text-gray-500">Loading events...</p>
            </div>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No events found</h3>
            <p className="mt-2 text-gray-500">Try adjusting your filters to see more events.</p>
          </div>
        ) : viewMode === "grid" ? (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onRegister={handleRegister}
                onCancelRegistration={handleCancelRegistration}
                onViewDetails={() => openEventDetail(event)}
                registeringEventId={registeringEventId}
                getEventTypeColor={getEventTypeColor}
              />
            ))}
          </div>
        ) : (
          /* Calendar View (by month) */
          <div className="space-y-8">
            {sortedMonths.map((monthKey) => {
              const [year, month] = monthKey.split("-");
              const monthDate = new Date(parseInt(year), parseInt(month) - 1);
              const monthName = monthDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

              return (
                <div key={monthKey}>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">{monthName}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {eventsByMonth[monthKey].map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        onRegister={handleRegister}
                        onCancelRegistration={handleCancelRegistration}
                        onViewDetails={() => openEventDetail(event)}
                        registeringEventId={registeringEventId}
                        getEventTypeColor={getEventTypeColor}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Event Detail Modal */}
      {showDetailModal && selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedEvent(null);
          }}
          onRegister={handleRegister}
          onCancelRegistration={handleCancelRegistration}
          registeringEventId={registeringEventId}
          getEventTypeColor={getEventTypeColor}
        />
      )}
    </div>
  );
}

function EventCard({
  event,
  onRegister,
  onCancelRegistration,
  onViewDetails,
  registeringEventId,
  getEventTypeColor,
}: {
  event: Event;
  onRegister: (id: string) => void;
  onCancelRegistration: (eventId: string, registrationId: string) => void;
  onViewDetails: () => void;
  registeringEventId: string | null;
  getEventTypeColor: (type: string) => string;
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

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  const isRegistered = event.userRegistration?.status === "registered";
  const isFullyBooked = event.maxParticipants && event.registeredCount && event.registeredCount >= event.maxParticipants;
  const hasRegistrationDeadlinePassed = event.registrationDeadline && new Date(event.registrationDeadline) < new Date();

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100">
      {/* Event Type Badge */}
      <div className={`px-4 py-2 text-sm font-medium ${getEventTypeColor(event.eventType)}`}>
        {event.eventType.charAt(0).toUpperCase() + event.eventType.slice(1)}
      </div>

      <div className="p-5">
        <h3 className="font-semibold text-lg text-gray-900 mb-2">{event.title}</h3>

        {event.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{event.description}</p>
        )}

        <div className="space-y-2 text-sm text-gray-500 mb-4">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{formatDate(event.startDate)}</span>
            {!event.isAllDay && <span className="text-gray-400">at {formatTime(event.startDate)}</span>}
          </div>

          {event.location && (
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="truncate">{event.location}</span>
            </div>
          )}

          {event.requiresRegistration && (
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>
                {event.registeredCount || 0}
                {event.maxParticipants && ` / ${event.maxParticipants}`} registered
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onViewDetails}
            className="flex-1 px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            View Details
          </button>
          {event.requiresRegistration && !isRegistered && !isFullyBooked && !hasRegistrationDeadlinePassed && (
            <button
              onClick={() => onRegister(event.id)}
              disabled={registeringEventId === event.id}
              className="flex-1 px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {registeringEventId === event.id ? "Registering..." : "Register"}
            </button>
          )}
          {isRegistered && event.userRegistration && (
            <button
              onClick={() => onCancelRegistration(event.id, event.userRegistration!.id)}
              className="flex-1 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>

        {isFullyBooked && (
          <p className="text-xs text-amber-600 mt-2 text-center">Event is fully booked</p>
        )}
        {hasRegistrationDeadlinePassed && (
          <p className="text-xs text-red-600 mt-2 text-center">Registration deadline has passed</p>
        )}
      </div>
    </div>
  );
}

function EventDetailModal({
  event,
  onClose,
  onRegister,
  onCancelRegistration,
  registeringEventId,
  getEventTypeColor,
}: {
  event: Event;
  onClose: () => void;
  onRegister: (id: string) => void;
  onCancelRegistration: (eventId: string, registrationId: string) => void;
  registeringEventId: string | null;
  getEventTypeColor: (type: string) => string;
}) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  const isRegistered = event.userRegistration?.status === "registered";
  const isFullyBooked = event.maxParticipants && event.registeredCount && event.registeredCount >= event.maxParticipants;
  const hasRegistrationDeadlinePassed = event.registrationDeadline && new Date(event.registrationDeadline) < new Date();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className={`${getEventTypeColor(event.eventType)} px-6 py-4`}>
          <div className="flex items-start justify-between">
            <div>
              <span className="text-sm font-medium opacity-75">{event.eventType}</span>
              <h2 className="text-2xl font-bold">{event.title}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-black/10 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {event.description && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">About this event</h3>
              <p className="text-gray-700">{event.description}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date & Time</p>
                <p className="font-medium">{formatDate(event.startDate)}</p>
                {!event.isAllDay && <p className="text-sm text-gray-600">{formatTime(event.startDate)}</p>}
              </div>
            </div>

            {event.location && (
              <div className="flex items-start gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-medium">{event.location}</p>
                </div>
              </div>
            )}

            {event.requiresRegistration && (
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Registration</p>
                  <p className="font-medium">{event.registeredCount || 0} / {event.maxParticipants || "Unlimited"}</p>
                  {event.registrationDeadline && (
                    <p className="text-sm text-gray-600">Deadline: {new Date(event.registrationDeadline).toLocaleDateString()}</p>
                  )}
                </div>
              </div>
            )}

            {event.organizer && (
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Organizer</p>
                  <p className="font-medium">{event.organizer.firstName} {event.organizer.lastName}</p>
                </div>
              </div>
            )}
          </div>

          {/* Registration Actions */}
          {event.requiresRegistration && (
            <div className="pt-4 border-t">
              {isRegistered ? (
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <p className="font-medium text-green-900">You are registered for this event</p>
                    <p className="text-sm text-green-700">We look forward to seeing you there!</p>
                  </div>
                  <button
                    onClick={() => event.userRegistration && onCancelRegistration(event.id, event.userRegistration.id)}
                    className="px-4 py-2 text-sm font-medium text-red-600 bg-white rounded-lg hover:bg-red-50"
                  >
                    Cancel
                  </button>
                </div>
              ) : isFullyBooked ? (
                <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-lg">
                  <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="font-medium text-amber-900">This event is fully booked</p>
                </div>
              ) : hasRegistrationDeadlinePassed ? (
                <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="font-medium text-red-900">Registration deadline has passed</p>
                </div>
              ) : (
                <button
                  onClick={() => onRegister(event.id)}
                  disabled={registeringEventId === event.id}
                  className="w-full px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {registeringEventId === event.id ? "Registering..." : "Register for this event"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function EventsCalendarPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading events...</div>}>
      <EventsCalendarContent />
    </Suspense>
  );
}
