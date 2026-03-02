// Subject interface (matches existing schema)
interface Subject {
  id: string;
  name: string;
  code: string;
  type: "core" | "elective" | "optional";
  grade: number | null;
  description: string | null;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Class interface (matches existing schema)
interface Class {
  id: string;
  name: string;
  grade: number;
  section: string;
  roomNumber: string;
  capacity: number;
  teacherId: string | null;
  classTeacherId: string | null;
  classTeacherName: string;
  homeroomTeacherId: string | null;
  homeroomTeacherName: string;
  isActive: boolean;
  subjects?: string[];
  enrolled?: number;
}

// Grouped subjects by grade
export interface GroupedSubjects {
  [grade: number]: {
    grade: number;
    subjects: Subject[];
  };
}

// Section within a grade
export interface ClassSection {
  section: string;
  classes: Class[];
}

// Grouped classes by grade, then by section
export interface GroupedClasses {
  [grade: string]: {
    grade: string;
    sections: ClassSection[];
  };
}

/**
 * Group subjects by grade (6-12)
 * Subjects with null grade go under grade 0 (ungrouped)
 */
export function groupSubjectsByGrade(subjects: Subject[]): GroupedSubjects {
  return subjects.reduce((acc, subject) => {
    const grade = subject.grade ?? 0;
    if (!acc[grade]) {
      acc[grade] = { grade, subjects: [] };
    }
    acc[grade].subjects.push(subject);
    return acc;
  }, {} as GroupedSubjects);
}

/**
 * Group classes by grade, then by section
 */
export function groupClassesByGradeSection(classes: Class[]): GroupedClasses {
  return classes.reduce((acc, classItem) => {
    const grade = String(classItem.grade);
    if (!acc[grade]) {
      acc[grade] = { grade, sections: [] };
    }
    let section = acc[grade].sections.find(s => s.section === classItem.section);
    if (!section) {
      section = { section: classItem.section, classes: [] };
      acc[grade].sections.push(section);
    }
    section.classes.push(classItem);
    return acc;
  }, {} as GroupedClasses);
}

/**
 * Get sorted grade keys from grouped data
 * Handles null grade (0) by placing it at the end
 */
export function getSortedGrades(grouped: GroupedSubjects): number[] {
  const grades = Object.keys(grouped).map(Number).filter(g => g !== 0);
  grades.sort((a, b) => a - b);
  // Add ungrouped (grade 0) at the end if it exists
  if (grouped[0]) {
    grades.push(0);
  }
  return grades;
}

/**
 * Get sorted grade keys for classes (strings)
 */
export function getSortedClassGrades(grouped: GroupedClasses): string[] {
  return Object.keys(grouped).sort((a, b) => {
    const numA = parseInt(a) || 0;
    const numB = parseInt(b) || 0;
    return numA - numB;
  });
}

// Export types
export type { Subject, Class };
