/**
 * BULK CREATE CLASSES DROPDOWN
 *
 * Premium multi-select dropdown for creating classes in bulk.
 * Similar design to the subjects dropdown.
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Layers, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClass } from "@/app/school-admin/_actions";

const gradeOptions = [6, 7, 8, 9, 10, 11, 12];
const sectionOptions = ["A", "B", "C", "D", "E"];

export function BulkCreateClassesDropdown() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedGrades, setSelectedGrades] = useState<Set<number>>(new Set());
  const [selectedSections, setSelectedSections] = useState<Set<string>>(new Set());

  // Toggle grade selection
  const toggleGrade = (grade: number) => {
    const newSelected = new Set(selectedGrades);
    if (newSelected.has(grade)) {
      newSelected.delete(grade);
    } else {
      newSelected.add(grade);
    }
    setSelectedGrades(newSelected);
  };

  // Toggle section selection
  const toggleSection = (section: string) => {
    const newSelected = new Set(selectedSections);
    if (newSelected.has(section)) {
      newSelected.delete(section);
    } else {
      newSelected.add(section);
    }
    setSelectedSections(newSelected);
  };

  // Calculate preview of classes to be created
  const previewClasses = Array.from(selectedGrades).flatMap(grade =>
    Array.from(selectedSections).map(section => ({
      name: `Class ${grade} - ${section}`,
      grade,
      section,
    }))
  ).sort((a, b) => {
    if (a.grade !== b.grade) return a.grade - b.grade;
    return a.section.localeCompare(b.section);
  });

  // Create all classes
  const createAllClasses = async () => {
    if (previewClasses.length === 0) return;

    setIsSubmitting(true);
    try {
      let successCount = 0;
      let failCount = 0;

      for (const cls of previewClasses) {
        const result = await createClass({
          name: cls.name,
          grade: cls.grade,
          section: cls.section,
          capacity: 40,
        });
        if (result.success) {
          successCount++;
        } else {
          failCount++;
        }
      }

      // Clear selection and close
      setSelectedGrades(new Set());
      setSelectedSections(new Set());
      setIsOpen(false);

      // Refresh page
      router.refresh();

      // Show result
      if (failCount === 0) {
        alert(`Successfully created ${successCount} classes!`);
      } else {
        alert(`Created ${successCount} classes. ${failCount} failed.`);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create classes");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        className="border-violet-200 text-violet-700 hover:bg-violet-50 hover:border-violet-300"
        disabled={isSubmitting}
      >
        <Layers className="w-4 h-4 mr-2" />
        Bulk Create
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            onClick={() => {
              setIsOpen(false);
              setSelectedGrades(new Set());
              setSelectedSections(new Set());
            }}
          />

          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-[680px] max-h-[540px] z-50 shadow-2xl rounded-xl overflow-hidden">
            {/* Header with Buttons */}
            <div className="bg-white border-b border-gray-200 px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Bulk Create Classes</h3>
                  <p className="text-xs text-gray-500">
                    {previewClasses.length > 0
                      ? `${previewClasses.length} class(es) will be created`
                      : "Select grades and sections to create classes"}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  {/* Create All Button */}
                  <button
                    onClick={createAllClasses}
                    disabled={previewClasses.length === 0 || isSubmitting}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      previewClasses.length > 0
                        ? "bg-violet-600 text-white hover:bg-violet-700 shadow-md"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating...
                      </span>
                    ) : (
                      `Create ${previewClasses.length > 0 ? `(${previewClasses.length}) ` : ""}All`
                    )}
                  </button>

                  {/* Close Button */}
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      setSelectedGrades(new Set());
                      setSelectedSections(new Set());
                    }}
                    className="ml-2 text-gray-400 hover:text-gray-600 transition-colors text-xl"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="bg-white overflow-y-auto max-h-[420px] p-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Grades Selection */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-700 mb-3 px-1">SELECT GRADES</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {gradeOptions.map((grade) => {
                      const isSelected = selectedGrades.has(grade);
                      return (
                        <button
                          key={grade}
                          onClick={() => toggleGrade(grade)}
                          className={`aspect-square flex items-center justify-center text-sm font-medium rounded-lg transition-all ${
                            isSelected
                              ? "bg-violet-600 text-white shadow-md"
                              : "bg-gray-50 text-gray-700 hover:bg-violet-100 hover:text-violet-700 border border-gray-200"
                          }`}
                        >
                          {grade}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sections Selection */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-700 mb-3 px-1">SELECT SECTIONS</h4>
                  <div className="grid grid-cols-5 gap-2">
                    {sectionOptions.map((section) => {
                      const isSelected = selectedSections.has(section);
                      return (
                        <button
                          key={section}
                          onClick={() => toggleSection(section)}
                          className={`aspect-square flex items-center justify-center text-sm font-medium rounded-lg transition-all ${
                            isSelected
                              ? "bg-violet-600 text-white shadow-md"
                              : "bg-gray-50 text-gray-700 hover:bg-violet-100 hover:text-violet-700 border border-gray-200"
                          }`}
                        >
                          {section}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Preview Section */}
              {previewClasses.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-xs font-semibold text-gray-700 mb-3 px-1">
                    PREVIEW ({previewClasses.length} classes)
                  </h4>
                  <div className="max-h-[140px] overflow-y-auto bg-gray-50 rounded-lg p-3">
                    <div className="grid grid-cols-3 gap-2">
                      {previewClasses.map((cls, idx) => (
                        <div
                          key={`${cls.grade}-${cls.section}-${idx}`}
                          className="text-xs text-gray-700 bg-white px-2 py-1.5 rounded border border-gray-200 truncate"
                          title={cls.name}
                        >
                          {cls.name}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
