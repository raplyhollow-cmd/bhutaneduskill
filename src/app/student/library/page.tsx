"use client";

/**
 * STUDENT LIBRARY PAGE
 *
 * Students can:
 * - Browse the library catalog
 * - Search for books
 * - View their borrowed books
 * - Borrow new books
 * - Reserve unavailable books
 * - Renew borrowed books
 * - Return books
 * - Manage reservations
 */


import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Search,
  BookOpen,
  Calendar,
  Clock,
  Loader2,
  Bookmark,
  CheckCircle2,
  AlertCircle,
  Library,
  RefreshCw,
  DollarSign,
  Bell,
  X,
  Info,
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  publicationYear: number;
  category: string;
  coverImage: string;
  description: string;
  publisher: string;
  language: string;
  status: "available" | "borrowed" | "reserved" | "lost";
  isActive: boolean;
  totalPages: number;
}

interface CirculationRecord {
  id: string;
  bookId: string;
  borrowerId: string;
  borrowDate: string;
  dueDate: string;
  returnDate?: string;
  status: "borrowed" | "returned" | "overdue" | "lost";
  fine: number;
  finePaid: boolean;
  renewals: number;
  maxRenewals: number;
  book: {
    id: string;
    title: string;
    author: string;
    isbn: string;
    category: string;
    coverImage: string;
    publicationYear: number;
    status: string;
  };
  calculatedFine?: number;
  isOverdue?: boolean;
  daysOverdue?: number;
}

interface BookReservation {
  id: string;
  bookId: string;
  requesterId: string;
  requesterType: string;
  requesterName: string;
  reservationDate: string;
  expiryDate: string;
  notifiedDate?: string;
  status: "pending" | "ready" | "fulfilled" | "cancelled" | "expired";
  priority: number;
  notes?: string;
  book?: {
    id: string;
    title: string;
    author: string;
    isbn: string;
    coverImage: string;
  };
}

export default function StudentLibraryPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [myBorrows, setMyBorrows] = useState<CirculationRecord[]>([]);
  const [myReservations, setMyReservations] = useState<BookReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [activeTab, setActiveTab] = useState<"browse" | "borrowed" | "reservations">("browse");
  const [borrowing, setBorrowing] = useState<string | null>(null);
  const [reserving, setReserving] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [renewing, setRenewing] = useState<string | null>(null);
  const [returning, setReturning] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [booksRes, circulationRes, reservationsRes] = await Promise.all([
        fetch("/api/library/books"),
        fetch("/api/library/circulation?includeOverdue=true"),
        fetch("/api/library/reservations")
      ]);

      const booksData = await booksRes.json();
      const circulationData = await circulationRes.json();
      const reservationsData = await reservationsRes.json();

      if (booksData.success) {
        setBooks(booksData.data.books || []);
      }

      if (circulationData.success) {
        setMyBorrows(circulationData.data.circulation || []);
      }

      if (reservationsData.success) {
        setMyReservations(reservationsData.data.reservations || []);
      }
    } catch (error) {
      console.error("Error fetching library data:", error);
      showToast("Failed to load library data", "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Borrow a book
  const handleBorrow = async (bookId: string, borrowDays: number = 14) => {
    try {
      setBorrowing(bookId);

      const response = await fetch("/api/library/circulation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "borrow",
          bookId,
          borrowDays,
        }),
      });

      const data = await response.json();

      if (data.success) {
        showToast(`Book borrowed successfully! Due date: ${new Date(data.data.dueDate).toLocaleDateString()}`, "success");
        await fetchData();
        setSelectedBook(null);
      } else {
        showToast(data.error || "Failed to borrow book", "error");
      }
    } catch (error) {
      console.error("Error borrowing book:", error);
      showToast("Failed to borrow book. Please try again.", "error");
    } finally {
      setBorrowing(null);
    }
  };

  // Renew a book
  const handleRenew = async (circulationId: string) => {
    try {
      setRenewing(circulationId);

      const response = await fetch("/api/library/circulation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "renew",
          circulationId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        showToast(`Book renewed! New due date: ${new Date(data.data.newDueDate).toLocaleDateString()}`, "success");
        await fetchData();
      } else {
        showToast(data.error || "Failed to renew book", "error");
      }
    } catch (error) {
      console.error("Error renewing book:", error);
      showToast("Failed to renew book. Please try again.", "error");
    } finally {
      setRenewing(null);
    }
  };

  // Return a book
  const handleReturn = async (circulationId: string) => {
    try {
      setReturning(circulationId);

      const response = await fetch("/api/library/circulation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "return",
          circulationId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const fine = data.data.fine;
        if (fine > 0) {
          showToast(`Book returned with a fine of $${fine.toFixed(2)}`, "success");
        } else {
          showToast("Book returned successfully!", "success");
        }
        await fetchData();
      } else {
        showToast(data.error || "Failed to return book", "error");
      }
    } catch (error) {
      console.error("Error returning book:", error);
      showToast("Failed to return book. Please try again.", "error");
    } finally {
      setReturning(null);
    }
  };

  // Reserve a book
  const handleReserve = async (bookId: string) => {
    try {
      setReserving(bookId);

      const response = await fetch("/api/library/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId }),
      });

      const data = await response.json();

      if (data.success) {
        showToast(data.data.message || "Book reserved successfully!", "success");
        await fetchData();
        setSelectedBook(null);
      } else {
        showToast(data.error || "Failed to reserve book", "error");
      }
    } catch (error) {
      console.error("Error reserving book:", error);
      showToast("Failed to reserve book. Please try again.", "error");
    } finally {
      setReserving(null);
    }
  };

  // Cancel a reservation
  const handleCancelReservation = async (reservationId: string) => {
    try {
      setCancelling(reservationId);

      const response = await fetch("/api/library/reservations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: reservationId,
          action: "cancel",
        }),
      });

      const data = await response.json();

      if (data.success) {
        showToast("Reservation cancelled successfully", "success");
        await fetchData();
      } else {
        showToast(data.error || "Failed to cancel reservation", "error");
      }
    } catch (error) {
      console.error("Error cancelling reservation:", error);
      showToast("Failed to cancel reservation. Please try again.", "error");
    } finally {
      setCancelling(null);
    }
  };

  // Filter books by search
  const filteredBooks = books.filter((book) => {
    if (searchQuery === "") return true;
    const query = searchQuery.toLowerCase();
    return (
      book.title.toLowerCase().includes(query) ||
      book.author.toLowerCase().includes(query) ||
      book.isbn?.toLowerCase().includes(query) ||
      book.category?.toLowerCase().includes(query)
    );
  });

  // Get status badge config
  const getStatusBadge = (status: Book["status"]) => {
    const config = {
      available: { label: "Available", color: "bg-green-100 text-green-700 border-green-200" },
      borrowed: { label: "Borrowed", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
      reserved: { label: "Reserved", color: "bg-blue-100 text-blue-700 border-blue-200" },
      lost: { label: "Lost", color: "bg-red-100 text-red-700 border-red-200" },
    };
    return config[status] || config.available;
  };

  // Get circulation status
  const getCirculationStatus = (circulation: CirculationRecord) => {
    if (circulation.status === "returned") {
      return { label: "Returned", color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle2 };
    } else if (circulation.isOverdue || circulation.status === "overdue") {
      return { label: "Overdue", color: "bg-red-100 text-red-700 border-red-200", icon: AlertCircle };
    } else {
      return { label: "Borrowed", color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Bookmark };
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

  const getDaysUntilDue = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Calculate stats
  const stats = {
    totalBooks: books.length,
    availableBooks: books.filter((b) => b.status === "available").length,
    myBorrows: myBorrows.filter((b) => b.status === "borrowed").length,
    myReservations: myReservations.filter((r) => r.status === "pending" || r.status === "ready").length,
    overdue: myBorrows.filter((b) => b.isOverdue || b.status === "overdue").length,
    totalFines: myBorrows.reduce((sum, b) => sum + (b.calculatedFine || b.fine || 0), 0),
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
            toast.type === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === "success" ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Library className="w-8 h-8 text-orange-600" />
            Library
          </h1>
          <p className="text-gray-600 mt-1">
            Browse and borrow books from the school library
          </p>
        </div>
        <Button
          variant="outline"
          onClick={fetchData}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-500">
              Total Books
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.totalBooks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-500">
              Available
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.availableBooks}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-500">
              My Borrows
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.myBorrows}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-500">
              Overdue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.overdue}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-500">
              Outstanding Fines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600 flex items-center gap-1">
              <DollarSign className="w-5 h-5" />
              {stats.totalFines.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-3">
          <TabsTrigger value="browse">Browse Catalog</TabsTrigger>
          <TabsTrigger value="borrowed">
            My Borrowed Books
            {stats.myBorrows > 0 && (
              <Badge className="ml-2 bg-orange-600 text-white">
                {stats.myBorrows}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="reservations">
            My Reservations
            {stats.myReservations > 0 && (
              <Badge className="ml-2 bg-orange-600 text-white">
                {stats.myReservations}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Browse Tab */}
        <TabsContent value="browse" className="space-y-4">
          {/* Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Search by title, author, ISBN, or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Book Grid */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
            </div>
          ) : filteredBooks.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <BookOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Books Found</h3>
                <p className="text-gray-500">
                  {searchQuery
                    ? "No books match your search criteria."
                    : "No books available in the library."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredBooks.map((book) => {
                const statusBadge = getStatusBadge(book.status);

                return (
                  <Card
                    key={book.id}
                    className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => setSelectedBook(book)}
                  >
                    <div className="aspect-[3/4] bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
                      {book.coverImage ? (
                        <img
                          src={book.coverImage}
                          alt={book.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <BookOpen className="w-20 h-20 text-orange-300" />
                      )}
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 line-clamp-1 flex-1">
                          {book.title}
                        </h3>
                        <Badge className={statusBadge.color} variant="outline">
                          {statusBadge.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2 truncate">
                        {book.author}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Badge variant="outline" className="text-xs">
                          {book.category}
                        </Badge>
                        <span>{book.publicationYear}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Borrowed Tab */}
        <TabsContent value="borrowed">
          <Card>
            <CardHeader>
              <CardTitle>My Borrowed Books</CardTitle>
              <CardDescription>
                Books you have borrowed and their due dates
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
                </div>
              ) : myBorrows.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <BookOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p>You haven't borrowed any books yet.</p>
                  <Button
                    className="mt-4"
                    onClick={() => setActiveTab("browse")}
                  >
                    Browse Catalog
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {myBorrows.map((circulation) => {
                    const statusConfig = getCirculationStatus(circulation);
                    const book = circulation.book;
                    const daysUntilDue = circulation.dueDate ? getDaysUntilDue(circulation.dueDate) : 0;
                    const StatusIcon = statusConfig.icon;

                    return (
                      <div
                        key={circulation.id}
                        className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className="w-16 h-20 bg-gradient-to-br from-orange-50 to-amber-50 rounded flex items-center justify-center flex-shrink-0">
                          {book?.coverImage ? (
                            <img
                              src={book.coverImage}
                              alt={book?.title}
                              className="w-full h-full object-cover rounded"
                            />
                          ) : (
                            <BookOpen className="w-8 h-8 text-orange-300" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {book?.title || "Unknown Title"}
                            </h3>
                            <Badge className={statusConfig.color} variant="outline">
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusConfig.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {book?.author || "Unknown Author"}
                          </p>
                          <div className="flex items-center flex-wrap gap-4 text-sm">
                            <div className="flex items-center gap-1 text-gray-500">
                              <Calendar className="w-4 h-4" />
                              <span>Borrowed: {formatDate(circulation.borrowDate)}</span>
                            </div>
                            <div
                              className={`flex items-center gap-1 ${
                                daysUntilDue < 0 ? "text-red-600 font-medium" : "text-gray-500"
                              }`}
                            >
                              <Clock className="w-4 h-4" />
                              <span>
                                Due: {formatDate(circulation.dueDate)}
                                {daysUntilDue >= 0 && daysUntilDue <= 3 && ` (${daysUntilDue} days left)`}
                                {daysUntilDue < 0 && ` (${Math.abs(daysUntilDue)} days overdue)`}
                              </span>
                            </div>
                            {circulation.renewals > 0 && (
                              <span className="text-xs text-gray-500">
                                Renewed {circulation.renewals}x
                              </span>
                            )}
                            {(circulation.calculatedFine || circulation.fine) > 0 && (
                              <span className="text-xs text-orange-600 font-medium">
                                Fine: ${((circulation.calculatedFine || circulation.fine)).toFixed(2)}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2 mt-2">
                            {circulation.status === "borrowed" && (
                              <>
                                {circulation.renewals < circulation.maxRenewals ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-1"
                                    onClick={() => handleRenew(circulation.id)}
                                    disabled={renewing === circulation.id}
                                  >
                                    <RefreshCw className={`w-3 h-3 ${renewing === circulation.id ? "animate-spin" : ""}`} />
                                    Renew
                                  </Button>
                                ) : (
                                  <span className="text-xs text-gray-500">
                                    Max renewals reached
                                  </span>
                                )}
                                <Button
                                  size="sm"
                                  className="gap-1"
                                  onClick={() => handleReturn(circulation.id)}
                                  disabled={returning === circulation.id}
                                >
                                  {returning === circulation.id ? (
                                    <>
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                      Returning...
                                    </>
                                  ) : (
                                    <>
                                      <Bookmark className="w-3 h-3" />
                                      Return Book
                                    </>
                                  )}
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reservations Tab */}
        <TabsContent value="reservations">
          <Card>
            <CardHeader>
              <CardTitle>My Reservations</CardTitle>
              <CardDescription>
                Books you have reserved and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
                </div>
              ) : myReservations.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Bell className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p>You don't have any active reservations.</p>
                  <Button
                    className="mt-4"
                    onClick={() => setActiveTab("browse")}
                  >
                    Browse Catalog to Reserve
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {myReservations.map((reservation) => {
                    const book = reservation.book;
                    const isPending = reservation.status === "pending";
                    const isReady = reservation.status === "ready";
                    const isExpired = reservation.status === "expired";

                    return (
                      <div
                        key={reservation.id}
                        className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className="w-16 h-20 bg-gradient-to-br from-orange-50 to-amber-50 rounded flex items-center justify-center flex-shrink-0">
                          {book?.coverImage ? (
                            <img
                              src={book.coverImage}
                              alt={book?.title}
                              className="w-full h-full object-cover rounded"
                            />
                          ) : (
                            <BookOpen className="w-8 h-8 text-orange-300" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {book?.title || "Unknown Title"}
                            </h3>
                            <Badge
                              className={
                                isReady
                                  ? "bg-green-100 text-green-700 border-green-200"
                                  : isExpired
                                  ? "bg-gray-100 text-gray-700 border-gray-200"
                                  : "bg-blue-100 text-blue-700 border-blue-200"
                              }
                              variant="outline"
                            >
                              {isReady && <CheckCircle2 className="w-3 h-3 mr-1" />}
                              {isExpired && <AlertCircle className="w-3 h-3 mr-1" />}
                              {isPending && <Clock className="w-3 h-3 mr-1" />}
                              {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {book?.author || "Unknown Author"}
                          </p>
                          <div className="flex items-center flex-wrap gap-4 text-sm">
                            <div className="flex items-center gap-1 text-gray-500">
                              <Calendar className="w-4 h-4" />
                              <span>Reserved: {formatDate(reservation.reservationDate)}</span>
                            </div>
                            <div className="flex items-center gap-1 text-gray-500">
                              <Clock className="w-4 h-4" />
                              <span>Expires: {formatDate(reservation.expiryDate)}</span>
                            </div>
                            {isReady && (
                              <span className="text-xs text-green-600 font-medium">
                                <Info className="w-3 h-3 inline mr-1" />
                                Book is available for pickup!
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2 mt-2">
                            {(isPending || isReady) && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1 text-red-600 hover:text-red-700"
                                onClick={() => handleCancelReservation(reservation.id)}
                                disabled={cancelling === reservation.id}
                              >
                                {cancelling === reservation.id ? (
                                  <>
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    Cancelling...
                                  </>
                                ) : (
                                  <>
                                    <X className="w-3 h-3" />
                                    Cancel Reservation
                                  </>
                                )}
                              </Button>
                            )}
                            {isReady && (
                              <Button
                                size="sm"
                                className="gap-1"
                                onClick={() => {
                                  if (book) handleBorrow(book.id);
                                }}
                                disabled={borrowing === book?.id}
                              >
                                <Bookmark className="w-3 h-3" />
                                Borrow Now
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Book Detail Dialog */}
      {selectedBook && (
        <Dialog open={!!selectedBook} onOpenChange={() => setSelectedBook(null)}>
          <DialogContent className="sm:max-w-[500px]">
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-32 h-44 bg-gradient-to-br from-orange-50 to-amber-50 rounded flex items-center justify-center flex-shrink-0">
                  {selectedBook.coverImage ? (
                    <img
                      src={selectedBook.coverImage}
                      alt={selectedBook.title}
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    <BookOpen className="w-16 h-16 text-orange-300" />
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    {selectedBook.title}
                  </h2>
                  <p className="text-sm text-gray-600 mb-1">
                    {selectedBook.author}
                  </p>
                  {selectedBook.isbn && (
                    <p className="text-xs text-gray-500">ISBN: {selectedBook.isbn}</p>
                  )}
                  <Badge className={getStatusBadge(selectedBook.status).color} variant="outline">
                    {getStatusBadge(selectedBook.status).label}
                  </Badge>
                </div>
              </div>

              {selectedBook.description && (
                <div className="pt-3 border-t">
                  <h3 className="font-medium text-gray-900 mb-2">Description</h3>
                  <p className="text-sm text-gray-600">{selectedBook.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm pt-3 border-t">
                <div>
                  <span className="text-gray-500">Publisher:</span>
                  <span className="ml-1 font-medium">{selectedBook.publisher}</span>
                </div>
                <div>
                  <span className="text-gray-500">Year:</span>
                  <span className="ml-1 font-medium">{selectedBook.publicationYear}</span>
                </div>
                <div>
                  <span className="text-gray-500">Category:</span>
                  <span className="ml-1 font-medium">{selectedBook.category}</span>
                </div>
                <div>
                  <span className="text-gray-500">Language:</span>
                  <span className="ml-1 font-medium">{selectedBook.language}</span>
                </div>
                {selectedBook.totalPages > 0 && (
                  <div>
                    <span className="text-gray-500">Pages:</span>
                    <span className="ml-1 font-medium">{selectedBook.totalPages}</span>
                  </div>
                )}
              </div>

              {selectedBook.status === "available" ? (
                <div className="pt-4 border-t flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedBook(null)}
                  >
                    Close
                  </Button>
                  <Button
                    className="bg-orange-600 hover:bg-orange-700"
                    disabled={borrowing === selectedBook.id}
                    onClick={() => handleBorrow(selectedBook.id)}
                  >
                    {borrowing === selectedBook.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Borrowing...
                      </>
                    ) : (
                      <>
                        <Bookmark className="w-4 h-4 mr-2" />
                        Borrow Book
                      </>
                    )}
                  </Button>
                </div>
              ) : selectedBook.status === "borrowed" || selectedBook.status === "reserved" ? (
                <div className="pt-4 border-t flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedBook(null)}
                  >
                    Close
                  </Button>
                  <Button
                    variant="outline"
                    className="border-blue-600 text-blue-600 hover:bg-blue-50"
                    disabled={reserving === selectedBook.id}
                    onClick={() => handleReserve(selectedBook.id)}
                  >
                    {reserving === selectedBook.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Reserving...
                      </>
                    ) : (
                      <>
                        <Bell className="w-4 h-4 mr-2" />
                        Reserve This Book
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="pt-4 border-t">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setSelectedBook(null)}
                  >
                    Close
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
