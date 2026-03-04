/**
 * LIBRARY BOOKS FEATURE DEFINITION
 */

import { defineFeature } from "@/lib/features/define-feature";

export const LibraryBookFeature = defineFeature({
  name: "library-books",
  tableName: "library_books",

  schema: {
    id: { type: "text", required: true, primary: true },
    title: { type: "text", required: true, label: "Title", sortable: true, searchable: true },
    isbn: { type: "text", unique: true, label: "ISBN", filterable: true },
    author: { type: "text", label: "Author", sortable: true, searchable: true },
    publisher: { type: "text", label: "Publisher", filterable: true },
    publicationYear: { type: "integer", label: "Year" },
    category: { type: "text", label: "Category", filterable: true },
    subjectId: { type: "reference", reference: { table: "subjects", onDelete: "set null" }, label: "Subject" },
    schoolId: { type: "reference", reference: { table: "schools", onDelete: "cascade" } },
    quantity: { type: "integer", defaultValue: 0, label: "Quantity" },
    availableQuantity: { type: "integer", defaultValue: 0, label: "Available" },
    location: { type: "text", label: "Location/Shelf" },
    isActive: { type: "boolean", defaultValue: true, filterable: true },
    createdAt: { type: "timestamp", sortable: true },
    updatedAt: { type: "timestamp", sortable: true },
  },

  permissions: {
    read: ["school-admin", "teacher", "student", "parent"],
    create: ["school-admin"],
    update: ["school-admin"],
    delete: ["school-admin"],
  },

  ui: {
    title: "Library Book",
    titlePlural: "Library Books",
    basePath: "/school-admin/library",
    columns: [
      { key: "title", label: "Title", sortable: true, searchable: true },
      { key: "author", label: "Author", sortable: true },
      { key: "isbn", label: "ISBN", filterable: true },
      { key: "category", label: "Category", filterable: true },
      { key: "availableQuantity", label: "Available", sortable: true },
      { key: "location", label: "Location" },
    ],
  },
});
