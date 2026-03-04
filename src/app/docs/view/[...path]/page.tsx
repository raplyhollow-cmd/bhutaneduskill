import { notFound } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';

interface DocPageProps {
  params: Promise<{ path: string[] }>;
}

async function getDocContent(path: string[]): Promise<{ content: string; title: string } | null> {
  try {
    const filePath = path.join('/');
    const fs = await import('fs/promises');
    const pathModule = await import('path');

    const fullPath = pathModule.join(process.cwd(), 'docs', `${filePath}.md`);

    // Security check
    const docsPath = pathModule.join(process.cwd(), 'docs');
    const resolvedPath = pathModule.resolve(fullPath);
    if (!resolvedPath.startsWith(docsPath)) {
      return null;
    }

    const content = await fs.readFile(fullPath, 'utf-8');

    // Extract title from first heading or use filename
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : path[path.length - 1].replace(/-/g, ' ');

    return { content, title };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: DocPageProps) {
  const { path } = await params;
  const doc = await getDocContent(path);

  if (!doc) {
    return { title: 'Document Not Found' };
  }

  return {
    title: `${doc.title} - Documentation`,
  };
}

export default async function DocPage({ params }: DocPageProps) {
  const { path } = await params;
  const doc = await getDocContent(path);

  if (!doc) {
    notFound();
  }

  const filePath = path.join('/');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <Link
            href="/docs"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400 mb-4"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Documentation Index
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{doc.title}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            docs/{filePath}.md
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <article className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            components={{
              h1: ({ children }) => (
                <h1 className="text-3xl font-bold mt-8 mb-4 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-2xl font-semibold mt-6 mb-3 text-gray-800 dark:text-gray-100">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-xl font-medium mt-5 mb-2 text-gray-800 dark:text-gray-100">
                  {children}
                </h3>
              ),
              h4: ({ children }) => (
                <h4 className="text-lg font-medium mt-4 mb-2 text-gray-800 dark:text-gray-100">
                  {children}
                </h4>
              ),
              p: ({ children }) => (
                <p className="mb-4 text-gray-700 dark:text-gray-300 leading-relaxed">
                  {children}
                </p>
              ),
              a: ({ href, children }) => (
                <a
                  href={href}
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                  target={href?.startsWith('http') ? '_blank' : undefined}
                  rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                >
                  {children}
                </a>
              ),
              ul: ({ children }) => (
                <ul className="list-disc list-inside mb-4 space-y-1 text-gray-700 dark:text-gray-300 ml-4">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal list-inside mb-4 space-y-1 text-gray-700 dark:text-gray-300 ml-4">
                  {children}
                </ol>
              ),
              li: ({ children }) => <li className="mb-1">{children}</li>,
              code: ({ className, children, ...props }) => {
                const isInline = !className;
                return (
                  <code
                    className={
                      isInline
                        ? 'bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-sm font-mono text-red-600 dark:text-red-400'
                        : className
                    }
                    {...props}
                  >
                    {children}
                  </code>
                );
              },
              pre: ({ children }) => (
                <pre className="bg-gray-900 dark:bg-black rounded-lg p-4 overflow-x-auto mb-4 border border-gray-700">
                  {children}
                </pre>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-blue-500 pl-4 italic my-4 text-gray-600 dark:text-gray-400">
                  {children}
                </blockquote>
              ),
              table: ({ children }) => (
                <div className="overflow-x-auto mb-4">
                  <table className="min-w-full border border-gray-300 dark:border-gray-600">
                    {children}
                  </table>
                </div>
              ),
              thead: ({ children }) => (
                <thead className="bg-gray-100 dark:bg-gray-700">{children}</thead>
              ),
              tbody: ({ children }) => <tbody>{children}</tbody>,
              tr: ({ children }) => (
                <tr className="border-b border-gray-200 dark:border-gray-700">{children}</tr>
              ),
              th: ({ children }) => (
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">{children}</td>
              ),
              hr: () => <hr className="my-6 border-gray-300 dark:border-gray-600" />,
              img: ({ src, alt }) => (
                <img
                  src={src}
                  alt={alt}
                  className="rounded-lg my-4 max-w-full h-auto border border-gray-200 dark:border-gray-700"
                />
              ),
            }}
          >
            {doc.content}
          </ReactMarkdown>
        </article>

        {/* Navigation footer */}
        <div className="mt-8 flex justify-between items-center">
          <Link
            href="/docs"
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            ← All Documents
          </Link>
          <Link
            href={`https://github.com/bhutaneduskill/bhutaneduskill/blob/main/docs/${filePath}.md`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            View on GitHub →
          </Link>
        </div>
      </div>
    </div>
  );
}
