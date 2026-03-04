import { NextResponse } from 'next/server';
import { readFile, readdir, stat } from 'fs/promises';
import { join } from 'path';

export const runtime = 'nodejs';

interface DocFile {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: DocFile[];
}

async function buildDocTree(basePath: string, relativePath = ''): Promise<DocFile[]> {
  const fullPath = join(basePath, relativePath);
  const entries = await readdir(fullPath, { withFileTypes: true });

  const files: DocFile[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue; // Skip hidden files

    const entryPath = join(fullPath, entry.name);
    const stats = await stat(entryPath);
    const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      const children = await buildDocTree(basePath, relPath);
      if (children.length > 0) {
        files.push({
          name: entry.name,
          path: relPath,
          type: 'directory',
          children,
        });
      }
    } else if (entry.name.endsWith('.md')) {
      files.push({
        name: entry.name,
        path: relPath,
        type: 'file',
      });
    }
  }

  return files.sort((a, b) => {
    // Directories first
    if (a.type === 'directory' && b.type === 'file') return -1;
    if (a.type === 'file' && b.type === 'directory') return 1;
    return a.name.localeCompare(b.name);
  });
}

export async function GET() {
  try {
    const docsPath = join(process.cwd(), 'docs');
    const tree = await buildDocTree(docsPath);

    return NextResponse.json({ tree });
  } catch (error) {
    console.error('Error listing docs:', error);
    return NextResponse.json(
      { error: 'Failed to list documentation' },
      { status: 500 }
    );
  }
}
