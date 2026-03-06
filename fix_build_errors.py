import re

# Fix schema.ts - missing closing brace
with open('src/lib/db/schema.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the pattern and add missing closing brace
# Pattern: export { busAttendance, [newline] n// Career Counseling
# Should be: export { busAttendance }; [newline] n// Career Counseling
content = content.replace(
    'export {\n  busAttendance,\n  n// Career Counseling',
    'export {\n  busAttendance };\n\n// Career Counseling'
)

with open('src/lib/db/schema.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print('Fixed schema.ts')

# Fix labor-market-data.ts - type arrow function syntax
with open('src/lib/data/labor-market-data.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# The issue is that the type annotation should be after the parameter, not before the return type arrow
# This: function getCareersByTrend(trend: "increasing" | "stable" | "decreasing" | "emerging"): JobMarketData[] {
# The line is too long, need to fix by wrapping properly or shortening
# Let's look at the line 1099-1100 issue

# The error shows line 1100 has a very long line that needs wrapping
# Let's fix it by adding proper line breaks
old_labor = '''  return jobMarketData.filter((d => d.demandTrend === trend || (trend === "emerging" && d.fiveYearProjection === "emerging"));
      }'''

new_labor = '''  return jobMarketData.filter((d) =>
    d.demandTrend === trend || (trend === "emerging" && d.fiveYearProjection === "emerging")
  );
}'''

content = content.replace(old_labor, new_labor)

with open('src/lib/data/labor-market-data.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print('Fixed labor-market-data.ts')

# Fix career-roadmaps-schema.ts - wrong import path
with open('src/lib/db/career-roadmaps-schema.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Change './users' to '../users' since career-roadmaps-schema.ts is in a subdirectory
content = content.replace('from "./users"', 'from "../users"')

with open('src/lib/db/career-roadmaps-schema.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print('Fixed career-roadmaps-schema.ts')
print('All 3 files fixed!')
