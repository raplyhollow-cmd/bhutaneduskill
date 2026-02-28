#!/bin/bash

echo "School Admin Portal - Quick QA Test"
echo "===================================="
echo ""

# Test key pages
declare -a pages=(
  "page:/school-admin"
  "dashboard:/school-admin/dashboard"
  "students:/school-admin/students"
  "teachers:/school-admin/teachers"
  "classes:/school-admin/classes"
  "subjects:/school-admin/subjects"
  "attendance:/school-admin/attendance"
  "results:/school-admin/results"
  "fees:/school-admin/fees"
  "timetable:/school-admin/timetable"
)

passed=0
failed=0

for page_info in "${pages[@]}"; do
  name="${page_info%%:*}"
  url="${page_info##*:}"
  
  printf "%-15s ... " "$name"
  
  # Quick curl test
  status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 "http://localhost:3002$url" 2>/dev/null)
  
  if [ "$status" = "200" ] || [ "$status" = "304" ]; then
    echo "✓ OK (HTTP $status)"
    ((passed++))
  elif [ "$status" = "302" ] || [ "$status" = "307" ]; then
    echo "⚠ REDIRECT (HTTP $status)"
    ((passed++))
  else
    echo "✗ FAIL (HTTP $status)"
    ((failed++))
  fi
done

echo ""
echo "Results: $passed passed, $failed failed out of ${#pages[@]} pages"
echo ""
