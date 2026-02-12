/**
 * STUDENT LIBRARY PAGE
 *
 * Students can:
 * - Browse the library catalog
 * - Search for books
 * - View their borrowed books
 * - Borrow new books
 */

"use client";

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
  User,
  Loader2,
  Bookmark,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ArrowLeft,
  ArrowRight,
  Library,
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
  authors: string[];
  isbn?: string;
  genre?: string;
  subjects?: string[];
  synopsis?: string;
  coverImageUrl?: string;
  publicationYear?: number;
  publisher?: string;
  status: "available" | "borrowed" | "reserved" | "lost" | "damaged";
  averageRating?: number;
  totalBorrows?: number;
}

interface Circulation {
  id: string;
  bookId: string;
  borrowDate: string;
  dueDate: string;
  actualReturnDate?: string;
  status: "borrowed" | "returned" | "overdue";
  renewalCount: number;
  fineAmount: number;
  book: Book;
}

export default function StudentLibraryPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [myBorrows, setMyBorrows] = useState<Circulation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [activeTab, setActiveTab] = useState<"browse" | "borrowed">("browse");
  const [borrowing, setBorrowing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/library");
        const data = await response.json();
        setBooks(data.books || []);
        setMyBorrows(data.myBorrows || []);
      } catch (error) {
        console.error("Error fetching library data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Borrow a book
  const handleBorrow = async (bookId: string, borrowDays: number = 14) => {
    try {
      setBorrowing(true);
      const response = await fetch("/api/library", {
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
        alert("Book borrowed successfully!");
        // Refresh data
        const refreshed = await fetch("/api/library");
        const refreshedData = await refreshed.json();
        setMyBorrows(refreshedData.myBorrows || []);
        setBooks(refreshedData.books || []);
        setSelectedBook(null);
      } else {
        alert(data.error || "Failed to borrow book");
      }
    } catch (error) {
      console.error("Error borrowing book:", error);
      alert("Failed to borrow book. Please try again.");
    } finally {
      setBorrowing(false);
    }
  };

  // Return a book
  const handleReturn = async (circulationId: string) => {
    if (!confirm("Are you sure you want to return this book?")) {
      return;
    }

    try {
      const response = await fetch("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "return",
          circulationId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Refresh data
        const refreshed = await fetch("/api/library");
        const refreshedData = await refreshed.json();
        setMyBorrows(refreshedData.myBorrows || []);
        setBooks(refreshedData.books || []);
      } else {
        alert(data.error || "Failed to return book");
      }
    } catch (error) {
      console.error("Error returning book:", error);
      alert("Failed to return book. Please try again.");
    }
  };

  // Filter books by search
  const filteredBooks = books.filter((book) => {
    if (searchQuery === "") return true;
    const query = searchQuery.toLowerCase();
    return (
      book.title.toLowerCase().includes(query) ||
      book.authors.some((a) => a.toLowerCase().includes(query)) ||
      book.isbn?.toLowerCase().includes(query) ||
      book.genre?.toLowerCase().includes(query)
    );
  });

  // Get status badge config
  const getStatusBadge = (status: Book["status"]) => {
    const config = {
      available: { label: "Available", color: "bg-green-100 text-green-700" },
      borrowed: { label: "Borrowed", color: "bg-yellow-100 text-yellow-700" },
      reserved: { label: "Reserved", color: "bg-blue-100 text-blue-700" },
      lost: { label: "Lost", color: "bg-red-100 text-red-700" },
      damaged: { label: "Damaged", color: "bg-orange-100 text-orange-700" },
    };
    return config[status] || config.available;
  };

  // Get circulation status
  const getCirculationStatus = (circulation: Circulation) => {
    const now = new Date();
    const due = new Date(circulation.dueDate);
    const isOverdue = now > due;

    if (circulation.status === "returned") {
      return { label: "Returned", color: "bg-green-100 text-green-700" };
    } else if (isOverdue) {
      return { label: "Overdue", color: "bg-red-100 text-red-700" };
    } else {
      return { label: "Borrowed", color: "bg-yellow-100 text-yellow-700" };
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

  return (
    <div className="space-y-6">
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
            <div className="text-2xl font-bold text-gray-900">{books.length}</div>
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
              {books.filter((b) => b.status === "available").length}
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
              {myBorrows.length}
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
              {myBorrows.filter((b) => {
                const status = getCirculationStatus(b);
                return status.label === "Overdue";
              }).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-2">
          <TabsTrigger value="browse">Browse Catalog</TabsTrigger>
          <TabsTrigger value="borrowed">My Borrowed Books</TabsTrigger>
        </TabsList>

        {/* Browse Tab */}
        <TabsContent value="browse" className="space-y-4">
          {/* Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Search by title, author, ISBN, or genre..."
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
                      {book.coverImageUrl ? (
                        <img
                          src={book.coverImageUrl}
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
                        <Badge className={statusBadge.color}>
                          {statusBadge.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {book.authors.join(", ")}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        {book.genre && (
                          <Badge variant="outline" className="text-xs">
                            {book.genre}
                          </Badge>
                        )}
                        {book.publicationYear && (
                          <span>{book.publicationYear}</span>
                        )}
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

                    return (
                      <div
                        key={circulation.id}
                        className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className="w-16 h-20 bg-gradient-to-br from-orange-50 to-amber-50 rounded flex items-center justify-center flex-shrink-0">
                          {book?.coverImageUrl ? (
                            <img
                              src={book.coverImageUrl}
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
                            <Badge className={statusConfig.color}>
                              {statusConfig.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {book?.authors?.join(", ") || "Unknown Author"}
                          </p>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1 text-gray-500">
                              <Calendar className="w-4 h-4" />
                              <span>Borrowed: {formatDate(circulation.borrowDate)}</span>
                            </div>
                            <div className="flex items-center gap-1 text-gray-500">
                              <Clock className="w-4 h-4" />
                              <span>Due: {formatDate(circulation.dueDate)}</span>
                            </div>
                            {circulation.renewalCount > 0 && (
                              <span className="text-xs text-gray-500">
                                Renewed {circulation.renewalCount}x
                              </span>
                            )}
                          </div>
                          {circulation.status === "borrowed" && (
                            <Button
                              size="sm"
                              className="mt-2"
                              onClick={() => handleReturn(circulation.id)}
                            >
                              Return Book
                            </Button>
                          )}
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
                  {selectedBook.coverImageUrl ? (
                    <img
                      src={selectedBook.coverImageUrl}
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
                    {selectedBook.authors?.join(", ")}
                  </p>
                  {selectedBook.isbn && (
                    <p className="text-xs text-gray-500">ISBN: {selectedBook.isbn}</p>
                  )}
                  <Badge className={getStatusBadge(selectedBook.status).color}>
                    {getStatusBadge(selectedBook.status).label}
                  </Badge>
                </div>
              </div>

              {selectedBook.synopsis && (
                <div className="pt-3 border-t">
                  <h3 className="font-medium text-gray-900 mb-2">Synopsis</h3>
                  <p className="text-sm text-gray-600">{selectedBook.synopsis}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm pt-3 border-t">
                {selectedBook.publisher && (
                  <div>
                    <span className="text-gray-500">Publisher:</span>
                    <span className="ml-1 font-medium">{selectedBook.publisher}</span>
                  </div>
                )}
                {selectedBook.publicationYear && (
                  <div>
                    <span className="text-gray-500">Year:</span>
                    <span className="ml-1 font-medium">{selectedBook.publicationYear}</span>
                  </div>
                )}
                {selectedBook.genre && (
                  <div>
                    <span className="text-gray-500">Genre:</span>
                    <span className="ml-1 font-medium">{selectedBook.genre}</span>
                  </div>
                )}
                {selectedBook.averageRating && (
                  <div>
                    <span className="text-gray-500">Rating:</span>
                    <span className="ml-1 font-medium">⭐ {selectedBook.averageRating}/5</span>
                  </div>
                )}
              </div>

              {selectedBook.subjects && selectedBook.subjects.length > 0 && (
                <div className="pt-3 border-t">
                  <h3 className="font-medium text-gray-900 mb-2">Subjects</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedBook.subjects.map((subject) => (
                      <Badge key={subject} variant="outline">
                        {subject}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedBook.status === "available" && (
                <div className="pt-4 border-t flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedBook(null)}
                  >
                    Close
                  </Button>
                  <Button
                    className="bg-orange-600 hover:bg-orange-700"
                    disabled={borrowing}
                    onClick={() => handleBorrow(selectedBook.id)}
                  >
                    {borrowing ? (
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
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
