#!/bin/bash
# Fix duplicate feature files

echo "=== Removing duplicate feature files ==="

# Files to DELETE (the camelCase/singular duplicates created by migration)
rm -f src/features/analytic.feature.tsx
rm -f src/features/announcement.feature.tsx
rm -f src/features/appointment.feature.tsx
rm -f src/features/assessment.feature.tsx
rm -f src/features/auditLog.feature.tsx
rm -f src/features/batche.feature.tsx
rm -f src/features/behaviorRecord.feature.tsx
rm -f src/features/careerMatche.feature.tsx
rm -f src/features/class.feature.tsx
rm -f src/features/counselorNote.feature.tsx
rm -f src/features/department.feature.tsx
rm -f src/features/exam.feature.tsx
rm -f src/features/fee.feature.tsx
rm -f src/features/feePayment.feature.tsx
rm -f src/features/gnhIndicator.feature.tsx
rm -f src/features/grade.feature.tsx
rm -f src/features/homework.feature.tsx
rm -f src/features/intervention.feature.tsx
rm -f src/features/invoice.feature.tsx
rm -f src/features/lesson.feature.tsx
rm -f src/features/libraryBook.feature.tsx
rm -f src/features/libraryFine.feature.tsx
rm -f src/features/libraryLoan.feature.tsx
rm -f src/features/meeting.feature.tsx
rm -f src/features/message.feature.tsx
rm -f src/features/notification.feature.tsx
rm -f src/features/plan.feature.tsx
rm -f src/features/report.feature.tsx
rm -f src/features/resourceShare.feature.tsx
rm -f src/features/result.feature.tsx
rm -f src/features/roadmap.feature.tsx
rm -f src/features/rubric.feature.tsx
rm -f src/features/scheduleException.feature.tsx
rm -f src/features/school.feature.tsx
rm -f src/features/section.feature.tsx
rm -f src/features/session.feature.tsx
rm -f src/features/skill.feature.tsx
rm -f src/features/skillGap.feature.tsx
rm -f src/features/student.feature.tsx
rm -f src/features/studentSkill.feature.tsx
rm -f src/features/subject.feature.tsx
rm -f src/features/submission.feature.tsx
rm -f src/features/subscription.feature.tsx
rm -f src/features/teacher.feature.tsx
rm -f src/features/teachingResource.feature.tsx
rm -f src/features/timetable.feature.tsx
rm -f src/features/timetableSlot.feature.tsx
rm -f src/features/treatmentPlan.feature.tsx
rm -f src/features/transport.feature.tsx
rm -f src/features/transportAllocation.feature.tsx
rm -f src/features/transportRoute.feature.tsx
rm -f src/features/user.feature.tsx
rm -f src/features/workforceData.feature.tsx

echo "✓ Removed duplicate files"
