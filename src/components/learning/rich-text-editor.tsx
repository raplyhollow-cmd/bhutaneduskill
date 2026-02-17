/**
 * RICH TEXT EDITOR
 * Lightweight WYSIWYG editor for learning module content
 * Uses browser contentEditable API - no external dependencies
 */
"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2,
  Link as LinkIcon,
  Unlink,
  Undo,
  Redo,
  Code,
  Quote,
} from "lucide-react";

export interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  maxLength?: number;
}

const TOOLBAR_BUTTONS = [
  { icon: Undo, command: "undo", title: "Undo" },
  { icon: Redo, command: "redo", title: "Redo" },
  { divider: true },
  { icon: Heading1, command: "formatBlock", value: "H1", title: "Heading 1" },
  { icon: Heading2, command: "formatBlock", value: "H2", title: "Heading 2" },
  { divider: true },
  { icon: Bold, command: "bold", title: "Bold (Ctrl+B)" },
  { icon: Italic, command: "italic", title: "Italic (Ctrl+I)" },
  { icon: Underline, command: "underline", title: "Underline (Ctrl+U)" },
  { divider: true },
  { icon: List, command: "insertUnorderedList", title: "Bullet List" },
  { icon: ListOrdered, command: "insertOrderedList", title: "Numbered List" },
  { divider: true },
  { icon: AlignLeft, command: "justifyLeft", title: "Align Left" },
  { icon: AlignCenter, command: "justifyCenter", title: "Align Center" },
  { icon: AlignRight, command: "justifyRight", title: "Align Right" },
  { divider: true },
  { icon: Quote, command: "formatBlock", value: "BLOCKQUOTE", title: "Quote" },
  { icon: Code, command: "formatBlock", value: "PRE", title: "Code Block" },
];

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Start typing...",
  minHeight = "150px",
  maxLength,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  const execCommand = useCallback((command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
    editorRef.current?.focus();
  }, [onChange]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      onChange(content);
    }
  }, [onChange]);

  const handleLinkSubmit = useCallback(() => {
    if (linkUrl) {
      execCommand("createLink", linkUrl);
      setLinkUrl("");
      setShowLinkDialog(false);
    }
  }, [linkUrl, execCommand]);

  const handleUnlink = useCallback(() => {
    execCommand("unlink");
  }, [execCommand]);

  // Insert HTML at cursor
  const insertHtml = useCallback((html: string) => {
    document.execCommand("insertHTML", false, html);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  return (
    <div className="border rounded-lg overflow-hidden bg-background">
      {/* Toolbar */}
      <div className="border-b bg-muted/50 p-2 flex flex-wrap gap-1 items-center">
        {TOOLBAR_BUTTONS.map((btn, idx) => {
          if (btn.divider) {
            return (
              <div key={`divider-${idx}`} className="w-px h-6 bg-border mx-1" />
            );
          }

          const Icon = btn.icon;
          return (
            <Button
              key={idx}
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => execCommand(btn.command, btn.value)}
              title={btn.title}
            >
              <Icon className="w-4 h-4" />
            </Button>
          );
        })}

        <div className="w-px h-6 bg-border mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => setShowLinkDialog(true)}
          title="Insert Link"
        >
          <LinkIcon className="w-4 h-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={handleUnlink}
          title="Remove Link"
        >
          <Unlink className="w-4 h-4" />
        </Button>
      </div>

      {/* Link Dialog */}
      {showLinkDialog && (
        <div className="border-b p-3 bg-muted/30 flex gap-2 items-center">
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://example.com"
            className="flex-1 px-3 py-2 border rounded-md text-sm"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleLinkSubmit();
              if (e.key === "Escape") setShowLinkDialog(false);
            }}
          />
          <Button size="sm" onClick={handleLinkSubmit}>
            Insert
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setShowLinkDialog(false)}>
            Cancel
          </Button>
        </div>
      )}

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        suppressContentEditableWarning
        className="p-4 outline-none prose prose-sm max-w-none"
        style={{ minHeight }}
        dangerouslySetInnerHTML={{ __html: value }}
        data-placeholder={placeholder}
      />

      {/* Character Count */}
      {maxLength && (
        <div className="border-t px-3 py-2 text-xs text-muted-foreground text-right">
          {editorRef.current?.textContent?.length || 0} / {maxLength}
        </div>
      )}

      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: hsl(var(--muted-foreground));
          pointer-events: none;
        }

        .prose :global(p) {
          margin-bottom: 0.5em;
        }

        .prose :global(h1),
        .prose :global(h2) {
          font-weight: 600;
          margin-top: 0.5em;
          margin-bottom: 0.25em;
        }

        .prose :global(h1) {
          font-size: 1.5rem;
        }

        .prose :global(h2) {
          font-size: 1.25rem;
        }

        .prose :global(blockquote) {
          border-left: 3px solid hsl(var(--border));
          padding-left: 1rem;
          color: hsl(var(--muted-foreground));
        }

        .prose :global(pre) {
          background: hsl(var(--muted));
          padding: 0.75rem;
          border-radius: 0.375rem;
          font-family: monospace;
          overflow-x: auto;
        }

        .prose :global(a) {
          color: hsl(var(--primary));
          text-decoration: underline;
        }

        .prose :global(ul),
        .prose :global(ol) {
          padding-left: 1.5rem;
        }

        .prose :global(li) {
          margin-bottom: 0.25rem;
        }
      `}</style>
    </div>
  );
}

/**
 * Parse video URL to embed code
 */
export function parseVideoUrl(url: string): { type: "youtube" | "vimeo" | "mp4" | null; embedUrl: string | null } {
  if (!url) return { type: null, embedUrl: null };

  // YouTube
  const youtubeMatch = url.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  );
  if (youtubeMatch) {
    return {
      type: "youtube",
      embedUrl: `https://www.youtube.com/embed/${youtubeMatch[1]}`,
    };
  }

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return {
      type: "vimeo",
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
    };
  }

  // Direct MP4
  if (url.match(/\.(mp4|webm|ogg)(\?.*)?$/i)) {
    return {
      type: "mp4",
      embedUrl: url,
    };
  }

  return { type: null, embedUrl: null };
}

/**
 * Video embedder component
 */
export interface VideoEmbedderProps {
  url: string;
  onChange: (embedUrl: string) => void;
}

export function VideoEmbedder({ url, onChange }: VideoEmbedderProps) {
  const [inputUrl, setInputUrl] = useState(url);
  const parsed = parseVideoUrl(inputUrl);

  const handleUrlChange = (value: string) => {
    setInputUrl(value);
    const result = parseVideoUrl(value);
    if (result.embedUrl) {
      onChange(result.embedUrl);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium mb-2 block">Video URL</label>
        <div className="flex gap-2">
          <input
            type="url"
            value={inputUrl}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="YouTube, Vimeo, or direct MP4 link"
            className="flex-1 px-3 py-2 border rounded-md text-sm"
          />
        </div>
      </div>

      {parsed.embedUrl && (
        <div className="rounded-lg overflow-hidden bg-black aspect-video">
          {parsed.type === "youtube" && (
            <iframe
              src={parsed.embedUrl}
              title="YouTube video"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              className="w-full h-full"
            />
          )}
          {parsed.type === "vimeo" && (
            <iframe
              src={parsed.embedUrl}
              title="Vimeo video"
              allowFullScreen
              allow="autoplay; fullscreen; picture-in-picture"
              className="w-full h-full"
            />
          )}
          {parsed.type === "mp4" && (
            <video controls className="w-full h-full">
              <source src={parsed.embedUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          )}
        </div>
      )}

      {inputUrl && !parsed.embedUrl && (
        <p className="text-sm text-amber-600">
          Unsupported video URL. Please use YouTube, Vimeo, or direct MP4 links.
        </p>
      )}

      <div className="text-xs text-muted-foreground">
        <p>Supported: YouTube (youtube.com, youtu.be), Vimeo (vimeo.com), MP4 files</p>
      </div>
    </div>
  );
}
