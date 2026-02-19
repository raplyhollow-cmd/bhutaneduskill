/**
 * School Repository
 * Standardized data access layer for school operations
 */

import { db } from "@/lib/db";
import { schools, users, type School } from "@/lib/db/schema";
import { eq, like, or, and, desc, sql } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { nanoid } from "nanoid";

// ============================================================================
// TYPES
// ============================================================================

export type CreateSchoolInput = Omit<School, "id" | "createdAt" | "updatedAt">;
export type UpdateSchoolInput = Partial<Omit<School, "id" | "createdAt" | "updatedAt">>;
export type SchoolFilter = {
  districtId?: string;
  isActive?: boolean;
  type?: string;
  level?: string;
  search?: string;
};

// ============================================================================
// REPOSITORY
// ============================================================================

export const SchoolRepository = {
  /**
   * Find school by database ID
   */
  async findById(id: string): Promise<School | null> {
    try {
      const [school] = await db
        .select()
        .from(schools)
        .where(eq(schools.id, id))
        .limit(1);

      return school || null;
    } catch (error) {
      logger.error(error, { context: "SchoolRepository.findById", id });
      return null;
    }
  },

  /**
   * Find school by unique code
   */
  async findByCode(code: string): Promise<School | null> {
    try {
      const [school] = await db
        .select()
        .from(schools)
        .where(eq(schools.code, code))
        .limit(1);

      return school || null;
    } catch (error) {
      logger.error(error, { context: "SchoolRepository.findByCode", code });
      return null;
    }
  },

  /**
   * Find all schools with optional filters
   */
  async findAll(filters: SchoolFilter = {}): Promise<School[]> {
    try {
      const conditions: Array<ReturnType<typeof eq | typeof and>> = [];

      if (filters.districtId) {
        conditions.push(eq(schools.districtId, filters.districtId));
      }

      if (filters.isActive !== undefined) {
        conditions.push(eq(schools.isActive, filters.isActive));
      }

      if (filters.type) {
        conditions.push(eq(schools.type, filters.type));
      }

      if (filters.level) {
        conditions.push(eq(schools.level, filters.level));
      }

      if (filters.search) {
        conditions.push(
          or(
            like(schools.name, `%${filters.search}%`),
            like(schools.code, `%${filters.search}%`),
            like(schools.city, `%${filters.search}%`)
          )!
        );
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const results = await db
        .select()
        .from(schools)
        .where(whereClause)
        .orderBy(desc(schools.createdAt));

      return results;
    } catch (error) {
      logger.error(error, { context: "SchoolRepository.findAll", filters });
      return [];
    }
  },

  /**
   * Count schools with filters
   */
  async count(filters: SchoolFilter = {}): Promise<number> {
    try {
      const conditions: Array<ReturnType<typeof eq | typeof and>> = [];

      if (filters.districtId) {
        conditions.push(eq(schools.districtId, filters.districtId));
      }

      if (filters.isActive !== undefined) {
        conditions.push(eq(schools.isActive, filters.isActive));
      }

      if (filters.type) {
        conditions.push(eq(schools.type, filters.type));
      }

      if (filters.level) {
        conditions.push(eq(schools.level, filters.level));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const [result] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(schools)
        .where(whereClause);

      return result?.count ?? 0;
    } catch (error) {
      logger.error(error, { context: "SchoolRepository.count", filters });
      return 0;
    }
  },

  /**
   * Create a new school
   */
  async create(data: CreateSchoolInput): Promise<School | null> {
    try {
      const id = `school-${nanoid()}`;
      const now = new Date();

      const [newSchool] = await db
        .insert(schools)
        .values({
          ...data,
          id,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      return newSchool;
    } catch (error) {
      logger.error(error, { context: "SchoolRepository.create" });
      return null;
    }
  },

  /**
   * Update an existing school
   */
  async update(id: string, data: UpdateSchoolInput): Promise<School | null> {
    try {
      const [updatedSchool] = await db
        .update(schools)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(schools.id, id))
        .returning();

      return updatedSchool || null;
    } catch (error) {
      logger.error(error, { context: "SchoolRepository.update", id });
      return null;
    }
  },

  /**
   * Soft delete a school (sets isActive to false)
   */
  async delete(id: string): Promise<boolean> {
    try {
      const [result] = await db
        .update(schools)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(schools.id, id))
        .returning();

      return !!result;
    } catch (error) {
      logger.error(error, { context: "SchoolRepository.delete", id });
      return false;
    }
  },

  /**
   * Get school statistics
   * Returns user counts, capacity info, and other metrics
   */
  async getStats(schoolId: string): Promise<{
    totalStudents: number;
    totalTeachers: number;
    totalParents: number;
    totalUsers: number;
    capacityUtilization: number; // percentage
  } | null> {
    try {
      // Get school details
      const school = await this.findById(schoolId);
      if (!school) {
        return null;
      }

      // Get user counts
      const [userCountResult] = await db
        .select({
          total: sql<number>`count(*)::int`,
          students: sql<number>`sum(case when type = 'student' then 1 else 0 end)::int`,
          teachers: sql<number>`sum(case when type = 'teacher' then 1 else 0 end)::int`,
          parents: sql<number>`sum(case when type = 'parent' then 1 else 0 end)::int`,
        })
        .from(users)
        .where(eq(users.schoolId, schoolId));

      const totalUsers = userCountResult?.total ?? 0;
      const totalStudents = userCountResult?.students ?? 0;
      const totalTeachers = userCountResult?.teachers ?? 0;
      const totalParents = userCountResult?.parents ?? 0;

      const capacityUtilization = school.maxStudents > 0
        ? Math.round((totalStudents / school.maxStudents) * 100)
        : 0;

      return {
        totalStudents,
        totalTeachers,
        totalParents,
        totalUsers,
        capacityUtilization,
      };
    } catch (error) {
      logger.error(error, { context: "SchoolRepository.getStats", schoolId });
      return null;
    }
  },

  /**
   * Get schools by district
   */
  async findByDistrict(districtId: string): Promise<School[]> {
    return this.findAll({ districtId });
  },

  /**
   * Get active schools only
   */
  async findActive(): Promise<School[]> {
    return this.findAll({ isActive: true });
  },

  /**
   * Search schools by name or code
   */
  async search(query: string): Promise<School[]> {
    return this.findAll({ search: query });
  },

  /**
   * Check if a school code already exists
   */
  async codeExists(code: string, excludeId?: string): Promise<boolean> {
    try {
      const conditions = excludeId
        ? and(
            eq(schools.code, code),
            sql`${schools.id} != ${excludeId}`
          )
        : eq(schools.code, code);

      const [result] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(schools)
        .where(conditions);

      return (result?.count ?? 0) > 0;
    } catch (error) {
      logger.error(error, { context: "SchoolRepository.codeExists", code, excludeId });
      return false;
    }
  },

  /**
   * Get all school types
   */
  async getSchoolTypes(): Promise<string[]> {
    try {
      const results = await db
        .selectDistinct({ type: schools.type })
        .from(schools)
        .where(sql`${schools.type} IS NOT NULL`);

      return results.map((r) => r.type).filter(Boolean);
    } catch (error) {
      logger.error(error, { context: "SchoolRepository.getSchoolTypes" });
      return [];
    }
  },

  /**
   * Get all school levels
   */
  async getSchoolLevels(): Promise<string[]> {
    try {
      const results = await db
        .selectDistinct({ level: schools.level })
        .from(schools)
        .where(sql`${schools.level} IS NOT NULL`);

      return results.map((r) => r.level).filter(Boolean);
    } catch (error) {
      logger.error(error, { context: "SchoolRepository.getSchoolLevels" });
      return [];
    }
  },
};

export default SchoolRepository;
