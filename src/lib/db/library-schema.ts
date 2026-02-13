/**
 * Library Management Database Schema
 * Handles books, circulation, digital resources, and library operations
 */

import { pgTable, text, integer, boolean, timestamp, pgEnum , json} from "drizzle-orm/pg-core";

// ============================================================================
// BOOKS CATALOG
// ============================================================================

/**
 * Library books catalog
 */
export const books = pgTable("books", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),

  // Book details
  isbn: text("isbn").unique(),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  authors: json("authors").$type<string[]>(),
  contributors: json("contributors").$type<Array<{
    name: string;
    role: string; // "editor", "translator", "illustrator", etc.
  }>>(),

  // Publication info
  publisher: text("publisher"),
  publicationYear: integer("publication_year"),
  edition: text("edition"), // "1st", "2nd", "Revised", etc.
  language: text("language").default("English"),

  // Physical description
  pages: integer("pages"),
  format: text("format"), // "hardcover", "paperback", "ebook", "audiobook"
  dimensions: text("dimensions"), // "23 x 15 x 2 cm"

  // Subject classification
  genre: text("genre"),
  subjects: json("subjects").$type<string[]>(),
  deweyDecimal: text("dewey_decimal"), // DDC classification
  lcClassification: text("lc_classification"), // Library of Congress

  // Reading level (for educational context)
  readingLevel: text("reading_level"), // "beginner", "intermediate", "advanced"
  ageGroup: text("age_group"), // "5-8", "9-12", "13-15", "16-18", "adult"
  curriculumAligned: boolean("curriculum_aligned").default(false),
  classes: json("classes").$type<number[]>(), // Relevant classes

  // Description
  synopsis: text("synopsis"),
  tableOfContents: json("table_of_contents").$type<string[]>(),

  // Cover image
  coverImageUrl: text("cover_image_url"),
  coverImageId: text("cover_image_id"), // Reference to uploaded file

  // Tags for discovery
  tags: json("tags").$type<string[]>(),

  // Acquisition info
  acquisitionDate: text("acquisition_date"), // ISO date
  acquisitionSource: text("acquisition_source"), // "purchased", "donated", "granted"
  vendorId: text("vendor_id"), // Reference to vendor
  purchasePrice: integer("purchase_price"), // In currency units (Nu.)
  invoiceNumber: text("invoice_number"),

  // Barcode/RFID
  barcode: text("barcode").unique(),
  rfidTag: text("rfid_tag").unique(),

  // Status
  status: text("status").notNull().default("available"), // "available", "borrowed", "reserved", "lost", "damaged", "maintenance"
  condition: text("condition").notNull().default("good"), // "new", "good", "fair", "poor", "damaged"
  location: text("location"), // Specific shelf/location

  // Circulation stats
  totalBorrows: integer("total_borrows").default(0),
  currentBorrowerId: text("current_borrower_id"), // Student/Staff ID
  dueDate: text("due_date"), // ISO date

  // Reviews and ratings
  averageRating: integer("average_rating"), // 1-5 scale
  reviewCount: integer("review_count").default(0),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// BOOK COPIES (Multiple copies of same book)
// ============================================================================

/**
 * Individual copies of books (for multi-copy holdings)
 */
export const bookCopies = pgTable("book_copies", {
  id: text("id").primaryKey(),
  bookId: text("book_id").notNull(),
  schoolId: text("school_id").notNull(),

  // Copy identification
  copyNumber: integer("copy_number").notNull(),
  barcode: text("barcode").unique(),
  rfidTag: text("rfid_tag").unique(),

  // Copy-specific status
  status: text("status").notNull().default("available"), // "available", "borrowed", "reserved", "lost", "damaged"
  condition: text("condition").notNull().default("new"), // "new", "good", "fair", "poor", "damaged"

  // Location
  location: text("location"), // Shelf, rack, section

  // Notes
  notes: text("notes"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// CIRCULATION (Borrowing)
// ============================================================================

/**
 * Book borrowing/circulation records
 */
export const circulation = pgTable("circulation", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),

  // Book
  bookId: text("book_id").notNull(),
  copyId: text("copy_id"), // If using multi-copy system

  // Borrower
  borrowerId: text("borrower_id").notNull(), // Student/Staff ID
  borrowerType: text("borrower_type").notNull(), // "student", "teacher", "admin", "staff"
  borrowerName: text("borrower_name"), // Denormalized

  // Borrowing period
  borrowDate: text("borrow_date").notNull(), // ISO date
  dueDate: text("due_date").notNull(), // ISO date
  returnDate: text("return_date"), // ISO date
  actualReturnDate: text("actual_return_date"), // ISO date

  // Status
  status: text("status").notNull().default("borrowed"), // "borrowed", "returned", "overdue", "lost"

  // Renewal
  renewalCount: integer("renewal_count").default(0),
  maxRenewals: integer("max_renewals").default(3),
  lastRenewalDate: text("last_renewal_date"),

  // Fine
  fineAmount: integer("fine_amount").default(0), // In currency units
  finePaid: integer("fine_paid").default(0),
  fineWaived: integer("fine_waived").default(0),

  // Check-in/check-out
  issuedBy: text("issued_by"), // Librarian user ID
  receivedBy: text("received_by"), // Librarian user ID
  issueNotes: text("issue_notes"),
  returnNotes: text("return_notes"),
  returnCondition: text("return_condition"), // Condition when returned

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// RESERVATIONS
// ============================================================================

/**
 * Book reservation/hold requests
 */
export const reservations = pgTable("reservations", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),

  // Book
  bookId: text("book_id").notNull(),

  // Requester
  requesterId: text("requester_id").notNull(),
  requesterType: text("requester_type").notNull(), // "student", "teacher", "admin", "staff"
  requesterName: text("requester_name"),

  // Reservation period
  reservationDate: text("reservation_date").notNull(), // ISO date
  expiryDate: text("expiry_date").notNull(), // ISO date - usually 7 days
  notifiedDate: text("notified_date"), // When user was notified book is available

  // Status
  status: text("status").notNull().default("pending"), // "pending", "ready", "fulfilled", "cancelled", "expired"

  // Priority
  priority: integer("priority").default(0), // Higher for faculty, etc.

  // Notes
  notes: text("notes"),
  cancellationReason: text("cancellation_reason"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// DIGITAL RESOURCES
// ============================================================================

/**
 * E-books, audiobooks, and digital media
 */
export const digitalResources = pgTable("digital_resources", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),

  // Resource details
  title: text("title").notNull(),
  description: text("description"),

  // Type and format
  resourceType: text("resource_type").notNull(), // "ebook", "audiobook", "video", "journal", "article", "database"
  format: text("format"), // "pdf", "epub", "mobi", "mp3", "mp4", etc.
  fileSize: integer("file_size"), // In bytes

  // Access
  accessUrl: text("access_url"),
  fileId: text("file_id"), // Reference to file storage
  downloadAllowed: boolean("download_allowed").default(true),
  concurrentAccessLimit: integer("concurrent_access_limit").default(0), // 0 = unlimited

  // Metadata
  authors: json("authors").$type<string[]>(),
  publisher: text("publisher"),
  publicationYear: integer("publication_year"),
  isbn: text("isbn"),
  doi: text("doi"), // Digital Object Identifier

  // Subjects and classification
  subjects: json("subjects").$type<string[]>(),
  tags: json("tags").$type<string[]>(),

  // License and rights
  licenseType: text("license_type"), // "purchased", "subscription", "open_access", "creative_commons"
  licenseExpiry: text("license_expiry"), // ISO date
  maxCopies: integer("max_copies"), // For licensed resources

  // Thumbnail/preview
  thumbnailUrl: text("thumbnail_url"),
  previewUrl: text("preview_url"),

  // Statistics
  totalViews: integer("total_views").default(0),
  totalDownloads: integer("total_downloads").default(0),
  averageRating: integer("average_rating"), // 1-5 scale
  reviewCount: integer("review_count").default(0),

  // Status
  isActive: boolean("is_active").default(true),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// DIGITAL RESOURCE ACCESS LOG
// ============================================================================

/**
 * Track access to digital resources
 */
export const digitalAccessLog = pgTable("digital_access_log", {
  id: text("id").primaryKey(),
  resourceId: text("resource_id").notNull(),

  // User
  userId: text("user_id").notNull(),
  userType: text("user_type").notNull(),

  // Access details
  accessType: text("access_type").notNull(), // "view", "download", "stream"
  accessDuration: integer("access_duration"), // Seconds spent viewing

  // Session info
  sessionId: text("session_id"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),

  timestamp: timestamp("timestamp", { withTimezone: true }).notNull(),
});

// ============================================================================
// LIBRARY MEMBERS
// ============================================================================

/**
 * Library membership (can differ from school enrollment)
 */
export const libraryMembers = pgTable("library_members", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),

  // Member
  userId: text("user_id").notNull(), // Reference to user
  memberType: text("member_type").notNull(), // "student", "teacher", "admin", "staff", "guest"

  // Membership details
  memberId: text("member_id").unique(), // Library-specific ID (LIB-XXXX)
  memberSince: text("member_since").notNull(), // ISO date

  // Membership tier
  membershipType: text("membership_type").notNull(), // "standard", "premium", "faculty", "guest"
  borrowingLimit: integer("borrowing_limit").default(3), // Max books at once
  loanPeriodDays: integer("loan_period_days").default(14),

  // Status
  status: text("status").notNull().default("active"), // "active", "suspended", "expired", "inactive"
  suspensionReason: text("suspension_reason"),
  suspendedUntil: text("suspended_until"),

  // Statistics
  totalBorrowed: integer("total_borrowed").default(0),
  totalReturned: integer("total_returned").default(0),
  totalOverdue: integer("total_overdue").default(0),
  currentFines: integer("current_fines").default(0),

  // Preferences
  favoriteGenres: json("favorite_genres").$type<string[]>(),
  readingInterests: json("reading_interests").$type<string[]>(),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// BOOK REVIEWS
// ============================================================================

/**
 * User reviews and ratings for books
 */
export const bookReviews = pgTable("book_reviews", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),

  // Book and reviewer
  bookId: text("book_id").notNull(),
  reviewerId: text("reviewer_id").notNull(),
  reviewerName: text("reviewer_name"),
  reviewerType: text("reviewer_type"), // "student", "teacher", "admin", "staff"

  // Rating and review
  rating: integer("rating").notNull(), // 1-5 stars
  title: text("title"), // Review title
  content: text("content"), // Review text

  // Reading experience
  dateRead: text("date_read"), // When reviewer read the book
  wouldRecommend: boolean("would_recommend"),

  // Moderation
  status: text("status").notNull().default("pending"), // "pending", "approved", "rejected", "flagged"
  moderatedBy: text("moderated_by"), // User ID
  moderationNote: text("moderation_note"),

  // Engagement
  helpfulCount: integer("helpful_count").default(0),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// FINE PAYMENTS
// ============================================================================

/**
 * Library fine payment records
 */
export const finePayments = pgTable("fine_payments", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),

  // Related circulation
  circulationId: text("circulation_id").notNull(),

  // Payer
  payerId: text("payer_id").notNull(),
  payerName: text("payer_name"),

  // Payment details
  amount: integer("amount").notNull(), // In currency units
  paymentMethod: text("payment_method"), // "cash", "online", "waived"
  paymentDate: text("payment_date").notNull(), // ISO date
  referenceNumber: text("reference_number"),

  // Waiver details
  waiverReason: text("waiver_reason"),
  waivedBy: text("waived_by"), // User ID who approved waiver

  // Receipt
  receiptNumber: text("receipt_number"),
  receiptUrl: text("receipt_url"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// LIBRARY SETTINGS
// ============================================================================

/**
 * Per-school library configuration
 */
export const librarySettings = pgTable("library_settings", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),

  // Borrowing rules
  studentLoanPeriod: integer("student_loan_period").default(14), // Days
  teacherLoanPeriod: integer("teacher_loan_period").default(30), // Days
  studentBorrowLimit: integer("student_borrow_limit").default(3),
  teacherBorrowLimit: integer("teacher_borrow_limit").default(10),

  // Fine settings
  dailyFineRate: integer("daily_fine_rate").default(2), // Per day
  maxFineAmount: integer("max_fine_amount").default(100), // Maximum fine per book
  gracePeriodDays: integer("grace_period_days").default(3), // Days before fine starts

  // Reservation
  reservationDays: integer("reservation_days").default(7), // How long to hold reserved books
  maxReservationsPerUser: integer("max_reservations_per_user").default(3),

  // Renewal
  maxRenewals: integer("max_renewals").default(3),
  renewalDays: integer("renewal_days").default(14),

  // Lost/damaged books
  lostBookPenalty: integer("lost_book_penalty").default(1000), // Fixed amount or replacement cost
  damagedBookPenalty: integer("damaged_book_penalty").default(200),

  // Digital resources
  dailyDownloadLimit: integer("daily_download_limit").default(5),

  // Notification settings
  overdueReminderEnabled: boolean("overdue_reminder_enabled").default(true),
  overdueReminderDays: integer("overdue_reminder_days").default(1),
  dueDateReminderDays: integer("due_date_reminder_days").default(2),

  // Library hours
  mondayOpen: text("monday_open"), // HH:MM format
  mondayClose: text("monday_close"),
  tuesdayOpen: text("tuesday_open"),
  tuesdayClose: text("tuesday_close"),
  wednesdayOpen: text("wednesday_open"),
  wednesdayClose: text("wednesday_close"),
  thursdayOpen: text("thursday_open"),
  thursdayClose: text("thursday_close"),
  fridayOpen: text("friday_open"),
  fridayClose: text("friday_close"),
  saturdayOpen: text("saturday_open"),
  saturdayClose: text("saturday_close"),
  sundayOpen: text("sunday_open"),
  sundayClose: text("sunday_close"),

  // Contact info
  librarianName: text("librarian_name"),
  librarianEmail: text("librarian_email"),
  librarianPhone: text("librarian_phone"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// LIBRARY VENDORS
// ============================================================================

/**
 * Book suppliers and vendors
 */
export const libraryVendors = pgTable("library_vendors", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull(),

  // Vendor details
  name: text("name").notNull(),
  code: text("code").unique(), // Vendor code

  // Contact info
  contactPerson: text("contact_person"),
  email: text("email"),
  phone: text("phone"),
  mobile: text("mobile"),
  address: text("address"),
  city: text("city"),
  district: text("district"),
  country: text("country").default("Bhutan"),

  // Business details
  taxId: text("tax_id"),
  licenseNumber: text("license_number"),

  // Terms
  paymentTerms: text("payment_terms"), // "NET 30", "COD", etc.
  discountPercentage: integer("discount_percentage").default(0),

  // Categories they supply
  categories: json("categories").$type<string[]>(), // ["fiction", "science", "textbooks"]

  // Notes
  notes: text("notes"),
  rating: integer("rating"), // 1-5 vendor rating

  // Status
  isActive: boolean("is_active").default(true),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Book = typeof books.$inferSelect;
export type BookCopy = typeof bookCopies.$inferSelect;
export type Circulation = typeof circulation.$inferSelect;
export type Reservation = typeof reservations.$inferSelect;
export type DigitalResource = typeof digitalResources.$inferSelect;
export type CounselorResource = typeof digitalResources.$inferSelect;
export type DigitalAccessLog = typeof digitalAccessLog.$inferSelect;
export type LibraryMember = typeof libraryMembers.$inferSelect;
export type BookReview = typeof bookReviews.$inferSelect;
export type FinePayment = typeof finePayments.$inferSelect;
export type LibrarySettings = typeof librarySettings.$inferSelect;
export type LibraryVendor = typeof libraryVendors.$inferSelect;
