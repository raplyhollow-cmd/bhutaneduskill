import re

# Fix attendance.feature.tsx
with open('src/features/attendance.feature.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find and replace the broken status render function
# Look for the pattern where the config object starts with absent instead of present
old_attendance = '''      {
        key: "status",
        label: "Status",
        sortable: true,
        filterable: true,
            absent: { label: "Absent", color: "bg-red-100 text-red-700" },
            late: { label: "Late", color: "bg-amber-100 text-amber-700" },
            excused: { label: "Excused", color: "bg-blue-100 text-blue-700" },
          };
          const config = statusConfig[value as keyof typeof statusConfig] || statusConfig.present;
          return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
              {config.label}
            </span>
          );
        },'''

new_attendance = '''      {
        key: "status",
        label: "Status",
        sortable: true,
        filterable: true,
        render: (value: string) => {
          const statusConfig = {
            present: { label: "Present", color: "bg-green-100 text-green-700" },
            absent: { label: "Absent", color: "bg-red-100 text-red-700" },
            late: { label: "Late", color: "bg-amber-100 text-amber-700" },
            excused: { label: "Excused", color: "bg-blue-100 text-blue-700" },
          };
          const config = statusConfig[value as keyof typeof statusConfig] || statusConfig.present;
          return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
              {config.label}
            </span>
          );
        },
      },'''

content = content.replace(old_attendance, new_attendance)

with open('src/features/attendance.feature.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Fixed attendance.feature.tsx')

# Fix behavior-records.feature.tsx
with open('src/features/behavior-records.feature.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_behavior = '''      {
        key: "incidentType",
        label: "Type",
        sortable: true,
        filterable: true,
            negative: { label: "Negative", color: "bg-red-100 text-red-700" },
            neutral: { label: "Neutral", color: "bg-gray-100 text-gray-700" },
          };
          const config = typeConfig[value as keyof typeof typeConfig] || typeConfig.neutral;
          return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
              {config.label}
            </span>
          );
        },'''

new_behavior = '''      {
        key: "incidentType",
        label: "Type",
        sortable: true,
        filterable: true,
        render: (value: string) => {
          const typeConfig = {
            positive: { label: "Positive", color: "bg-green-100 text-green-700" },
            negative: { label: "Negative", color: "bg-red-100 text-red-700" },
            neutral: { label: "Neutral", color: "bg-gray-100 text-gray-700" },
          };
          const config = typeConfig[value as keyof typeof typeConfig] || typeConfig.neutral;
          return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
              {config.label}
            </span>
          );
        },
      },'''

content = content.replace(old_behavior, new_behavior)

with open('src/features/behavior-records.feature.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Fixed behavior-records.feature.tsx')

# Fix interventions.feature.tsx
with open('src/features/interventions.feature.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_interventions_type = '''      {
        key: "type",
        label: "Type",
        sortable: true,
        filterable: true,
            behavioral: { label: "Behavioral", color: "bg-amber-100 text-amber-700" },
            counseling: { label: "Counseling", color: "bg-purple-100 text-purple-700" },
          };
          const config = typeConfig[value as keyof typeof typeConfig] || typeConfig.academic;
          return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
              {config.label}
            </span>
          );
        },'''

new_interventions_type = '''      {
        key: "type",
        label: "Type",
        sortable: true,
        filterable: true,
        render: (value: string) => {
          const typeConfig = {
            academic: { label: "Academic", color: "bg-green-100 text-green-700" },
            behavioral: { label: "Behavioral", color: "bg-amber-100 text-amber-700" },
            counseling: { label: "Counseling", color: "bg-purple-100 text-purple-700" },
          };
          const config = typeConfig[value as keyof typeof typeConfig] || typeConfig.academic;
          return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
              {config.label}
            </span>
          );
        },
      },'''

content = content.replace(old_interventions_type, new_interventions_type)

with open('src/features/interventions.feature.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Fixed interventions.feature.tsx')

# Fix results.feature.tsx
with open('src/features/results.feature.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_results = '''      {
        key: "grade",
        label: "Grade",
        sortable: true,
        filterable: true,
            fail: { label: "Fail", color: "bg-red-100 text-red-700" },
            pending: { label: "Pending", color: "bg-yellow-100 text-yellow-700" },
          };
          const config = statusConfig[value as keyof typeof statusConfig] || statusConfig.pending;
          return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
              {config.label}
            </span>
          );
        },'''

new_results = '''      {
        key: "grade",
        label: "Grade",
        sortable: true,
        filterable: true,
        render: (value: string) => {
          const gradeConfig = {
            a: { label: "A", color: "bg-green-100 text-green-700" },
            b: { label: "B", color: "bg-blue-100 text-blue-700" },
            c: { label: "C", color: "bg-yellow-100 text-yellow-700" },
            d: { label: "D", color: "bg-orange-100 text-orange-700" },
            fail: { label: "Fail", color: "bg-red-100 text-red-700" },
            pending: { label: "Pending", color: "bg-yellow-100 text-yellow-700" },
          };
          const config = gradeConfig[value] || gradeConfig.pending;
          return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
              {config.label}
            </span>
          );
        },
      },'''

content = content.replace(old_results, new_results)

with open('src/features/results.feature.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Fixed results.feature.tsx')

# Fix student-skills.feature.tsx
with open('src/features/student-skills.feature.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_student_skills = '''      {
        key: "category",
        label: "Category",
        sortable: true,
        filterable: true,
            service: { label: "Service", color: "bg-amber-100 text-amber-700" },
            vocational: { label: "Vocational", color: "bg-cyan-100 text-cyan-700" },
            other: { label: "Other", color: "bg-gray-100 text-gray-700" },
          };
          const config = categoryConfig[value as keyof typeof categoryConfig] || categoryConfig.other;
          return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
              {config.label}
            </span>
          );
        },'''

new_student_skills = '''      {
        key: "category",
        label: "Category",
        sortable: true,
        filterable: true,
        render: (value: string) => {
          const categoryConfig = {
            academic: { label: "Academic", color: "bg-blue-100 text-blue-700" },
            soft: { label: "Soft", color: "bg-purple-100 text-purple-700" },
            technical: { label: "Technical", color: "bg-green-100 text-green-700" },
            creative: { label: "Creative", color: "bg-pink-100 text-pink-700" },
            service: { label: "Service", color: "bg-amber-100 text-amber-700" },
            vocational: { label: "Vocational", color: "bg-cyan-100 text-cyan-700" },
            other: { label: "Other", color: "bg-gray-100 text-gray-700" },
          };
          const config = categoryConfig[value] || categoryConfig.other;
          return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
              {config.label}
            </span>
          );
        },
      },'''

content = content.replace(old_student_skills, new_student_skills)

with open('src/features/student-skills.feature.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Fixed student-skills.feature.tsx')
print('All files fixed!')
