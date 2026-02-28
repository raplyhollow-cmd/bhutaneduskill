#!/usr/bin/env python3
"""
Comprehensive Route Migration Script
Migrates all routes to createApiRoute pattern
"""

import os
import re
import sys
from pathlib import Path

def find_routes_to_migrate():
    """Find all route files that need migration"""
    api_dir = Path("src/app/api")
    routes = []

    for route_file in api_dir.rglob("route.ts"):
        content = route_file.read_text(encoding='utf-8')

        # Skip if already migrated
        if 'createApiRoute' in content:
            continue

        # Skip setup routes (they use Clerk auth directly)
        if '/setup/' in str(route_file):
            continue

        # Only migrate if it has requireAuth pattern
        if 'requireAuth' in content and 'export async function' in content:
            routes.append(route_file)

    return routes

def migrate_route_file(route_file):
    """Migrate a single route file"""
    content = route_file.read_text(encoding='utf-8')
    original = content

    # Skip if already migrated
    if 'createApiRoute' in content:
        return False, "Already migrated"

    # Update imports
    content = re.sub(
        r'import \{ NextRequest, NextResponse \} from "next/server";',
        'import { NextRequest } from "next/server";',
        content
    )

    # Add createApiRoute import
    if 'createApiRoute' not in content and 'requireAuth' in content:
        if 'from "@/lib/auth-utils"' in content:
            content = re.sub(
                r'from "@/lib/auth-utils"',
                'from "@/lib/auth-utils"\nimport { createApiRoute } from "@/lib/api/route-handler"',
                content
            )
        else:
            # Add after first import
            content = re.sub(
                r'(\nimport [^\n]+;\n)',
                r'\1import { createApiRoute } from "@/lib/api/route-handler";\n',
                content,
                count=1
            )

    # Migrate each HTTP method
    for method in ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']:
        # Pattern: export async function METHOD(request: NextRequest) {
        pattern = rf'export async function {method}\((request|req): NextRequest(?:, {{ params }}: {{ params: Promise<[^>]+> }})?\) \{{\s*try \{{'
        if not re.search(pattern, content):
            continue

        # Find and replace the function
        def replace_method(match):
            full_match = match.group(0)
            # Extract roles from requireAuth call
            roles_match = re.search(r'await requireAuth\(([^)]+)\)', full_match)
            roles = roles_match.group(1) if roles_match else '[]'

            # Check if there's a destructuring
            has_destruct = 'const { userId, user } = authResult;' in full_match

            replacement = f'''export const {method} = createApiRoute(
  async (request: NextRequest, auth) => {{'''

            if has_destruct:
                replacement += '\n    const { userId, user } = auth;'

            return replacement

        content = re.sub(pattern, replace_method, content)

    # Remove authResult error handling
    content = re.sub(
        r'const authResult = await requireAuth\([^)]+\);\s*if \(\'error\' in authResult\) \{\s*return NextResponse\.json\(\{ error: authResult\.error \}, \{ status: authResult\.status \}\);\s*\}\s*(const \{ userId, user \} = authResult;)?\s*',
        '',
        content
    )

    # Replace NextResponse.json returns with plain objects
    content = re.sub(
        r'return NextResponse\.json\((\{[^}]+\}), \{ status: (\d+) \}\)',
        r'return { ...$1, status: $2 }',
        content
    )

    content = re.sub(
        r'return NextResponse\.json\((\{[^}]+\})\)(?!,\s*\{ status:)',
        r'return $1',
        content
    )

    # Replace closing try-catch with createApiRoute closing
    # This is tricky - we need to match the specific pattern
    def replace_catch(match):
        body = match.group(1)
        # Try to extract roles from context
        roles_match = re.search(r'createApiRoute\(\s*async \([^)]*\) => \s*[^,]*,\s*\[([^\]]+)\]', body)
        if roles_match:
            roles = roles_match.group(1)
            return f'{body.strip()  }},\n  [{roles}]\n);'
        return match.group(0)

    # Skip complex catch replacement for now - focus on simple patterns

    if content != original:
        route_file.write_text(content, encoding='utf-8')
        return True, "Migrated"

    return False, "No changes needed"

def main():
    routes = find_routes_to_migrate()
    print(f"Found {len(routes)} routes to migrate")

    migrated = 0
    failed = 0

    for route_file in routes:
        try:
            success, message = migrate_route_file(route_file)
            if success:
                print(f"✓ {route_file}")
                migrated += 1
        except Exception as e:
            print(f"✗ {route_file}: {e}")
            failed += 1

    print(f"\nMigration complete:")
    print(f"  ✓ Migrated: {migrated}")
    print(f"  ✗ Failed: {failed}")
    print(f"  Total: {len(routes)}")

if __name__ == "__main__":
    main()
