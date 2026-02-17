"use server";

/**
 * SERVER ACTIONS - CONTENT MANAGEMENT
 *
 * Server actions for content CRUD operations (colleges, scholarships, RUB programs).
 * These are used by the Platform Admin content management page.
 */


import { db } from "@/lib/db";
import { colleges, scholarships, rubPrograms } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";

// ============================================================================
// COLLEGES
// ============================================================================

/**
 * Get all colleges from the database
 */
export async function getColleges(limit = 500) {
  const authResult = await requireAuth(['admin']);
  if ('error' in authResult) {
    throw new Error(authResult.error);
  }
  const { userId } = authResult;

  try {
    const allColleges = await db
      .select()
      .from(colleges)
      .orderBy(desc(colleges.createdAt))
      .limit(limit);

    return allColleges.map((college) => ({
      ...college,
      hasHostel: !!college.hasHostel,
      hasLibrary: !!college.hasLibrary,
      hasLab: !!college.hasLab,
      hasSports: !!college.hasSports,
      isActive: !!college.isActive,
    }));
  } catch (error) {
    logger.error(error, { action: "getColleges", userId });
    throw new Error("Failed to fetch colleges");
  }
}

/**
 * Get a single college by ID
 */
export async function getCollegeById(id: string) {
  const authResult = await requireAuth(['admin']);
  if ('error' in authResult) {
    throw new Error(authResult.error);
  }
  const { userId } = authResult;

  try {
    const college = await db.query.colleges.findFirst({
      where: eq(colleges.id, id),
    });

    if (!college) {
      throw new Error("College not found");
    }

    return {
      ...college,
      hasHostel: !!college.hasHostel,
      hasLibrary: !!college.hasLibrary,
      hasLab: !!college.hasLab,
      hasSports: !!college.hasSports,
      isActive: !!college.isActive,
    };
  } catch (error) {
    logger.error(error, { action: "getCollegeById", id, userId });
    throw new Error("Failed to fetch college");
  }
}

/**
 * Create a new college
 */
export async function createCollege(data: {
  name: string;
  code: string;
  type: "constituent" | "affiliated";
  dzongkhag: string;
  location: string;
  latitude?: string;
  longitude?: string;
  website?: string;
  email?: string;
  phone?: string;
  programs?: Array<{
    code: string;
    name: string;
    level: "certificate" | "diploma" | "bachelor" | "master" | "phd";
    duration: number;
    capacity: number;
  }>;
  hasHostel?: boolean;
  hasLibrary?: boolean;
  hasLab?: boolean;
  hasSports?: boolean;
  description?: string;
  isActive?: boolean;
}) {
  const authResult = await requireAuth(['admin']);
  if ('error' in authResult) {
    throw new Error(authResult.error);
  }
  const { userId } = authResult;

  try {
    const collegeId = `college_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const now = new Date();

    const [newCollege] = await db
      .insert(colleges)
      .values({
        id: collegeId,
        name: data.name,
        code: data.code,
        type: data.type,
        dzongkhag: data.dzongkhag,
        location: data.location,
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        website: data.website || null,
        email: data.email || null,
        phone: data.phone || null,
        programs: data.programs || null,
        hasHostel: !!data.hasHostel,
        hasLibrary: data.hasLibrary !== undefined ? data.hasLibrary : true,
        hasLab: !!data.hasLab,
        hasSports: !!data.hasSports,
        description: data.description || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    revalidatePath("/admin/content");
    revalidatePath("/dashboard/colleges");

    return newCollege;
  } catch (error) {
    logger.error(error, { action: "createCollege", userId });
    throw new Error("Failed to create college");
  }
}

/**
 * Update an existing college
 */
export async function updateCollege(
  id: string,
  data: {
    name?: string;
    code?: string;
    type?: "constituent" | "affiliated";
    dzongkhag?: string;
    location?: string;
    latitude?: string;
    longitude?: string;
    website?: string;
    email?: string;
    phone?: string;
    programs?: Array<{
      code: string;
      name: string;
      level: "certificate" | "diploma" | "bachelor" | "master" | "phd";
      duration: number;
      capacity: number;
    }>;
    hasHostel?: boolean;
    hasLibrary?: boolean;
    hasLab?: boolean;
    hasSports?: boolean;
    description?: string;
    isActive?: boolean;
  }
) {
  const authResult = await requireAuth(['admin']);
  if ('error' in authResult) {
    throw new Error(authResult.error);
  }
  const { userId } = authResult;

  try {
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (data.name) updateData.name = data.name;
    if (data.code) updateData.code = data.code;
    if (data.type) updateData.type = data.type;
    if (data.dzongkhag) updateData.dzongkhag = data.dzongkhag;
    if (data.location) updateData.location = data.location;
    if (data.latitude !== undefined) updateData.latitude = data.latitude;
    if (data.longitude !== undefined) updateData.longitude = data.longitude;
    if (data.website !== undefined) updateData.website = data.website;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.programs !== undefined) updateData.programs = data.programs;
    if (data.hasHostel !== undefined) updateData.hasHostel = !!data.hasHostel;
    if (data.hasLibrary !== undefined) updateData.hasLibrary = data.hasLibrary;
    if (data.hasLab !== undefined) updateData.hasLab = !!data.hasLab;
    if (data.hasSports !== undefined) updateData.hasSports = !!data.hasSports;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.isActive !== undefined) updateData.isActive = !!data.isActive;

    const [updatedCollege] = await db
      .update(colleges)
      .set(updateData)
      .where(eq(colleges.id, id))
      .returning();

    if (!updatedCollege) {
      throw new Error("College not found");
    }

    revalidatePath("/admin/content");
    revalidatePath("/dashboard/colleges");

    return {
      ...updatedCollege,
      hasHostel: !!updatedCollege.hasHostel,
      hasLibrary: !!updatedCollege.hasLibrary,
      hasLab: !!updatedCollege.hasLab,
      hasSports: !!updatedCollege.hasSports,
      isActive: !!updatedCollege.isActive,
    };
  } catch (error) {
    logger.error(error, { action: "updateCollege", id, userId });
    throw new Error("Failed to update college");
  }
}

/**
 * Delete a college
 */
export async function deleteCollege(id: string) {
  const authResult = await requireAuth(['admin']);
  if ('error' in authResult) {
    throw new Error(authResult.error);
  }
  const { userId } = authResult;

  try {
    const [deletedCollege] = await db
      .delete(colleges)
      .where(eq(colleges.id, id))
      .returning();

    if (!deletedCollege) {
      throw new Error("College not found");
    }

    revalidatePath("/admin/content");
    revalidatePath("/dashboard/colleges");

    return deletedCollege;
  } catch (error) {
    logger.error(error, { action: "deleteCollege", id, userId });
    throw new Error("Failed to delete college");
  }
}

// ============================================================================
// SCHOLARSHIPS
// ============================================================================

/**
 * Get all scholarships from the database
 */
export async function getScholarships(limit = 500) {
  const authResult = await requireAuth(['admin']);
  if ('error' in authResult) {
    throw new Error(authResult.error);
  }
  const { userId } = authResult;

  try {
    const allScholarships = await db
      .select()
      .from(scholarships)
      .orderBy(desc(scholarships.createdAt))
      .limit(limit);

    return allScholarships.map((scholarship) => ({
      ...scholarship,
      coversTuition: !!scholarship.coversTuition,
      coversHostel: !!scholarship.coversHostel,
      coversBooks: !!scholarship.coversBooks,
      coversLiving: !!scholarship.coversLiving,
      isActive: !!scholarship.isActive,
    }));
  } catch (error) {
    logger.error(error, { action: "getScholarships", userId });
    throw new Error("Failed to fetch scholarships");
  }
}

/**
 * Get a single scholarship by ID
 */
export async function getScholarshipById(id: string) {
  const authResult = await requireAuth(['admin']);
  if ('error' in authResult) {
    throw new Error(authResult.error);
  }
  const { userId } = authResult;

  try {
    const scholarship = await db.query.scholarships.findFirst({
      where: eq(scholarships.id, id),
    });

    if (!scholarship) {
      throw new Error("Scholarship not found");
    }

    return {
      ...scholarship,
      coversTuition: !!scholarship.coversTuition,
      coversHostel: !!scholarship.coversHostel,
      coversBooks: !!scholarship.coversBooks,
      coversLiving: !!scholarship.coversLiving,
      isActive: !!scholarship.isActive,
    };
  } catch (error) {
    logger.error(error, { action: "getScholarshipById", id, userId });
    throw new Error("Failed to fetch scholarship");
  }
}

/**
 * Create a new scholarship
 */
export async function createScholarship(data: {
  name: string;
  code: string;
  type: "merit" | "need_based" | "sports" | "arts" | "government" | "private";
  provider: string;
  providerName?: string;
  coversTuition?: boolean;
  coversHostel?: boolean;
  coversBooks?: boolean;
  coversLiving?: boolean;
  coveragePercentage?: number;
  minPercentage?: number;
  annualIncomeLimit?: number;
  categories?: string[];
  duration?: string;
  applicationOpenDate?: string;
  applicationCloseDate?: string;
  requiredDocuments?: string[];
  description?: string;
  termsAndConditions?: string;
  academicYear?: string;
  isActive?: boolean;
}) {
  const authResult = await requireAuth(['admin']);
  if ('error' in authResult) {
    throw new Error(authResult.error);
  }
  const { userId } = authResult;

  try {
    const scholarshipId = `scholarship_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const now = new Date();

    const [newScholarship] = await db
      .insert(scholarships)
      .values({
        id: scholarshipId,
        name: data.name,
        code: data.code,
        type: data.type,
        provider: data.provider,
        providerName: data.providerName || null,
        coversTuition: !!data.coversTuition,
        coversHostel: !!data.coversHostel,
        coversBooks: !!data.coversBooks,
        coversLiving: !!data.coversLiving,
        coveragePercentage: data.coveragePercentage || null,
        minPercentage: data.minPercentage || null,
        annualIncomeLimit: data.annualIncomeLimit || null,
        categories: data.categories || null,
        duration: data.duration || null,
        applicationOpenDate: data.applicationOpenDate || null,
        applicationCloseDate: data.applicationCloseDate || null,
        requiredDocuments: data.requiredDocuments || null,
        description: data.description || null,
        termsAndConditions: data.termsAndConditions || null,
        academicYear: data.academicYear || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    revalidatePath("/admin/content");
    revalidatePath("/dashboard/scholarships");

    return newScholarship;
  } catch (error) {
    logger.error(error, { action: "createScholarship", userId });
    throw new Error("Failed to create scholarship");
  }
}

/**
 * Update an existing scholarship
 */
export async function updateScholarship(
  id: string,
  data: {
    name?: string;
    code?: string;
    type?: "merit" | "need_based" | "sports" | "arts" | "government" | "private";
    provider?: string;
    providerName?: string;
    coversTuition?: boolean;
    coversHostel?: boolean;
    coversBooks?: boolean;
    coversLiving?: boolean;
    coveragePercentage?: number;
    minPercentage?: number;
    annualIncomeLimit?: number;
    categories?: string[];
    duration?: string;
    applicationOpenDate?: string;
    applicationCloseDate?: string;
    requiredDocuments?: string[];
    description?: string;
    termsAndConditions?: string;
    academicYear?: string;
    isActive?: boolean;
  }
) {
  const authResult = await requireAuth(['admin']);
  if ('error' in authResult) {
    throw new Error(authResult.error);
  }
  const { userId } = authResult;

  try {
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (data.name) updateData.name = data.name;
    if (data.code) updateData.code = data.code;
    if (data.type) updateData.type = data.type;
    if (data.provider) updateData.provider = data.provider;
    if (data.providerName !== undefined) updateData.providerName = data.providerName;
    if (data.coversTuition !== undefined) updateData.coversTuition = !!data.coversTuition;
    if (data.coversHostel !== undefined) updateData.coversHostel = !!data.coversHostel;
    if (data.coversBooks !== undefined) updateData.coversBooks = !!data.coversBooks;
    if (data.coversLiving !== undefined) updateData.coversLiving = !!data.coversLiving;
    if (data.coveragePercentage !== undefined) updateData.coveragePercentage = data.coveragePercentage;
    if (data.minPercentage !== undefined) updateData.minPercentage = data.minPercentage;
    if (data.annualIncomeLimit !== undefined) updateData.annualIncomeLimit = data.annualIncomeLimit;
    if (data.categories !== undefined) updateData.categories = data.categories;
    if (data.duration !== undefined) updateData.duration = data.duration;
    if (data.applicationOpenDate !== undefined) updateData.applicationOpenDate = data.applicationOpenDate;
    if (data.applicationCloseDate !== undefined) updateData.applicationCloseDate = data.applicationCloseDate;
    if (data.requiredDocuments !== undefined) updateData.requiredDocuments = data.requiredDocuments;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.termsAndConditions !== undefined) updateData.termsAndConditions = data.termsAndConditions;
    if (data.academicYear !== undefined) updateData.academicYear = data.academicYear;
    if (data.isActive !== undefined) updateData.isActive = !!data.isActive;

    const [updatedScholarship] = await db
      .update(scholarships)
      .set(updateData)
      .where(eq(scholarships.id, id))
      .returning();

    if (!updatedScholarship) {
      throw new Error("Scholarship not found");
    }

    revalidatePath("/admin/content");
    revalidatePath("/dashboard/scholarships");

    return {
      ...updatedScholarship,
      coversTuition: !!updatedScholarship.coversTuition,
      coversHostel: !!updatedScholarship.coversHostel,
      coversBooks: !!updatedScholarship.coversBooks,
      coversLiving: !!updatedScholarship.coversLiving,
      isActive: !!updatedScholarship.isActive,
    };
  } catch (error) {
    logger.error(error, { action: "updateScholarship", id, userId });
    throw new Error("Failed to update scholarship");
  }
}

/**
 * Delete a scholarship
 */
export async function deleteScholarship(id: string) {
  const authResult = await requireAuth(['admin']);
  if ('error' in authResult) {
    throw new Error(authResult.error);
  }
  const { userId } = authResult;

  try {
    const [deletedScholarship] = await db
      .delete(scholarships)
      .where(eq(scholarships.id, id))
      .returning();

    if (!deletedScholarship) {
      throw new Error("Scholarship not found");
    }

    revalidatePath("/admin/content");
    revalidatePath("/dashboard/scholarships");

    return deletedScholarship;
  } catch (error) {
    logger.error(error, { action: "deleteScholarship", id, userId });
    throw new Error("Failed to delete scholarship");
  }
}

// ============================================================================
// RUB PROGRAMS
// ============================================================================

/**
 * Get all RUB programs from the database
 */
export async function getRUBPrograms(limit = 500) {
  const authResult = await requireAuth(['admin']);
  if ('error' in authResult) {
    throw new Error(authResult.error);
  }
  const { userId } = authResult;

  try {
    const allPrograms = await db
      .select()
      .from(rubPrograms)
      .orderBy(desc(rubPrograms.createdAt))
      .limit(limit);

    return allPrograms.map((program) => ({
      ...program,
      isActive: !!program.isActive,
      admissionOpen: !!program.admissionOpen,
    }));
  } catch (error) {
    logger.error(error, { action: "getRUBPrograms", userId });
    throw new Error("Failed to fetch RUB programs");
  }
}

/**
 * Get a single RUB program by ID
 */
export async function getRUBProgramById(id: string) {
  const authResult = await requireAuth(['admin']);
  if ('error' in authResult) {
    throw new Error(authResult.error);
  }
  const { userId } = authResult;

  try {
    const program = await db.query.rubPrograms.findFirst({
      where: eq(rubPrograms.id, id),
    });

    if (!program) {
      throw new Error("RUB Program not found");
    }

    return {
      ...program,
      isActive: !!program.isActive,
      admissionOpen: !!program.admissionOpen,
    };
  } catch (error) {
    logger.error(error, { action: "getRUBProgramById", id, userId });
    throw new Error("Failed to fetch RUB program");
  }
}

/**
 * Create a new RUB program
 */
export async function createRUBProgram(data: {
  name: string;
  code: string;
  collegeId: string;
  level: "certificate" | "diploma" | "bachelor" | "master" | "phd";
  field: string;
  discipline?: string;
  duration: number;
  durationType: "years" | "semesters" | "months";
  totalSeats?: number;
  reservedSeats?: Array<{
    category: string;
    seats: number;
  }>;
  minPercentage?: number;
  requiredSubjects?: string[];
  eligibilityCriteria?: Record<string, any>;
  tuitionFee?: number;
  hostelFee?: number;
  otherFees?: number;
  totalFee?: number;
  description?: string;
  careerProspects?: string[];
  isActive?: boolean;
  admissionOpen?: boolean;
  academicYear?: string;
}) {
  const authResult = await requireAuth(['admin']);
  if ('error' in authResult) {
    throw new Error(authResult.error);
  }
  const { userId } = authResult;

  try {
    const programId = `rub_program_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const now = new Date();

    const [newProgram] = await db
      .insert(rubPrograms)
      .values({
        id: programId,
        name: data.name,
        code: data.code,
        collegeId: data.collegeId,
        level: data.level,
        field: data.field,
        discipline: data.discipline || null,
        duration: data.duration,
        durationType: data.durationType,
        totalSeats: data.totalSeats || null,
        reservedSeats: data.reservedSeats || null,
        minPercentage: data.minPercentage || null,
        requiredSubjects: data.requiredSubjects || null,
        eligibilityCriteria: data.eligibilityCriteria || null,
        tuitionFee: data.tuitionFee || null,
        hostelFee: data.hostelFee || null,
        otherFees: data.otherFees || null,
        totalFee: data.totalFee || null,
        description: data.description || null,
        careerProspects: data.careerProspects || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
        admissionOpen: data.admissionOpen !== undefined ? data.admissionOpen : false,
        academicYear: data.academicYear || null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    revalidatePath("/admin/content");
    revalidatePath("/dashboard/rub-programs");

    return newProgram;
  } catch (error) {
    logger.error(error, { action: "createRUBProgram", userId });
    throw new Error("Failed to create RUB program");
  }
}

/**
 * Update an existing RUB program
 */
export async function updateRUBProgram(
  id: string,
  data: {
    name?: string;
    code?: string;
    collegeId?: string;
    level?: "certificate" | "diploma" | "bachelor" | "master" | "phd";
    field?: string;
    discipline?: string;
    duration?: number;
    durationType?: "years" | "semesters" | "months";
    totalSeats?: number;
    reservedSeats?: Array<{
      category: string;
      seats: number;
    }>;
    minPercentage?: number;
    requiredSubjects?: string[];
    eligibilityCriteria?: Record<string, any>;
    tuitionFee?: number;
    hostelFee?: number;
    otherFees?: number;
    totalFee?: number;
    description?: string;
    careerProspects?: string[];
    isActive?: boolean;
    admissionOpen?: boolean;
    academicYear?: string;
  }
) {
  const authResult = await requireAuth(['admin']);
  if ('error' in authResult) {
    throw new Error(authResult.error);
  }
  const { userId } = authResult;

  try {
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (data.name) updateData.name = data.name;
    if (data.code) updateData.code = data.code;
    if (data.collegeId) updateData.collegeId = data.collegeId;
    if (data.level) updateData.level = data.level;
    if (data.field) updateData.field = data.field;
    if (data.discipline !== undefined) updateData.discipline = data.discipline;
    if (data.duration) updateData.duration = data.duration;
    if (data.durationType) updateData.durationType = data.durationType;
    if (data.totalSeats !== undefined) updateData.totalSeats = data.totalSeats;
    if (data.reservedSeats !== undefined) updateData.reservedSeats = data.reservedSeats;
    if (data.minPercentage !== undefined) updateData.minPercentage = data.minPercentage;
    if (data.requiredSubjects !== undefined) updateData.requiredSubjects = data.requiredSubjects;
    if (data.eligibilityCriteria !== undefined) updateData.eligibilityCriteria = data.eligibilityCriteria;
    if (data.tuitionFee !== undefined) updateData.tuitionFee = data.tuitionFee;
    if (data.hostelFee !== undefined) updateData.hostelFee = data.hostelFee;
    if (data.otherFees !== undefined) updateData.otherFees = data.otherFees;
    if (data.totalFee !== undefined) updateData.totalFee = data.totalFee;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.careerProspects !== undefined) updateData.careerProspects = data.careerProspects;
    if (data.isActive !== undefined) updateData.isActive = !!data.isActive;
    if (data.admissionOpen !== undefined) updateData.admissionOpen = !!data.admissionOpen;
    if (data.academicYear !== undefined) updateData.academicYear = data.academicYear;

    const [updatedProgram] = await db
      .update(rubPrograms)
      .set(updateData)
      .where(eq(rubPrograms.id, id))
      .returning();

    if (!updatedProgram) {
      throw new Error("RUB Program not found");
    }

    revalidatePath("/admin/content");
    revalidatePath("/dashboard/rub-programs");

    return {
      ...updatedProgram,
      isActive: !!updatedProgram.isActive,
      admissionOpen: !!updatedProgram.admissionOpen,
    };
  } catch (error) {
    logger.error(error, { action: "updateRUBProgram", id, userId });
    throw new Error("Failed to update RUB program");
  }
}

/**
 * Delete a RUB program
 */
export async function deleteRUBProgram(id: string) {
  const authResult = await requireAuth(['admin']);
  if ('error' in authResult) {
    throw new Error(authResult.error);
  }
  const { userId } = authResult;

  try {
    const [deletedProgram] = await db
      .delete(rubPrograms)
      .where(eq(rubPrograms.id, id))
      .returning();

    if (!deletedProgram) {
      throw new Error("RUB Program not found");
    }

    revalidatePath("/admin/content");
    revalidatePath("/dashboard/rub-programs");

    return deletedProgram;
  } catch (error) {
    logger.error(error, { action: "deleteRUBProgram", id, userId });
    throw new Error("Failed to delete RUB program");
  }
}
