"use client";

/**
 * SCHOOL ADMIN LIBRARY DASHBOARD PAGE
 *
 * School administrators can:
 * - View library statistics
 * - Manage books (add, edit, delete)
 * - View circulation records
 * - Manage library memberships
 * - Handle reservations
 * - Manage fines
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Library,
  BookOpen,
  Users,
  Bookmark,
  Bell,
  DollarSign,
  Loader2,
  RefreshCw,
  Plus,
  Search,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { logger } from "@/lib/logger";

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
  availability?: {
    totalCopies: number;
    borrowed: number;
    reserved: number;
    available: number;
  };
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
  isOverdue?: boolean;
  calculatedFine?: number;
  daysOverdue?: number;
  book?: {
    id: string;
    title: string;
    author: string;
    isbn: string;
  };
  borrower?: {
    id: string;
    name: string;
    type: string;
  };
}

interface LibraryMember {
  id: string;
  userId: string;
  memberType: "student" | "teacher" | "staff";
  membershipNumber: string;
  membershipStatus: "active" | "inactive" | "suspended";
  joinedDate: string;
  expiryDate?: string;
  borrowingLimit: number;
  currentlyBorrowed: number;
  totalBorrowed: number;
  fineDue: number;
  user?: {
    id: string;
    name: string;
    email: string;
    type: string;
  };
}

interface BookReservation {
  id: string;
  bookId: string;
  userId: string;
  reservationDate: string;
  expiryDate: string;
  status: "pending" | "ready" | "fulfilled" | "cancelled" | "expired";
  priority: number;
  book?: {
    id: string;
    title: string;
    author: string;
  };
  user?: {
    id: string;
    name: string;
    type: string;
  };
}

interface FineRecord {
  circulationId: string;
  bookId: string;
  bookTitle: string;
  borrowerId: string;
  borrowerName: string;
  dueDate: string;
  returnDate?: string;
  status: string;
  totalFine: number;
  paid: number;
  outstanding: number;
  isOverdue: boolean;
}

export default function SchoolAdminLibraryPage() {
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "books" | "circulation" | "members" | "reservations" | "fines">("overview");

  // Data states
  const [books, setBooks] = useState<Book[]>([]);
  const [circulation, setCirculation] = useState<CirculationRecord[]>([]);
  const [members, setMembers] = useState<LibraryMember[]>([]);
  const [reservations, setReservations] = useState<BookReservation[]>([]);
  const [fines, setFines] = useState<FineRecord[]>([]);

  // Modal states
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isPayFineModalOpen, setIsPayFineModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [selectedMember, setSelectedMember] = useState<LibraryMember | null>(null);
  const [selectedFine, setSelectedFine] = useState<FineRecord | null>(null);

  // Form states
  const [bookForm, setBookForm] = useState({
    title: "",
    author: "",
    isbn: "",
    publicationYear: new Date().getFullYear(),
    category: "Fiction",
    description: "",
    publisher: "",
    language: "English",
    totalPages: 0,
  });

  const [memberForm, setMemberForm] = useState({
    userId: "",
    memberType: "student" as "student" | "teacher" | "staff",
    borrowingLimit: 5,
    expiryDate: "",
  });

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [booksRes, circulationRes, membersRes, reservationsRes, finesRes] = await Promise.all([
        fetch("/api/library/books"),
        fetch("/api/library/issue?includeOverdue=true"),
        fetch("/api/library/members"),
        fetch("/api/library/reservations"),
        fetch("/api/library/fines"),
      ]);

      const booksData = await booksRes.json();
      const circulationData = await circulationRes.json();
      const membersData = await membersRes.json();
      const reservationsData = await reservationsRes.json();
      const finesData = await finesRes.json();

      if (booksData.success) {
        setBooks(booksData.data.books || []);
      }

      if (circulationData.success) {
        setCirculation(circulationData.data.circulation || []);
      }

      if (membersData.success) {
        setMembers(membersData.data.members || []);
      }

      if (reservationsData.success) {
        setReservations(reservationsData.data.reservations || []);
      }

      if (finesData.success) {
        setFines(finesData.data.fines || []);
      }
    } catch (error) {
      logger.error("Error fetching library data:", error);
      showToast("Failed to load library data", "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Book operations
  const handleSaveBook = async () => {
    try {
      const url = editingBook ? "/api/library/books" : "/api/library/books";
      const method = editingBook ? "PATCH" : "POST";

      const body = editingBook
        ? { id: editingBook.id, ...bookForm }
        : bookForm;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success) {
        showToast(editingBook ? "Book updated successfully" : "Book added successfully", "success");
        setIsBookModalOpen(false);
        setEditingBook(null);
        setBookForm({
          title: "",
          author: "",
          isbn: "",
          publicationYear: new Date().getFullYear(),
          category: "Fiction",
          description: "",
          publisher: "",
          language: "English",
          totalPages: 0,
        });
        await fetchData();
      } else {
        showToast(data.error || "Failed to save book", "error");
      }
    } catch (error) {
      logger.error("Error saving book:", error);
      showToast("Failed to save book", "error");
    }
  };

  const handleDeleteBook = async (bookId: string) => {
    if (!confirm("Are you sure you want to delete this book?")) return;

    try {
      const response = await fetch(`/api/library/books?id=${bookId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        showToast("Book deleted successfully", "success");
        await fetchData();
      } else {
        showToast(data.error || "Failed to delete book", "error");
      }
    } catch (error) {
      logger.error("Error deleting book:", error);
      showToast("Failed to delete book", "error");
    }
  };

  const handleEditBook = (book: Book) => {
    setEditingBook(book);
    setBookForm({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      publicationYear: book.publicationYear,
      category: book.category,
      description: book.description || "",
      publisher: book.publisher || "",
      language: book.language || "English",
      totalPages: book.totalPages || 0,
    });
    setIsBookModalOpen(true);
  };

  // Member operations
  const handleCreateMember = async () => {
    try {
      const response = await fetch("/api/library/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(memberForm),
      });

      const data = await response.json();

      if (data.success) {
        showToast("Library member created successfully", "success");
        setIsMemberModalOpen(false);
        setMemberForm({
          userId: "",
          memberType: "student",
          borrowingLimit: 5,
          expiryDate: "",
        });
        await fetchData();
      } else {
        showToast(data.error || "Failed to create member", "error");
      }
    } catch (error) {
      logger.error("Error creating member:", error);
      showToast("Failed to create member", "error");
    }
  };

  // Fine operations
  const handlePayFine = async () => {
    if (!selectedFine) return;

    try {
      const response = await fetch("/api/library/fines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          circulationId: selectedFine.circulationId,
          amount: selectedFine.outstanding,
          paymentMethod: "cash",
        }),
      });

      const data = await response.json();

      if (data.success) {
        showToast("Fine paid successfully", "success");
        setIsPayFineModalOpen(false);
        setSelectedFine(null);
        await fetchData();
      } else {
        showToast(data.error || "Failed to pay fine", "error");
      }
    } catch (error) {
      logger.error("Error paying fine:", error);
      showToast("Failed to pay fine", "error");
    }
  };

  // Helper functions
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; color: string }> = {
      available: { label: "Available", color: "bg-green-100 text-green-700 border-green-200" },
      borrowed: { label: "Borrowed", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
      reserved: { label: "Reserved", color: "bg-blue-100 text-blue-700 border-blue-200" },
      lost: { label: "Lost", color: "bg-red-100 text-red-700 border-red-200" },
      active: { label: "Active", color: "bg-green-100 text-green-700 border-green-200" },
      inactive: { label: "Inactive", color: "bg-gray-100 text-gray-700 border-gray-200" },
      suspended: { label: "Suspended", color: "bg-red-100 text-red-700 border-red-200" },
      pending: { label: "Pending", color: "bg-blue-100 text-blue-700 border-blue-200" },
      ready: { label: "Ready", color: "bg-green-100 text-green-700 border-green-200" },
      fulfilled: { label: "Fulfilled", color: "bg-gray-100 text-gray-700 border-gray-200" },
      cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700 border-red-200" },
      expired: { label: "Expired", color: "bg-gray-100 text-gray-700 border-gray-200" },
      returned: { label: "Returned", color: "bg-green-100 text-green-700 border-green-200" },
      overdue: { label: "Overdue", color: "bg-red-100 text-red-700 border-red-200" },
    };
    return config[status] || { label: status, color: "bg-gray-100 text-gray-700 border-gray-200" };
  };

  // Calculate stats
  const stats = {
    totalBooks: books.length,
    availableBooks: books.filter((b) => b.status === "available").length,
    borrowedBooks: circulation.filter((c) => c.status === "borrowed").length,
    overdueBooks: circulation.filter((c) => c.isOverdue || c.status === "overdue").length,
    activeMembers: members.filter((m) => m.membershipStatus === "active").length,
    pendingReservations: reservations.filter((r) => r.status === "pending").length,
    totalFinesDue: fines.reduce((sum, f) => sum + f.outstanding, 0),
  };

  // Filter data
  const filteredBooks = books.filter((b) =>
    b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.isbn.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCirculation = circulation.filter((c) =>
    c.book?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.borrower?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMembers = members.filter((m) =>
    m.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.membershipNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

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
            <Library className="w-8 h-8 text-purple-600" />
            Library Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage books, circulation, memberships, and fines
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
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-500">
              Total Books
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.totalBooks}</div>
            <p className="text-xs text-gray-500 mt-1">{stats.availableBooks} available</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-500">
              Borrowed Books
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.borrowedBooks}</div>
            <p className="text-xs text-gray-500 mt-1">{stats.overdueBooks} overdue</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-500">
              Active Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeMembers}</div>
            <p className="text-xs text-gray-500 mt-1">{stats.pendingReservations} reservations</p>
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
              {stats.totalFinesDue.toFixed(2)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Nu. (Bhutanese Ngultrum)</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="books">Books</TabsTrigger>
          <TabsTrigger value="circulation">Circulation</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="reservations">Reservations</TabsTrigger>
          <TabsTrigger value="fines">Fines</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Borrowings</CardTitle>
                <CardDescription>Latest books borrowed by students/teachers</CardDescription>
              </CardHeader>
              <CardContent>
                {circulation.slice(0, 5).length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No recent borrowings</p>
                ) : (
                  <div className="space-y-3">
                    {circulation.slice(0, 5).map((record) => {
                      const statusConfig = getStatusBadge(record.status);
                      return (
                        <div key={record.id} className="flex items-center justify-between text-sm">
                          <div>
                            <p className="font-medium">{record.book?.title || "Unknown"}</p>
                            <p className="text-gray-500">{record.borrower?.name || "Unknown"}</p>
                          </div>
                          <div className="text-right">
                            <Badge className={statusConfig.color} variant="outline">
                              {statusConfig.label}
                            </Badge>
                            <p className="text-xs text-gray-500 mt-1">Due: {formatDate(record.dueDate)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pending Reservations</CardTitle>
                <CardDescription>Books reserved by members</CardDescription>
              </CardHeader>
              <CardContent>
                {reservations.filter((r) => r.status === "pending" || r.status === "ready").length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No pending reservations</p>
                ) : (
                  <div className="space-y-3">
                    {reservations
                      .filter((r) => r.status === "pending" || r.status === "ready")
                      .slice(0, 5)
                      .map((reservation) => {
                        const statusConfig = getStatusBadge(reservation.status);
                        return (
                          <div key={reservation.id} className="flex items-center justify-between text-sm">
                            <div>
                              <p className="font-medium">{reservation.book?.title || "Unknown"}</p>
                              <p className="text-gray-500">{reservation.user?.name || "Unknown"}</p>
                            </div>
                            <div className="text-right">
                              <Badge className={statusConfig.color} variant="outline">
                                {statusConfig.label}
                              </Badge>
                              <p className="text-xs text-gray-500 mt-1">
                                Expires: {formatDate(reservation.expiryDate)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Books Tab */}
        <TabsContent value="books" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search books..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button
                  className="gap-2 ml-4"
                  onClick={() => {
                    setEditingBook(null);
                    setBookForm({
                      title: "",
                      author: "",
                      isbn: "",
                      publicationYear: new Date().getFullYear(),
                      category: "Fiction",
                      description: "",
                      publisher: "",
                      language: "English",
                      totalPages: 0,
                    });
                    setIsBookModalOpen(true);
                  }}
                >
                  <Plus className="w-4 h-4" />
                  Add Book
                </Button>
              </div>

              {filteredBooks.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No books found</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Title</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Author</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">ISBN</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Category</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBooks.map((book) => {
                        const statusConfig = getStatusBadge(book.status);
                        return (
                          <tr key={book.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium">{book.title}</td>
                            <td className="py-3 px-4 text-gray-600">{book.author}</td>
                            <td className="py-3 px-4 text-gray-600">{book.isbn}</td>
                            <td className="py-3 px-4">
                              <Badge variant="outline" className="text-xs">
                                {book.category}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <Badge className={statusConfig.color} variant="outline">
                                {statusConfig.label}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditBook(book)}
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => handleDeleteBook(book.id)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Circulation Tab */}
        <TabsContent value="circulation" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search circulation..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {filteredCirculation.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No circulation records found</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Book</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Borrower</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Borrowed</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Due Date</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Fine</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCirculation.map((record) => {
                        const statusConfig = getStatusBadge(record.status);
                        const isOverdue = record.isOverdue || record.status === "overdue";
                        return (
                          <tr key={record.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium">{record.book?.title || "Unknown"}</td>
                            <td className="py-3 px-4 text-gray-600">{record.borrower?.name || "Unknown"}</td>
                            <td className="py-3 px-4 text-gray-600">{formatDate(record.borrowDate)}</td>
                            <td className={`py-3 px-4 ${isOverdue ? "text-red-600 font-medium" : "text-gray-600"}`}>
                              {formatDate(record.dueDate)}
                            </td>
                            <td className="py-3 px-4">
                              <Badge className={statusConfig.color} variant="outline">
                                {statusConfig.label}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              {(record.calculatedFine || record.fine) > 0 ? (
                                <span className="text-orange-600 font-medium">
                                  Nu. {((record.calculatedFine || record.fine)).toFixed(2)}
                                </span>
                              ) : (
                                <span className="text-gray-500">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search members..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button
                  className="gap-2 ml-4"
                  onClick={() => setIsMemberModalOpen(true)}
                >
                  <Plus className="w-4 h-4" />
                  Add Member
                </Button>
              </div>

              {filteredMembers.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No members found</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Member</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Membership #</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Type</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Borrowed/Total</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Fine Due</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMembers.map((member) => {
                        const statusConfig = getStatusBadge(member.membershipStatus);
                        return (
                          <tr key={member.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium">{member.user?.name || "Unknown"}</td>
                            <td className="py-3 px-4 text-gray-600">{member.membershipNumber}</td>
                            <td className="py-3 px-4 capitalize">{member.memberType}</td>
                            <td className="py-3 px-4">
                              <Badge className={statusConfig.color} variant="outline">
                                {statusConfig.label}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-gray-600">
                              {member.currentlyBorrowed}/{member.borrowingLimit}
                            </td>
                            <td className="py-3 px-4">
                              {member.fineDue > 0 ? (
                                <span className="text-orange-600 font-medium">
                                  Nu. {member.fineDue.toFixed(2)}
                                </span>
                              ) : (
                                <span className="text-gray-500">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reservations Tab */}
        <TabsContent value="reservations" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search reservations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {reservations.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No reservations found</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Book</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Reserved By</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Reserved</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Expires</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reservations.map((reservation) => {
                        const statusConfig = getStatusBadge(reservation.status);
                        return (
                          <tr key={reservation.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium">{reservation.book?.title || "Unknown"}</td>
                            <td className="py-3 px-4 text-gray-600">{reservation.user?.name || "Unknown"}</td>
                            <td className="py-3 px-4 text-gray-600">{formatDate(reservation.reservationDate)}</td>
                            <td className="py-3 px-4 text-gray-600">{formatDate(reservation.expiryDate)}</td>
                            <td className="py-3 px-4">
                              <Badge className={statusConfig.color} variant="outline">
                                {statusConfig.label}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fines Tab */}
        <TabsContent value="fines" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Outstanding Fines</h3>
                <div className="text-sm text-gray-600">
                  Total: <span className="font-bold text-orange-600">Nu. {stats.totalFinesDue.toFixed(2)}</span>
                </div>
              </div>

              {fines.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No outstanding fines</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Book</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Borrower</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Due Date</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Total Fine</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Paid</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Outstanding</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fines.map((fine) => (
                        <tr key={fine.circulationId} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{fine.bookTitle}</td>
                          <td className="py-3 px-4 text-gray-600">{fine.borrowerName}</td>
                          <td className="py-3 px-4 text-gray-600">{formatDate(fine.dueDate)}</td>
                          <td className="py-3 px-4 text-gray-600">Nu. {fine.totalFine.toFixed(2)}</td>
                          <td className="py-3 px-4 text-gray-600">Nu. {fine.paid.toFixed(2)}</td>
                          <td className="py-3 px-4 text-orange-600 font-medium">Nu. {fine.outstanding.toFixed(2)}</td>
                          <td className="py-3 px-4 text-right">
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedFine(fine);
                                setIsPayFineModalOpen(true);
                              }}
                            >
                              Pay Fine
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

      {/* Add/Edit Book Modal */}
      <Dialog open={isBookModalOpen} onOpenChange={setIsBookModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingBook ? "Edit Book" : "Add New Book"}</DialogTitle>
            <DialogDescription>
              {editingBook ? "Update book details" : "Enter details for the new book"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={bookForm.title}
                  onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                  placeholder="Book title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="author">Author *</Label>
                <Input
                  id="author"
                  value={bookForm.author}
                  onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                  placeholder="Author name"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="isbn">ISBN *</Label>
                <Input
                  id="isbn"
                  value={bookForm.isbn}
                  onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })}
                  placeholder="ISBN number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="publicationYear">Year *</Label>
                <Input
                  id="publicationYear"
                  type="number"
                  value={bookForm.publicationYear}
                  onChange={(e) => setBookForm({ ...bookForm, publicationYear: parseInt(e.target.value) })}
                  placeholder="Publication year"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={bookForm.category}
                  onValueChange={(value) => setBookForm({ ...bookForm, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fiction">Fiction</SelectItem>
                    <SelectItem value="Non-Fiction">Non-Fiction</SelectItem>
                    <SelectItem value="Science">Science</SelectItem>
                    <SelectItem value="Mathematics">Mathematics</SelectItem>
                    <SelectItem value="History">History</SelectItem>
                    <SelectItem value="Geography">Geography</SelectItem>
                    <SelectItem value="Dzongkha">Dzongkha</SelectItem>
                    <SelectItem value="English">English</SelectItem>
                    <SelectItem value="Reference">Reference</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="publisher">Publisher</Label>
                <Input
                  id="publisher"
                  value={bookForm.publisher}
                  onChange={(e) => setBookForm({ ...bookForm, publisher: e.target.value })}
                  placeholder="Publisher name"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Input
                  id="language"
                  value={bookForm.language}
                  onChange={(e) => setBookForm({ ...bookForm, language: e.target.value })}
                  placeholder="Language"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalPages">Pages</Label>
                <Input
                  id="totalPages"
                  type="number"
                  value={bookForm.totalPages}
                  onChange={(e) => setBookForm({ ...bookForm, totalPages: parseInt(e.target.value) || 0 })}
                  placeholder="Total pages"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={bookForm.description}
                onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })}
                placeholder="Brief description"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsBookModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveBook}>
              {editingBook ? "Update" : "Add"} Book
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Member Modal */}
      <Dialog open={isMemberModalOpen} onOpenChange={setIsMemberModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Add Library Member</DialogTitle>
            <DialogDescription>
              Create a new library membership
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="memberType">Member Type *</Label>
              <Select
                value={memberForm.memberType}
                onValueChange={(value: any) => setMemberForm({ ...memberForm, memberType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="borrowingLimit">Borrowing Limit</Label>
              <Input
                id="borrowingLimit"
                type="number"
                min="1"
                max="20"
                value={memberForm.borrowingLimit}
                onChange={(e) => setMemberForm({ ...memberForm, borrowingLimit: parseInt(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
              <Input
                id="expiryDate"
                type="date"
                value={memberForm.expiryDate}
                onChange={(e) => setMemberForm({ ...memberForm, expiryDate: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsMemberModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateMember}>
              Create Member
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pay Fine Modal */}
      <Dialog open={isPayFineModalOpen} onOpenChange={setIsPayFineModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Pay Fine</DialogTitle>
            <DialogDescription>
              Record payment for overdue book
            </DialogDescription>
          </DialogHeader>
          {selectedFine && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium">{selectedFine.bookTitle}</p>
                <p className="text-sm text-gray-600">{selectedFine.borrowerName}</p>
                <div className="mt-2 flex justify-between text-sm">
                  <span>Outstanding:</span>
                  <span className="font-bold text-orange-600">Nu. {selectedFine.outstanding.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsPayFineModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePayFine}>
              Confirm Payment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
