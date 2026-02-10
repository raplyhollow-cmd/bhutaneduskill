/**
 * Zod Validation Schemas
 * Comprehensive input validation for all API endpoints
 */

import { z } from 'zod';

// ============================================================================
// COMMON VALIDATORS
// ============================================================================

/**
 * Bhutan phone number format (Country code +975 followed by 8 digits)
 * Format: +975 XX XX XX XX or 975XXXXXXXX
 */
export const bhutanPhoneSchema = z
  .string()
  .min(10)
  .max(15)
  .refine(
    (val) => {
      const cleaned = val.replace(/[\s+]/g, '');
      return cleaned === '975' + cleaned.slice(3) && cleaned.slice(3).length === 8;
    },
    { message: 'Invalid Bhutan phone number. Format: +975 XX XX XX XX' }
  );

/**
 * CID (Civil Identification Document) format for Bhutan
 * Format: 11 digits
 */
export const cidSchema = z
  .string()
  .length(11)
  .refine((val) => /^\d{11}$/.test(val), {
    message: 'CID must be exactly 11 digits',
  });

/**
 * Email validation
 */
export const emailSchema = z.string().email({ message: 'Invalid email address' });

/**
 * Password validation (minimum requirements)
 */
export const passwordSchema = z
  .string()
  .min(8, { message: 'Password must be at least 8 characters' })
  .refine((val) => /[A-Z]/.test(val), {
    message: 'Password must contain at least one uppercase letter',
  })
  .refine((val) => /[a-z]/.test(val), {
    message: 'Password must contain at least one lowercase letter',
  })
  .refine((val) => /\d/.test(val), {
    message: 'Password must contain at least one number',
  });

/**
 * Date validation (ISO format)
 */
export const dateSchema = z.string().refine((val) => !isNaN(Date.parse(val)), {
  message: 'Invalid date format',
});

/**
 * Enum for user roles
 */
export const userRoleEnum = z.enum(['student', 'teacher', 'parent', 'admin', 'counselor']);

/**
 * Enum for school types in Bhutan
 */
export const schoolTypeEnum = z.enum(['HSS', 'MSS', 'LSS', 'Primary', 'Private', 'RTC']);

/**
 * Enum for districts in Bhutan
 */
export const bhutanDistrictEnum = z.enum([
  'Thimphu',
  'Paro',
  'Punakha',
  'Wangdue Phodrang',
  'Tsirang',
  'Dagana',
  'Sarpang',
  'Trongsa',
  'Bumthang',
  'Zhemgang',
  'Mongar',
  'Lhuentse',
  'Trashigang',
  'Trashiyangtse',
  'Pemagatshel',
  'Samdrup Jongkhar',
  'Samtse',
  'Chukha',
  'Gasa',
]);

// ============================================================================
// USER SCHEMAS
// ============================================================================

/**
 * Schema for creating a new user
 */
export const createUserSchema = z.object({
  tenantId: z.string().min(1, 'Tenant ID is required'),
  schoolId: z.string().optional(),
  type: userRoleEnum,
  email: emailSchema.optional(),
  phone: bhutanPhoneSchema.optional(),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().max(50).optional(),
  profilePicture: z.string().url().optional(),
  dateOfBirth: dateSchema.optional(),
  classGrade: z.number().min(1).max(12).optional(),
  section: z.string().max(10).optional(),
  parentId: z.string().optional(),
  employeeId: z.string().optional(),
  subjects: z.array(z.string()).optional(),
  occupation: z.string().optional(),
  relationship: z.string().optional(),
  settings: z.record(z.any()).optional(),
});

/**
 * Schema for updating user profile
 */
export const updateUserSchema = createUserSchema.partial().extend({
  id: z.string().min(1, 'User ID is required'),
});

/**
 * Schema for user profile update (self-service)
 */
export const userProfileSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().max(50).optional(),
  phone: bhutanPhoneSchema.optional(),
  profilePicture: z.string().url().optional(),
  dateOfBirth: dateSchema.optional(),
  settings: z.record(z.any()).optional(),
});

// ============================================================================
// ASSESSMENT SCHEMAS
// ============================================================================

/**
 * RIASEC answer schema
 */
export const riasecAnswerSchema = z.object({
  assessmentId: z.string().optional(),
  answers: z.record(z.number().min(1).max(5)),
  status: z.enum(['in_progress', 'completed', 'abandoned']).optional(),
});

/**
 * MBTI answer schema
 */
export const mbtiAnswerSchema = z.object({
  assessmentId: z.string().optional(),
  answers: z.object({
    ei: z.array(z.number()),
    sn: z.array(z.number()),
    tf: z.array(z.number()),
    jp: z.array(z.number()),
  }),
  status: z.enum(['in_progress', 'completed', 'abandoned']).optional(),
});

/**
 * DISC answer schema
 */
export const discAnswerSchema = z.object({
  assessmentId: z.string().optional(),
  answers: z.record(z.number().min(1).max(4)),
  status: z.enum(['in_progress', 'completed', 'abandoned']).optional(),
});

/**
 * Work Values answer schema
 */
export const workValuesAnswerSchema = z.object({
  assessmentId: z.string().optional(),
  answers: z.object({
    achievement: z.number().min(1).max(5),
    independence: z.number().min(1).max(5),
    recognition: z.number().min(1).max(5),
    relationships: z.number().min(1).max(5),
    support: z.number().min(1).max(5),
    workingConditions: z.number().min(1).max(5),
  }),
  status: z.enum(['in_progress', 'completed', 'abandoned']).optional(),
});

/**
 * Learning Styles answer schema
 */
export const learningStylesAnswerSchema = z.object({
  assessmentId: z.string().optional(),
  answers: z.record(z.number().min(1).max(4)),
  status: z.enum(['in_progress', 'completed', 'abandoned']).optional(),
});

/**
 * General assessment submission schema
 */
export const assessmentSubmissionSchema = z.object({
  assessmentId: z.string().min(1, 'Assessment ID is required'),
  type: z.enum(['riasec', 'mbti', 'disc', 'work_values', 'learning_styles']),
  answers: z.record(z.any()),
});

// ============================================================================
// ACADEMIC SCHEMAS
// ============================================================================

/**
 * Question type for homework
 */
export const questionTypeEnum = z.enum([
  'multiple_choice',
  'short_answer',
  'essay',
  'fill_blank',
  'match',
  'numeric',
  'math_expression',
  'graph_plot',
  'handwriting',
]);

/**
 * Question schema
 */
export const questionSchema = z.object({
  id: z.string(),
  type: questionTypeEnum,
  question: z.string().min(1),
  options: z.array(z.string()).optional(),
  correctAnswer: z.union([z.string(), z.array(z.string())]).optional(),
  points: z.number().min(0),
  explanation: z.string().optional(),
  mathMode: z.boolean().optional(),
});

/**
 * Homework creation schema
 */
export const homeworkSchema = z.object({
  classId: z.string().min(1, 'Class ID is required'),
  subjectId: z.string().optional(),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  instructions: z.string().optional(),
  type: z.enum(['assignment', 'quiz', 'project', 'reading']),
  questions: z.array(questionSchema).min(1, 'At least one question is required'),
  attachments: z.array(z.object({
    name: z.string(),
    url: z.string().url(),
    type: z.string(),
    size: z.number(),
  })).optional(),
  externalLinks: z.array(z.object({
    title: z.string(),
    url: z.string().url(),
    provider: z.enum(['google_drive', 'onedrive', 'dropbox', 'other']),
  })).optional(),
  dueDate: dateSchema,
  lateSubmissionDeadline: dateSchema.optional(),
  maxPoints: z.number().min(0).optional(),
  passingPoints: z.number().min(0).optional(),
  timeLimit: z.number().min(1).optional(),
  attemptsAllowed: z.number().min(1).default(1),
  showAnswersAfter: z.enum(['immediate', 'after_due', 'manual']).optional(),
  isPublished: z.boolean().default(false),
});

/**
 * Homework submission schema
 */
export const homeworkSubmissionSchema = z.object({
  homeworkId: z.string().min(1, 'Homework ID is required'),
  answers: z.record(z.any()),
  attachments: z.array(z.object({
    name: z.string(),
    url: z.string().url(),
    type: z.string(),
    size: z.number(),
  })).optional(),
});

/**
 * Attendance record schema
 */
export const attendanceRecordSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  date: dateSchema,
  status: z.enum(['present', 'absent', 'late', 'excused', 'sick_leave']),
  checkInTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format').optional(),
  checkOutTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format').optional(),
  checkInLocation: z.object({
    latitude: z.number(),
    longitude: z.number(),
    accuracy: z.number(),
  }).optional(),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * Bulk attendance schema
 */
export const bulkAttendanceSchema = z.object({
  classId: z.string().min(1, 'Class ID is required'),
  date: dateSchema,
  records: z.array(z.object({
    studentId: z.string(),
    status: z.enum(['present', 'absent', 'late', 'excused', 'sick_leave']),
    checkInTime: z.string().optional(),
    notes: z.string().optional(),
  })).min(1, 'At least one record is required'),
});

/**
 * Exam result schema
 */
export const examResultSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  examType: z.enum(['midterm', 'final', 'unit_test', 'board_exam']),
  examName: z.string().min(1, 'Exam name is required'),
  examYear: z.number().min(2000).max(2100),
  subjectResults: z.array(z.object({
    subjectId: z.string(),
    subjectName: z.string(),
    marksObtained: z.number().min(0),
    maxMarks: z.number().min(1),
    percentage: z.number().min(0).max(100),
    grade: z.string(),
    remarks: z.string().optional(),
  })),
  boardExamRollNumber: z.string().optional(),
  boardRegistrationNumber: z.string().optional(),
});

// ============================================================================
// COMMUNICATION SCHEMAS
// ============================================================================

/**
 * Message schema
 */
export const messageSchema = z.object({
  conversationId: z.string().optional(),
  recipientId: z.string().min(1, 'Recipient ID is required'),
  content: z.string().min(1, 'Message content is required').max(5000),
  attachments: z.array(z.object({
    name: z.string(),
    url: z.string().url(),
    type: z.string(),
    size: z.number(),
  })).optional(),
});

/**
 * Announcement schema
 */
export const announcementSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().min(1, 'Content is required').max(10000),
  targetAudience: z.array(z.enum(['student', 'teacher', 'parent', 'admin', 'counselor', 'all'])),
  targetSchools: z.array(z.string()).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  publishAt: dateSchema.optional(),
  expiresAt: dateSchema.optional(),
  attachments: z.array(z.object({
    name: z.string(),
    url: z.string().url(),
    type: z.string(),
  })).optional(),
});

// ============================================================================
// PAYMENT SCHEMAS
// ============================================================================

/**
 * RMA Payment Gateway transaction schema
 */
export const rmaPaymentSchema = z.object({
  studentFeeId: z.string().min(1, 'Student Fee ID is required'),
  amount: z.number().min(1, 'Amount must be positive'),
  currency: z.enum(['BTN', 'USD']).default('BTN'),
  paymentMethod: z.enum(['rma_internet_banking', 'rma_mobile_banking', 'card']),
  returnUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

/**
 * Payment verification schema
 */
export const paymentVerifySchema = z.object({
  transactionId: z.string().min(1, 'Transaction ID is required'),
  paymentRef: z.string().min(1, 'Payment reference is required'),
  amount: z.number().min(0),
});

/**
 * Refund request schema
 */
export const refundRequestSchema = z.object({
  paymentId: z.string().min(1, 'Payment ID is required'),
  reason: z.string().min(10, 'Reason must be at least 10 characters').max(500),
  amount: z.number().min(1, 'Amount must be positive'),
});

/**
 * Fee structure schema
 */
export const feeStructureSchema = z.object({
  schoolId: z.string().min(1, 'School ID is required'),
  name: z.string().min(1, 'Name is required').max(200),
  grade: z.number().min(1).max(12),
  academicYear: z.string().min(1, 'Academic year is required'),
  fees: z.array(z.object({
    id: z.string(),
    name: z.string(),
    amount: z.number().min(0),
    frequency: z.enum(['monthly', 'quarterly', 'semester', 'annual', 'one_time']),
    isOptional: z.boolean(),
    dueDate: dateSchema.optional(),
  })),
  totalAnnualAmount: z.number().min(0),
  applicableScholarships: z.array(z.string()).optional(),
});

// ============================================================================
// ADMIN SCHEMAS
// ============================================================================

/**
 * School creation schema
 */
export const schoolSchema = z.object({
  tenantId: z.string().min(1, 'Tenant ID is required'),
  districtId: z.string().optional(),
  name: z.string().min(1, 'School name is required').max(200),
  code: z.string().min(1, 'School code is required').max(20),
  domain: z.string().optional(),
  address: z.string().optional(),
  contactEmail: emailSchema.optional(),
  contactPhone: bhutanPhoneSchema.optional(),
  schoolType: schoolTypeEnum,
  level: z.string().optional(),
  settings: z.record(z.any()).optional(),
});

/**
 * Subject schema
 */
export const subjectSchema = z.object({
  schoolId: z.string().min(1, 'School ID is required'),
  code: z.string().min(1, 'Subject code is required').max(20),
  name: z.string().min(1, 'Subject name is required').max(100),
  nameDzongkha: z.string().optional(),
  grade: z.number().min(1).max(12).optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
});

/**
 * Class creation schema
 */
export const classSchema = z.object({
  schoolId: z.string().min(1, 'School ID is required'),
  teacherId: z.string().min(1, 'Teacher ID is required'),
  name: z.string().min(1, 'Class name is required').max(50),
  grade: z.number().min(1).max(12),
  section: z.string().max(10).optional(),
  academicYear: z.string().min(1, 'Academic year is required'),
  students: z.array(z.string()).default([]),
});

// ============================================================================
// TUITION MARKETPLACE SCHEMAS
// ============================================================================

/**
 * Tutor profile schema
 */
export const tutorProfileSchema = z.object({
  bio: z.string().min(50, 'Bio must be at least 50 characters').max(1000),
  qualifications: z.array(z.object({
    degree: z.string(),
    institution: z.string(),
    year: z.number().min(1950).max(new Date().getFullYear() + 5),
  })),
  experience: z.number().min(0).max(50),
  subjects: z.array(z.string()).min(1, 'At least one subject is required'),
  gradeLevels: z.array(z.number().min(1).max(12)),
  location: z.object({
    district: bhutanDistrictEnum,
    city: z.string(),
    area: z.string(),
    coordinates: z.object({
      latitude: z.number(),
      longitude: z.number(),
    }),
  }).optional(),
  travelRadius: z.number().min(0).max(100).optional(),
  hourlyRateOnline: z.number().min(0),
  hourlyRatePhysical: z.number().min(0),
  availableDays: z.array(z.string()),
  availableSlots: z.array(z.object({
    day: z.string(),
    startTime: z.string(),
    endTime: z.string(),
  })),
});

/**
 * Tuition course schema
 */
export const tuitionCourseSchema = z.object({
  categoryId: z.string().optional(),
  title: z.string().min(1).max(200),
  description: z.string(),
  thumbnail: z.string().url().optional(),
  type: z.enum(['online_recorded', 'online_live', 'physical']),
  location: z.object({
    district: bhutanDistrictEnum,
    area: z.string(),
    fullAddress: z.string(),
    coordinates: z.object({
      latitude: z.number(),
      longitude: z.number(),
    }),
  }).optional(),
  gradeLevel: z.number().min(1).max(12).optional(),
  maxStudents: z.number().min(1).optional(),
  schedule: z.array(z.object({
    day: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    startDate: dateSchema,
    endDate: dateSchema,
  })).optional(),
  lessons: z.array(z.object({
    id: z.string(),
    title: z.string(),
    videoUrl: z.string().url(),
    duration: z.number(),
    order: z.number(),
    isFree: z.boolean(),
  })).optional(),
  price: z.number().min(0),
  discountPrice: z.number().min(0).optional(),
  discountValidUntil: dateSchema.optional(),
});

// ============================================================================
// EXPORT ALL SCHEMAS
// ============================================================================

export const validationSchemas = {
  // User
  createUser: createUserSchema,
  updateUser: updateUserSchema,
  userProfile: userProfileSchema,

  // Assessments
  riasecAnswer: riasecAnswerSchema,
  mbtiAnswer: mbtiAnswerSchema,
  discAnswer: discAnswerSchema,
  workValuesAnswer: workValuesAnswerSchema,
  learningStylesAnswer: learningStylesAnswerSchema,
  assessmentSubmission: assessmentSubmissionSchema,

  // Academic
  homework: homeworkSchema,
  homeworkSubmission: homeworkSubmissionSchema,
  attendanceRecord: attendanceRecordSchema,
  bulkAttendance: bulkAttendanceSchema,
  examResult: examResultSchema,

  // Communication
  message: messageSchema,
  announcement: announcementSchema,

  // Payment
  rmaPayment: rmaPaymentSchema,
  paymentVerify: paymentVerifySchema,
  refundRequest: refundRequestSchema,
  feeStructure: feeStructureSchema,

  // Admin
  school: schoolSchema,
  subject: subjectSchema,
  class: classSchema,

  // Tuition
  tutorProfile: tutorProfileSchema,
  tuitionCourse: tuitionCourseSchema,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validate request body against a schema
 */
export function validateBody<T>(schema: z.ZodSchema<T>, body: unknown): {
  success: boolean;
  data?: T;
  errors?: z.ZodError;
} {
  const result = schema.safeParse(body);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return { success: false, errors: result.error };
}

/**
 * Format Zod errors for API responses
 */
export function formatZodError(error: z.ZodError): Array<{
  field: string;
  message: string;
}> {
  return error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));
}
