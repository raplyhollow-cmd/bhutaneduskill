import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export const runtime = 'nodejs';

export async function GET(
  request: Request,
  { params }: { params: { path: string[] } }
) {
  try {
    const filePath = params.path.join('/');
    const fullPath = join(process.cwd(), 'docs', filePath);

    // Security check: ensure path is within docs folder
    const docsPath = join(process.cwd(), 'docs');
    const resolvedPath = require('path').resolve(fullPath);
    if (!resolvedPath.startsWith(docsPath)) {
      return NextResponse.json(
        { error: 'Invalid path' },
        { status: 403 }
      );
    }

    const content = await readFile(fullPath, 'utf-8');

    return NextResponse.json({
      path: filePath,
      content,
    });
  } catch (error) {
    console.error('Error reading doc:', error);
    return NextResponse.json(
      { error: 'File not found' },
      { status: 404 }
    );
  }
}
