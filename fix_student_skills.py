import re

# Read the file
with open('src/features/student-skills.feature.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the category column with duplicate code
old_category = '''      {
        key: "category",
        label: "Category",
        sortable: true,
        filterable: true,
        render: (value: string) => {
          const categoryConfig = {
            academic: { label: "Academic", color: "bg-blue-100 text-blue-700" },
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
            technical: { label: "Technical", color: "bg-green-100 text-green-700" },
            creative: { label: "Creative", color: "bg-pink-100 text-pink-700" },
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
        },
      },
      {
        key: "level",
        label: "Proficiency",
        sortable: true,
        filterable: true,
            intermediate: { label: "Intermediate", color: "bg-blue-100 text-blue-700", bar: 2 },
            advanced: { label: "Advanced", color: "bg-green-100 text-green-700", bar: 3 },
            expert: { label: "Expert", color: "bg-purple-100 text-purple-700", bar: 4 },
          };
          const config = levelConfig[value as keyof typeof levelConfig] || levelConfig.beginner;
          return (
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                {config.label}
              </span>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-1 w-3 rounded-full ${i <= config.bar ? "bg-current" : "bg-gray-200"}`}
                  />
                ))}
              </div>
            </div>
          );
        },
      },
      {
        key: "status",
        label: "Status",
        sortable: true,
        filterable: true,
            approved: { label: "Approved", color: "bg-green-100 text-green-700" },
            rejected: { label: "Rejected", color: "bg-red-100 text-red-700" },
          };
          const config = statusConfig[value as keyof typeof statusConfig] || statusConfig.pending;
          return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
              {config.label}
            </span>
          );
        },
      },
      {
        key: "source",
        label: "Source",
        sortable: true,
        filterable: true,
            self_report: { label: "Self-Report", color: "bg-blue-100 text-blue-700" },
            teacher_assigned: { label: "Teacher Assigned", color: "bg-green-100 text-green-700" },
          };
          const config = sourceConfig[value as keyof typeof sourceConfig] || sourceConfig.self_report;
          return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
              {config.label}
            </span>
          );
        },
      },'''

new_category = '''      {
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
      },
      {
        key: "level",
        label: "Proficiency",
        sortable: true,
        filterable: true,
        render: (value: string) => {
          const levelConfig = {
            beginner: { label: "Beginner", color: "bg-gray-100 text-gray-700", bar: 1 },
            intermediate: { label: "Intermediate", color: "bg-blue-100 text-blue-700", bar: 2 },
            advanced: { label: "Advanced", color: "bg-green-100 text-green-700", bar: 3 },
            expert: { label: "Expert", color: "bg-purple-100 text-purple-700", bar: 4 },
          };
          const config = levelConfig[value as keyof typeof levelConfig] || levelConfig.beginner;
          return (
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                {config.label}
              </span>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-1 w-3 rounded-full ${i <= (config.bar || 1) ? "bg-current" : "bg-gray-200"}`}
                  />
                ))}
              </div>
            </div>
          );
        },
      },
      {
        key: "status",
        label: "Status",
        sortable: true,
        filterable: true,
        render: (value: string) => {
          const statusConfig = {
            pending: { label: "Pending", color: "bg-yellow-100 text-yellow-700" },
            approved: { label: "Approved", color: "bg-green-100 text-green-700" },
            rejected: { label: "Rejected", color: "bg-red-100 text-red-700" },
          };
          const config = statusConfig[value as keyof typeof statusConfig] || statusConfig.pending;
          return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
              {config.label}
            </span>
          );
        },
      },
      {
        key: "source",
        label: "Source",
        sortable: true,
        filterable: true,
        render: (value: string) => {
          const sourceConfig = {
            inferred: { label: "Inferred", color: "bg-gray-100 text-gray-700" },
            self_report: { label: "Self-Report", color: "bg-blue-100 text-blue-700" },
            teacher_assigned: { label: "Teacher Assigned", color: "bg-green-100 text-green-700" },
          };
          const config = sourceConfig[value as keyof typeof sourceConfig] || sourceConfig.inferred;
          return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
              {config.label}
            </span>
          );
        },
      },'''

content = content.replace(old_category, new_category)

# Write back
with open('src/features/student-skills.feature.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Fixed student-skills.feature.tsx')
