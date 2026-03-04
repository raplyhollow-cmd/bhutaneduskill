# Unified Architecture - Complete Migration
# Generated: 2026-03-04T05:00:00.000Z
# Bhutan EduSkill Platform - 37 Features

-- ============================================================================
-- HIGH PRIORITY FEATURES
-- ============================================================================

-- Homework
CREATE TABLE IF NOT EXISTS homework (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  classId TEXT NOT NULL,
  subjectId TEXT,
  teacherId TEXT,
  schoolId TEXT,
  assignedDate TEXT NOT NULL,
  dueDate TEXT,
  status TEXT NOT NULL,
  submissionType TEXT,
  maxMarks INTEGER,
  attachments TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT homework_classId_fk FOREIGN KEY (classId) REFERENCES classes (id) ON DELETE NO ACTION,
  CONSTRAINT homework_subjectId_fk FOREIGN KEY (subjectId) REFERENCES subjects (id) ON DELETE SET NULL,
  CONSTRAINT homework_teacherId_fk FOREIGN KEY (teacherId) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT homework_schoolId_fk FOREIGN KEY (schoolId) REFERENCES schools (id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_homework_classId ON homework (classId);
CREATE INDEX IF NOT EXISTS idx_homework_subjectId ON homework (subjectId);
CREATE INDEX IF NOT EXISTS idx_homework_status ON homework (status);
COMMENT ON TABLE homework IS 'Homework assignments for students';

-- Lessons
CREATE TABLE IF NOT EXISTS lessons (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  classId TEXT NOT NULL,
  subjectId TEXT NOT NULL,
  teacherId TEXT,
  schoolId TEXT,
  lessonDate TEXT NOT NULL,
  startTime TEXT,
  endTime TEXT,
  roomNumber TEXT,
  status TEXT NOT NULL,
  topics TEXT,
  resources TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT lessons_classId_fk FOREIGN KEY (classId) REFERENCES classes (id) ON DELETE NO ACTION,
  CONSTRAINT lessons_subjectId_fk FOREIGN KEY (subjectId) REFERENCES subjects (id) ON DELETE NO ACTION,
  CONSTRAINT lessons_teacherId_fk FOREIGN KEY (teacherId) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT lessons_schoolId_fk FOREIGN KEY (schoolId) REFERENCES schools (id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_lessons_classId ON lessons (classId);
CREATE INDEX IF NOT EXISTS idx_lessons_subjectId ON lessons (subjectId);
CREATE INDEX IF NOT EXISTS idx_lessons_date ON lessons (lessonDate);
COMMENT ON TABLE lessons IS 'Lesson plans and schedules';

-- Skills
CREATE TABLE IF NOT EXISTS skills (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT UNIQUE,
  category TEXT NOT NULL,
  description TEXT,
  proficiencyLevels TEXT,
  schoolId TEXT,
  departmentId TEXT,
  isActive BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT skills_departmentId_fk FOREIGN KEY (departmentId) REFERENCES departments (id) ON DELETE SET NULL,
  CONSTRAINT skills_schoolId_fk FOREIGN KEY (schoolId) REFERENCES schools (id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_skills_category ON skills (category);
CREATE INDEX IF NOT EXISTS idx_skills_departmentId ON skills (departmentId);
CREATE INDEX IF NOT EXISTS idx_skills_isActive ON skills (isActive);
COMMENT ON TABLE skills IS 'Skills catalog for student assessment';

-- Student Skills
CREATE TABLE IF NOT EXISTS student_skills (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  studentId TEXT NOT NULL,
  skillId TEXT NOT NULL,
  proficiencyLevel TEXT NOT NULL,
  assessedBy TEXT,
  assessmentDate TEXT,
  notes TEXT,
  evidence TEXT,
  schoolId TEXT,
  isActive BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT student_skills_studentId_fk FOREIGN KEY (studentId) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT student_skills_skillId_fk FOREIGN KEY (skillId) REFERENCES skills (id) ON DELETE CASCADE,
  CONSTRAINT student_skills_schoolId_fk FOREIGN KEY (schoolId) REFERENCES schools (id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_student_skills_studentId ON student_skills (studentId);
CREATE INDEX IF NOT EXISTS idx_student_skills_skillId ON student_skills (skillId);
COMMENT ON TABLE student_skills IS 'Student skill assessments and achievements';

-- Exams
CREATE TABLE IF NOT EXISTS exams (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  examType TEXT NOT NULL,
  classId TEXT NOT NULL,
  subjectId TEXT NOT NULL,
  schoolId TEXT,
  examDate TEXT NOT NULL,
  startTime TEXT,
  duration INTEGER,
  totalMarks INTEGER,
  passingMarks INTEGER,
  instructions TEXT,
  status TEXT NOT NULL,
  createdBy TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT exams_classId_fk FOREIGN KEY (classId) REFERENCES classes (id) ON DELETE NO ACTION,
  CONSTRAINT exams_subjectId_fk FOREIGN KEY (subjectId) REFERENCES subjects (id) ON DELETE NO ACTION,
  CONSTRAINT exams_schoolId_fk FOREIGN KEY (schoolId) REFERENCES schools (id) ON DELETE CASCADE,
  CONSTRAINT exams_createdBy_fk FOREIGN KEY (createdBy) REFERENCES users (id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_exams_classId ON exams (classId);
CREATE INDEX IF NOT EXISTS idx_exams_subjectId ON exams (subjectId);
CREATE INDEX IF NOT EXISTS idx_exams_status ON exams (status);
COMMENT ON TABLE exams IS 'Examinations and assessments';

-- Results
CREATE TABLE IF NOT EXISTS results (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  studentId TEXT NOT NULL,
  examId TEXT NOT NULL,
  classId TEXT,
  subjectId TEXT,
  schoolId TEXT,
  marksObtained INTEGER,
  totalMarks INTEGER,
  percentage DOUBLE PRECISION,
  grade TEXT,
  remarks TEXT,
  status TEXT NOT NULL,
  assessedBy TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT results_studentId_fk FOREIGN KEY (studentId) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT results_examId_fk FOREIGN KEY (examId) REFERENCES exams (id) ON DELETE CASCADE,
  CONSTRAINT results_schoolId_fk FOREIGN KEY (schoolId) REFERENCES schools (id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_results_studentId ON results (studentId);
CREATE INDEX IF NOT EXISTS idx_results_examId ON results (examId);
CREATE INDEX IF NOT EXISTS idx_results_status ON results (status);
COMMENT ON TABLE results IS 'Student exam results and marks';

-- ============================================================================
-- MEDIUM PRIORITY FEATURES
-- ============================================================================

-- Departments
CREATE TABLE IF NOT EXISTS departments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  schoolId TEXT NOT NULL,
  headId TEXT,
  description TEXT,
  isActive BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT departments_schoolId_fk FOREIGN KEY (schoolId) REFERENCES schools (id) ON DELETE CASCADE,
  CONSTRAINT departments_headId_fk FOREIGN KEY (headId) REFERENCES users (id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_departments_schoolId ON departments (schoolId);
COMMENT ON TABLE departments IS 'School departments for organization';

-- Batches
CREATE TABLE IF NOT EXISTS batches (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  schoolId TEXT NOT NULL,
  classId TEXT,
  year INTEGER,
  isActive BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT batches_schoolId_fk FOREIGN KEY (schoolId) REFERENCES schools (id) ON DELETE CASCADE,
  CONSTRAINT batches_classId_fk FOREIGN KEY (classId) REFERENCES classes (id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_batches_schoolId ON batches (schoolId);
COMMENT ON TABLE batches IS 'Student batches or cohorts';

-- Timetables
CREATE TABLE IF NOT EXISTS timetables (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  classId TEXT NOT NULL,
  schoolId TEXT,
  dayOfWeek TEXT NOT NULL,
  periodNumber INTEGER NOT NULL,
  subjectId TEXT,
  teacherId TEXT,
  roomNumber TEXT,
  startTime TEXT,
  endTime TEXT,
  semester TEXT,
  academicYear TEXT,
  isActive BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT timetables_classId_fk FOREIGN KEY (classId) REFERENCES classes (id) ON DELETE CASCADE,
  CONSTRAINT timetables_schoolId_fk FOREIGN KEY (schoolId) REFERENCES schools (id) ON DELETE CASCADE,
  CONSTRAINT timetables_subjectId_fk FOREIGN KEY (subjectId) REFERENCES subjects (id) ON DELETE SET NULL,
  CONSTRAINT timetables_teacherId_fk FOREIGN KEY (teacherId) REFERENCES users (id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_timetables_classId ON timetables (classId);
CREATE INDEX IF NOT EXISTS idx_timetables_day_period ON timetables (dayOfWeek, periodNumber);
COMMENT ON TABLE timetables IS 'Class timetables for scheduling';

-- Announcements
CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  category TEXT NOT NULL,
  priority TEXT NOT NULL,
  targetAudience TEXT NOT NULL,
  schoolId TEXT NOT NULL,
  createdBy TEXT NOT NULL,
  publishDate TEXT,
  expiryDate TEXT,
  isActive BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT announcements_schoolId_fk FOREIGN KEY (schoolId) REFERENCES schools (id) ON DELETE CASCADE,
  CONSTRAINT announcements_createdBy_fk FOREIGN KEY (createdBy) REFERENCES users (id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_announcements_schoolId ON announcements (schoolId);
CREATE INDEX IF NOT EXISTS idx_announcements_category ON announcements (category);
COMMENT ON TABLE announcements IS 'School announcements and notices';

-- Behavior Records
CREATE TABLE IF NOT EXISTS behavior_records (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  studentId TEXT NOT NULL,
  schoolId TEXT,
  classId TEXT,
  incidentDate TEXT NOT NULL,
  incidentType TEXT NOT NULL,
  severity TEXT NOT NULL,
  description TEXT,
  actionTaken TEXT,
  reportedBy TEXT,
  verifiedBy TEXT,
  status TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT behavior_records_studentId_fk FOREIGN KEY (studentId) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT behavior_records_classId_fk FOREIGN KEY (classId) REFERENCES classes (id) ON DELETE SET NULL,
  CONSTRAINT behavior_records_reportedBy_fk FOREIGN KEY (reportedBy) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT behavior_records_verifiedBy_fk FOREIGN KEY (verifiedBy) REFERENCES users (id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_behavior_records_studentId ON behavior_records (studentId);
CREATE INDEX IF NOT EXISTS idx_behavior_records_date ON behavior_records (incidentDate);
COMMENT ON TABLE behavior_records IS 'Student behavior incident records';

-- Interventions
CREATE TABLE IF NOT EXISTS interventions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  studentId TEXT NOT NULL,
  schoolId TEXT,
  type TEXT NOT NULL,
  severity TEXT NOT NULL,
  description TEXT,
  startDate TEXT,
  endDate TEXT,
  assignedTo TEXT,
  status TEXT NOT NULL,
  outcome TEXT,
  followUpDate TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT interventions_studentId_fk FOREIGN KEY (studentId) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT interventions_assignedTo_fk FOREIGN KEY (assignedTo) REFERENCES users (id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_interventions_studentId ON interventions (studentId);
CREATE INDEX IF NOT EXISTS idx_interventions_status ON interventions (status);
COMMENT ON TABLE interventions IS 'Student intervention and support programs';

-- ============================================================================
-- LOW PRIORITY FEATURES
-- ============================================================================

-- Transport
CREATE TABLE IF NOT EXISTS transport (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicleNumber TEXT NOT NULL UNIQUE,
  vehicleType TEXT NOT NULL,
  capacity INTEGER,
  driverName TEXT,
  driverPhone TEXT,
  schoolId TEXT,
  route TEXT,
  isActive BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT transport_schoolId_fk FOREIGN KEY (schoolId) REFERENCES schools (id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_transport_schoolId ON transport (schoolId);
COMMENT ON TABLE transport IS 'Transport vehicles for school';

-- Transport Allocations
CREATE TABLE IF NOT EXISTS transport_allocations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  studentId TEXT NOT NULL,
  transportId TEXT NOT NULL,
  schoolId TEXT,
  pickupPoint TEXT,
  dropPoint TEXT,
  pickupTime TEXT,
  shift TEXT,
  isActive BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT transport_allocations_studentId_fk FOREIGN KEY (studentId) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT transport_allocations_transportId_fk FOREIGN KEY (transportId) REFERENCES transport (id) ON DELETE CASCADE,
  CONSTRAINT transport_allocations_schoolId_fk FOREIGN KEY (schoolId) REFERENCES schools (id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_transport_allocations_studentId ON transport_allocations (studentId);
COMMENT ON TABLE transport_allocations IS 'Transport route allocations for students';

-- Library Books
CREATE TABLE IF NOT EXISTS library_books (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  isbn TEXT UNIQUE,
  author TEXT,
  publisher TEXT,
  publicationYear INTEGER,
  category TEXT,
  subjectId TEXT,
  schoolId TEXT,
  quantity INTEGER DEFAULT 0,
  availableQuantity INTEGER DEFAULT 0,
  location TEXT,
  isActive BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT library_books_subjectId_fk FOREIGN KEY (subjectId) REFERENCES subjects (id) ON DELETE SET NULL,
  CONSTRAINT library_books_schoolId_fk FOREIGN KEY (schoolId) REFERENCES schools (id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_library_books_subjectId ON library_books (subjectId);
COMMENT ON TABLE library_books IS 'Library book inventory';

-- Fees
CREATE TABLE IF NOT EXISTS fees (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  feeType TEXT NOT NULL,
  amount DOUBLE PRECISION NOT NULL,
  currency TEXT DEFAULT 'BTN',
  classId TEXT,
  schoolId TEXT,
  dueDate TEXT,
  academicYear TEXT,
  term TEXT,
  isRecurring BOOLEAN DEFAULT FALSE,
  isActive BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT fees_classId_fk FOREIGN KEY (classId) REFERENCES classes (id) ON DELETE SET NULL,
  CONSTRAINT fees_schoolId_fk FOREIGN KEY (schoolId) REFERENCES schools (id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_fees_classId ON fees (classId);
CREATE INDEX IF NOT EXISTS idx_fees_type ON fees (feeType);
COMMENT ON TABLE fees IS 'Fee definitions for students';

-- Fee Payments
CREATE TABLE IF NOT EXISTS fee_payments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  studentId TEXT NOT NULL,
  feeId TEXT NOT NULL,
  schoolId TEXT,
  amount DOUBLE PRECISION NOT NULL,
  paymentDate TEXT NOT NULL,
  paymentMethod TEXT,
  transactionId TEXT,
  status TEXT NOT NULL,
  receiptNumber TEXT,
  remarks TEXT,
  collectedBy TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT fee_payments_studentId_fk FOREIGN KEY (studentId) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fee_payments_feeId_fk FOREIGN KEY (feeId) REFERENCES fees (id) ON DELETE CASCADE,
  CONSTRAINT fee_payments_collectedBy_fk FOREIGN KEY (collectedBy) REFERENCES users (id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_fee_payments_studentId ON fee_payments (studentId);
CREATE INDEX IF NOT EXISTS idx_fee_payments_status ON fee_payments (status);
COMMENT ON TABLE fee_payments IS 'Student fee payment records';

-- Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  schoolId TEXT NOT NULL,
  planId TEXT NOT NULL,
  startDate TEXT NOT NULL,
  endDate TEXT,
  status TEXT NOT NULL,
  maxUsers INTEGER,
  currentUsers INTEGER DEFAULT 0,
  billingCycle TEXT,
  amount DOUBLE PRECISION,
  currency TEXT DEFAULT 'BTN',
  autoRenew BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT subscriptions_schoolId_fk FOREIGN KEY (schoolId) REFERENCES schools (id) ON DELETE CASCADE,
  CONSTRAINT subscriptions_planId_fk FOREIGN KEY (planId) REFERENCES plans (id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS idx_subscriptions_schoolId ON subscriptions (schoolId);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions (status);
COMMENT ON TABLE subscriptions IS 'School subscription plans';

-- Plans
CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  maxUsers INTEGER,
  maxStorage INTEGER,
  price DOUBLE PRECISION,
  currency TEXT DEFAULT 'BTN',
  billingCycle TEXT,
  features TEXT,
  isActive BOOLEAN DEFAULT TRUE,
  tier TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE plans IS 'Subscription plan definitions';

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  invoiceNumber TEXT NOT NULL UNIQUE,
  subscriptionId TEXT,
  schoolId TEXT NOT NULL,
  issueDate TEXT NOT NULL,
  dueDate TEXT,
  amount DOUBLE PRECISION NOT NULL,
  currency TEXT DEFAULT 'BTN',
  status TEXT NOT NULL,
  paidDate TEXT,
  paymentMethod TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT invoices_subscriptionId_fk FOREIGN KEY (subscriptionId) REFERENCES subscriptions (id) ON DELETE CASCADE,
  CONSTRAINT invoices_schoolId_fk FOREIGN KEY (schoolId) REFERENCES schools (id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_invoices_schoolId ON invoices (schoolId);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices (status);
COMMENT ON TABLE invoices IS 'Billing invoices for schools';

-- Reports
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  reportType TEXT NOT NULL,
  schoolId TEXT,
  classId TEXT,
  generatedBy TEXT,
  generatedFor TEXT,
  reportData TEXT,
  dateFrom TEXT,
  dateTo TEXT,
  format TEXT,
  fileUrl TEXT,
  status TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT reports_classId_fk FOREIGN KEY (classId) REFERENCES classes (id) ON DELETE SET NULL,
  CONSTRAINT reports_schoolId_fk FOREIGN KEY (schoolId) REFERENCES schools (id) ON DELETE CASCADE,
  CONSTRAINT reports_generatedBy_fk FOREIGN KEY (generatedBy) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT reports_generatedFor_fk FOREIGN KEY (generatedFor) REFERENCES users (id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_reports_schoolId ON reports (schoolId);
CREATE INDEX IF NOT EXISTS idx_reports_type ON reports (reportType);
COMMENT ON TABLE reports IS 'Generated reports for analytics';

-- Analytics Dashboards
CREATE TABLE IF NOT EXISTS analytics (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  schoolId TEXT,
  config TEXT,
  widgets TEXT,
  createdBy TEXT,
  isPublic BOOLEAN DEFAULT FALSE,
  isActive BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT analytics_schoolId_fk FOREIGN KEY (schoolId) REFERENCES schools (id) ON DELETE CASCADE
);
COMMENT ON TABLE analytics IS 'Custom analytics dashboards';

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  userId TEXT,
  schoolId TEXT,
  action TEXT NOT NULL,
  entityType TEXT,
  entityId TEXT,
  changes TEXT,
  ipAddress TEXT,
  userAgent TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_userId ON audit_logs (userId);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs (timestamp);
COMMENT ON TABLE audit_logs IS 'System audit trail for compliance';

-- Teaching Resources
CREATE TABLE IF NOT EXISTS teaching_resources (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  resourceType TEXT NOT NULL,
  subjectId TEXT,
  classId TEXT,
  teacherId TEXT,
  schoolId TEXT,
  fileUrl TEXT,
  fileSize INTEGER,
  tags TEXT,
  isShared BOOLEAN DEFAULT FALSE,
  downloadCount INTEGER DEFAULT 0,
  isActive BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT teaching_resources_subjectId_fk FOREIGN KEY (subjectId) REFERENCES subjects (id) ON DELETE SET NULL,
  CONSTRAINT teaching_resources_classId_fk FOREIGN KEY (classId) REFERENCES classes (id) ON DELETE SET NULL,
  CONSTRAINT teaching_resources_teacherId_fk FOREIGN KEY (teacherId) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT teaching_resources_schoolId_fk FOREIGN KEY (schoolId) REFERENCES schools (id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_teaching_resources_teacherId ON teaching_resources (teacherId);
COMMENT ON TABLE teaching_resources IS 'Shared teaching materials and resources';

-- Communication
CREATE TABLE IF NOT EXISTS communication (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  message TEXT,
  senderId TEXT,
  recipientId TEXT NOT NULL,
  schoolId TEXT,
  sentAt TIMESTAMP WITH TIME ZONE,
  readAt TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL,
  priority TEXT,
  parentId TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT communication_senderId_fk FOREIGN KEY (senderId) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT communication_recipientId_fk FOREIGN KEY (recipientId) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT communication_schoolId_fk FOREIGN KEY (schoolId) REFERENCES schools (id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_communication_recipientId ON communication (recipientId);
COMMENT ON TABLE communication IS 'Internal messaging system';

-- Meetings
CREATE TABLE IF NOT EXISTS meetings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  meetingType TEXT NOT NULL,
  schoolId TEXT,
  scheduledDate TEXT NOT NULL,
  startTime TEXT,
  endTime TEXT,
  location TEXT,
  attendees TEXT,
  agenda TEXT,
  minutes TEXT,
  status TEXT NOT NULL,
  createdBy TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT meetings_schoolId_fk FOREIGN KEY (schoolId) REFERENCES schools (id) ON DELETE CASCADE,
  CONSTRAINT meetings_createdBy_fk FOREIGN KEY (createdBy) REFERENCES users (id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_meetings_schoolId ON meetings (schoolId);
COMMENT ON TABLE meetings IS 'Meeting schedules for parents and staff';

-- Sessions
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  sessionType TEXT NOT NULL,
  studentId TEXT NOT NULL,
  teacherId TEXT,
  schoolId TEXT,
  scheduledDate TEXT,
  startTime TEXT,
  endTime TEXT,
  location TEXT,
  notes TEXT,
  outcome TEXT,
  status TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT sessions_studentId_fk FOREIGN KEY (studentId) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT sessions_teacherId_fk FOREIGN KEY (teacherId) REFERENCES users (id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_studentId ON sessions (studentId);
COMMENT ON TABLE sessions IS 'Counseling and tutoring sessions';

-- Counselor Notes
CREATE TABLE IF NOT EXISTS counselor_notes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  studentId TEXT NOT NULL,
  counselorId TEXT,
  schoolId TEXT,
  noteDate TEXT NOT NULL,
  category TEXT NOT NULL,
  confidentiality TEXT NOT NULL,
  notes TEXT,
  followUpRequired BOOLEAN DEFAULT FALSE,
  followUpDate TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT counselor_notes_studentId_fk FOREIGN KEY (studentId) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT counselor_notes_counselorId_fk FOREIGN KEY (counselorId) REFERENCES users (id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_counselor_notes_studentId ON counselor_notes (studentId);
COMMENT ON TABLE counselor_notes IS 'Counselor notes and observations';

-- Treatment Plans
CREATE TABLE IF NOT EXISTS treatment_plans (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  studentId TEXT NOT NULL,
  counselorId TEXT,
  schoolId TEXT,
  planType TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  goals TEXT,
  interventions TEXT,
  startDate TEXT,
  endDate TEXT,
  status TEXT NOT NULL,
  reviewDate TEXT,
  outcomes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT treatment_plans_studentId_fk FOREIGN KEY (studentId) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT treatment_plans_counselorId_fk FOREIGN KEY (counselorId) REFERENCES users (id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_treatment_plans_studentId ON treatment_plans (studentId);
COMMENT ON TABLE treatment_plans IS 'Student intervention and support plans';

-- Workforce Data
CREATE TABLE IF NOT EXISTS workforce_data (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  schoolId TEXT NOT NULL,
  dataType TEXT NOT NULL,
  academicYear TEXT,
  data TEXT,
  source TEXT,
  verifiedBy TEXT,
  verifiedAt TIMESTAMP WITH TIME ZONE,
  isActive BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT workforce_data_schoolId_fk FOREIGN KEY (schoolId) REFERENCES schools (id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_workforce_data_schoolId ON workforce_data (schoolId);
COMMENT ON TABLE workforce_data IS 'Ministry workforce and education data';
