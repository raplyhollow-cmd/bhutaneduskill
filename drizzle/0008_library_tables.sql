-- Migration: Add Library Management Tables
-- Created: 2025-02-17
-- Description: Adds library_members, library_reservations, and digital_resources tables

-- Library Members Table
CREATE TABLE IF NOT EXISTS library_members (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    member_type TEXT NOT NULL, -- 'student' | 'teacher' | 'staff'
    membership_number TEXT NOT NULL UNIQUE,
    membership_status TEXT NOT NULL, -- 'active' | 'inactive' | 'suspended'
    joined_date TEXT NOT NULL,
    expiry_date TEXT,
    borrowing_limit INTEGER DEFAULT 5,
    currently_borrowed INTEGER DEFAULT 0,
    total_borrowed INTEGER DEFAULT 0,
    fine_due INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Library Reservations Table
CREATE TABLE IF NOT EXISTS library_reservations (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reservation_date TEXT NOT NULL,
    expiry_date TEXT NOT NULL,
    status TEXT NOT NULL, -- 'pending' | 'ready' | 'fulfilled' | 'cancelled' | 'expired'
    priority INTEGER DEFAULT 1,
    notified_date TEXT,
    fulfilled_date TEXT,
    cancelled_date TEXT,
    cancellation_reason TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Digital Resources Table
CREATE TABLE IF NOT EXISTS digital_resources (
    id TEXT PRIMARY KEY,
    school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    resource_type TEXT NOT NULL, -- 'ebook' | 'audio' | 'video' | 'document' | 'journal' | 'magazine'
    format TEXT NOT NULL, -- 'pdf' | 'epub' | 'mp3' | 'mp4' | 'doc' etc.
    file_url TEXT NOT NULL,
    file_size INTEGER, -- in bytes
    duration INTEGER, -- For audio/video in seconds
    pages INTEGER, -- For ebooks/documents
    author TEXT,
    publisher TEXT,
    publication_year INTEGER,
    isbn TEXT,
    category TEXT,
    tags JSONB,
    language TEXT DEFAULT 'en',
    cover_image TEXT,
    access_level TEXT NOT NULL, -- 'public' | 'student' | 'teacher' | 'admin'
    download_allowed BOOLEAN DEFAULT TRUE,
    view_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    uploaded_by TEXT REFERENCES users(id),
    license_info TEXT,
    source_url TEXT,
    expiration_date TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_library_members_school_id ON library_members(school_id);
CREATE INDEX IF NOT EXISTS idx_library_members_user_id ON library_members(user_id);
CREATE INDEX IF NOT EXISTS idx_library_members_status ON library_members(membership_status);

CREATE INDEX IF NOT EXISTS idx_library_reservations_school_id ON library_reservations(school_id);
CREATE INDEX IF NOT EXISTS idx_library_reservations_book_id ON library_reservations(book_id);
CREATE INDEX IF NOT EXISTS idx_library_reservations_user_id ON library_reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_library_reservations_status ON library_reservations(status);

CREATE INDEX IF NOT EXISTS idx_digital_resources_school_id ON digital_resources(school_id);
CREATE INDEX IF NOT EXISTS idx_digital_resources_type ON digital_resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_digital_resources_category ON digital_resources(category);
CREATE INDEX IF NOT EXISTS idx_digital_resources_access_level ON digital_resources(access_level);
CREATE INDEX IF NOT EXISTS idx_digital_resources_is_active ON digital_resources(is_active);
