/**
 * Repository Layer - Centralized Export
 *
 * This file provides a single import point for all repository modules.
 * Use this to access standardized data access methods.
 *
 * @example
 * import { UserRepository, SchoolRepository } from "@/lib/repositories";
 *
 * const user = await UserRepository.findByClerkId(clerkUserId);
 * const school = await SchoolRepository.findByCode(schoolCode);
 */

// Export all repositories
export { UserRepository } from "./user.repository";
export { SchoolRepository } from "./school.repository";
export { AssessmentRepository } from "./assessment.repository";
export { HomeworkRepository } from "./homework.repository";

// Export default versions as well
export { default as userRepository } from "./user.repository";
export { default as schoolRepository } from "./school.repository";
export { default as assessmentRepository } from "./assessment.repository";
export { default as homeworkRepository } from "./homework.repository";

// Re-export commonly used types
export type { CreateUserInput, UpdateUserInput, UserFilter } from "./user.repository";
export type { CreateSchoolInput, UpdateSchoolInput, SchoolFilter } from "./school.repository";
export type { CreateAssessmentInput, UpdateAssessmentInput, CreateAssessmentResultInput, AssessmentFilter } from "./assessment.repository";
export type { CreateHomeworkInput, UpdateHomeworkInput, CreateSubmissionInput, HomeworkFilter } from "./homework.repository";
