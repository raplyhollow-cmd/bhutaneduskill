/**
 * User Repository
 * Standardized data access layer for user operations
 */

import { db } from "@/lib/db";
import { users, type User } from "@/lib/db/schema";
import { eq, and, like, or, desc, sql } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { nanoid } from "nanoid";

// ============================================================================
// TYPES
// ============================================================================

export type CreateUserInput = Omit<User, "id" | "createdAt" | "updatedAt">;
export type UpdateUserInput = Partial<Omit<User, "id" | "createdAt" | "updatedAt">>;
export type UserFilter = {
  schoolId?: string;
  type?: string;
  isActive?: boolean;
  search?: string;
};

// ============================================================================
// REPOSITORY
// ============================================================================

export const UserRepository = {
  /**
   * Find user by database ID
   */
  async findById(id: string): Promise<User | null> {
    try {
      const result = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      const user = result[0] || null;
      return user as User | null;
    } catch (error) {
      logger.error(error, { context: "UserRepository.findById", id });
      return null;
    }
  },

  /**
   * Find user by Clerk user ID
   */
  async findByClerkId(clerkUserId: string): Promise<User | null> {
    try {
      const result = await db
        .select()
        .from(users)
        .where(eq(users.clerkUserId, clerkUserId))
        .limit(1);

      const user = result[0] || null;
      return user as User | null;
    } catch (error) {
      logger.error(error, { context: "UserRepository.findByClerkId", clerkUserId });
      return null;
    }
  },

  /**
   * Find user by email address
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      const result = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      const user = result[0] || null;
      return user as User | null;
    } catch (error) {
      logger.error(error, { context: "UserRepository.findByEmail", email });
      return null;
    }
  },

  /**
   * Find all users for a specific school
   * Optionally filter by user type (student, teacher, etc.)
   */
  async findBySchoolId(schoolId: string, type?: string): Promise<User[]> {
    try {
      const conditions = type
        ? and(eq(users.schoolId, schoolId), eq(users.type, type))
        : eq(users.schoolId, schoolId);

      const results = await db
        .select()
        .from(users)
        .where(conditions)
        .orderBy(desc(users.createdAt));

      return results as User[];
    } catch (error) {
      logger.error(error, { context: "UserRepository.findBySchoolId", schoolId, type });
      return [];
    }
  },

  /**
   * Find children of a parent user
   */
  async findByParentId(parentId: string): Promise<User[]> {
    try {
      const results = await db
        .select()
        .from(users)
        .where(eq(users.parentId, parentId))
        .orderBy(desc(users.createdAt));

      return results as User[];
    } catch (error) {
      logger.error(error, { context: "UserRepository.findByParentId", parentId });
      return [];
    }
  },

  /**
   * Find users with filters
   * Supports: schoolId, type, isActive, search (searches name and email)
   */
  async findAll(filters: UserFilter = {}): Promise<User[]> {
    try {
      const conditions: Array<ReturnType<typeof eq | typeof and>> = [];

      if (filters.schoolId) {
        conditions.push(eq(users.schoolId, filters.schoolId));
      }

      if (filters.type) {
        conditions.push(eq(users.type, filters.type));
      }

      if (filters.isActive !== undefined) {
        conditions.push(eq(users.isActive, filters.isActive));
      }

      if (filters.search) {
        conditions.push(
          or(
            like(users.name, `%${filters.search}%`),
            like(users.email, `%${filters.search}%`)
          )!
        );
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const results = await db
        .select()
        .from(users)
        .where(whereClause)
        .orderBy(desc(users.createdAt));

      return results as User[];
    } catch (error) {
      logger.error(error, { context: "UserRepository.findAll", filters });
      return [];
    }
  },

  /**
   * Count users with filters
   */
  async count(filters: UserFilter = {}): Promise<number> {
    try {
      const conditions: Array<ReturnType<typeof eq | typeof and>> = [];

      if (filters.schoolId) {
        conditions.push(eq(users.schoolId, filters.schoolId));
      }

      if (filters.type) {
        conditions.push(eq(users.type, filters.type));
      }

      if (filters.isActive !== undefined) {
        conditions.push(eq(users.isActive, filters.isActive));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const [result] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(users)
        .where(whereClause);

      return result?.count ?? 0;
    } catch (error) {
      logger.error(error, { context: "UserRepository.count", filters });
      return 0;
    }
  },

  /**
   * Create a new user
   */
  async create(data: CreateUserInput): Promise<User | null> {
    try {
      const id = `user-${nanoid()}`;
      const now = new Date();

      const result = await db
        .insert(users)
        .values({
          ...data,
          id,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      const newUser = Array.isArray(result) ? result[0] : null;
      return newUser;
    } catch (error) {
      logger.error(error, { context: "UserRepository.create" });
      return null;
    }
  },

  /**
   * Update an existing user
   */
  async update(id: string, data: UpdateUserInput): Promise<User | null> {
    try {
      const result = await db
        .update(users)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(users.id, id))
        .returning();

      const updatedUser = Array.isArray(result) ? result[0] : null;
      return updatedUser as User | null;
    } catch (error) {
      logger.error(error, { context: "UserRepository.update", id });
      return null;
    }
  },

  /**
   * Soft delete a user (sets isActive to false)
   */
  async delete(id: string): Promise<boolean> {
    try {
      const result = await db
        .update(users)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(users.id, id))
        .returning();

      return Array.isArray(result) ? result.length > 0 : false;
    } catch (error) {
      logger.error(error, { context: "UserRepository.delete", id });
      return false;
    }
  },

  /**
   * Permanently delete a user (use with caution)
   */
  async hardDelete(id: string): Promise<boolean> {
    try {
      const result = await db
        .delete(users)
        .where(eq(users.id, id))
        .returning();

      const deleted = Array.isArray(result) ? result[0] : null;
      return !!deleted;
    } catch (error) {
      logger.error(error, { context: "UserRepository.hardDelete", id });
      return false;
    }
  },

  /**
   * Update last login timestamp
   */
  async updateLastLogin(id: string): Promise<boolean> {
    try {
      const [result] = await db
        .update(users)
        .set({
          lastLogin: new Date().toISOString(),
          updatedAt: new Date(),
        })
        .where(eq(users.id, id))
        .returning();

      return !!result;
    } catch (error) {
      logger.error(error, { context: "UserRepository.updateLastLogin", id });
      return false;
    }
  },

  /**
   * Find teachers for a school
   */
  async findTeachersBySchool(schoolId: string): Promise<User[]> {
    return this.findBySchoolId(schoolId, "teacher");
  },

  /**
   * Find students for a school
   */
  async findStudentsBySchool(schoolId: string): Promise<User[]> {
    return this.findBySchoolId(schoolId, "student");
  },

  /**
   * Get user statistics for a school
   */
  async getSchoolStats(schoolId: string): Promise<{
    total: number;
    students: number;
    teachers: number;
    parents: number;
    active: number;
  }> {
    try {
      const allUsers = await this.findBySchoolId(schoolId);

      return {
        total: allUsers.length,
        students: allUsers.filter((u) => u.type === "student").length,
        teachers: allUsers.filter((u) => u.type === "teacher").length,
        parents: allUsers.filter((u) => u.type === "parent").length,
        active: allUsers.filter((u) => u.isActive).length,
      };
    } catch (error) {
      logger.error(error, { context: "UserRepository.getSchoolStats", schoolId });
      return { total: 0, students: 0, teachers: 0, parents: 0, active: 0 };
    }
  },
};

export default UserRepository;
