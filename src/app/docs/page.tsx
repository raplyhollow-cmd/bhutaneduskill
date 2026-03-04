'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface DocFile {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: DocFile[];
}

export default function DocsPage() {
  const [tree, setTree] = useState<DocFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch('/api/docs/list')
      .then(res => res.json())
      .then(data => {
        setTree(data.tree || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading docs:', err);
        setLoading(false);
      });
  }, []);

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const filterTree = (files: DocFile[]): DocFile[] => {
    if (!searchQuery) return files;

    const filtered: DocFile[] = [];
    for (const file of files) {
      const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());

      if (file.type === 'directory') {
        const filteredChildren = filterTree(file.children || []);
        if (matchesSearch || filteredChildren.length > 0) {
          filtered.push({
            ...file,
            children: filteredChildren,
          });
        }
      } else if (matchesSearch) {
        filtered.push(file);
      }
    }
    return filtered;
  };

  const renderTree = (files: DocFile[], level = 0) => {
    return files.map(file => {
      const isExpanded = expandedFolders.has(file.path);

      if (file.type === 'directory') {
        return (
          <div key={file.path} className="mt-1">
            <button
              onClick={() => toggleFolder(file.path)}
              className="flex items-center gap-1 hover:bg-blue-50 dark:hover:bg-gray-800 px-2 py-1 rounded w-full text-left transition-colors"
              style={{ paddingLeft: `${level * 16 + 8}px` }}
            >
              <svg
                className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
              </svg>
              <span className="font-medium">{file.name.replace(/-/g, ' ')}</span>
              <span className="text-xs text-gray-400 ml-2">
                {file.children?.length || 0} items
              </span>
            </button>
            {isExpanded && file.children && (
              <div>{renderTree(file.children, level + 1)}</div>
            )}
          </div>
        );
      }

      return (
        <Link
          key={file.path}
          href={`/docs/view/${file.path.replace('.md', '')}`}
          className="flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-gray-800 px-2 py-1 rounded transition-colors"
          style={{ paddingLeft: `${level * 16 + 28}px` }}
        >
          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span className="text-gray-700 dark:text-gray-300">
            {file.name.replace('.md', '').replace(/-/g, ' ')}
          </span>
        </Link>
      );
    });
  };

  const filteredTree = filterTree(tree);
  const countFiles = (files: DocFile[]): number => {
    let count = 0;
    for (const file of files) {
      if (file.type === 'file') count++;
      if (file.children) count += countFiles(file.children);
    }
    return count;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Bhutan EduSkill Documentation
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Complete technical documentation, architecture guides, and implementation notes
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Search */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="Search documentation..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          />
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {countFiles(filteredTree)} documents found
          </p>
        </div>

        {/* File Tree */}
        {loading ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            Loading documentation...
          </div>
        ) : filteredTree.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            No documents found matching "{searchQuery}"
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Documentation Index
              </h2>
              <button
                onClick={() => {
                  if (expandedFolders.size > 0) {
                    setExpandedFolders(new Set());
                  } else {
                    const expandAll = (files: DocFile[]): string[] => {
                      const paths: string[] = [];
                      for (const file of files) {
                        if (file.type === 'directory') {
                          paths.push(file.path);
                          if (file.children) paths.push(...expandAll(file.children));
                        }
                      }
                      return paths;
                    };
                    setExpandedFolders(new Set(expandAll(tree)));
                  }
                }}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                {expandedFolders.size > 0 ? 'Collapse All' : 'Expand All'}
              </button>
            </div>
            {renderTree(filteredTree)}
          </div>
        )}

        {/* Quick Links */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/docs/view/TOR_DOCUMENTATION_INDEX"
            className="bg-blue-50 dark:bg-gray-800 p-4 rounded-lg hover:bg-blue-100 dark:hover:bg-gray-700 transition-colors"
          >
            <h3 className="font-semibold text-blue-900 dark:text-blue-300">
              📋 TOR Index
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Main documentation index
            </p>
          </Link>
          <Link
            href="/docs/view/DEVELOPMENT_FRAMEWORK"
            className="bg-green-50 dark:bg-gray-800 p-4 rounded-lg hover:bg-green-100 dark:hover:bg-gray-700 transition-colors"
          >
            <h3 className="font-semibold text-green-900 dark:text-green-300">
              🛠️ Development Framework
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Coding patterns and rules
            </p>
          </Link>
          <Link
            href="/docs/view/UNIFIED_ARCHITECTURE"
            className="bg-purple-50 dark:bg-gray-800 p-4 rounded-lg hover:bg-purple-100 dark:hover:bg-gray-700 transition-colors"
          >
            <h3 className="font-semibold text-purple-900 dark:text-purple-300">
              🏗️ Architecture
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              System architecture overview
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
