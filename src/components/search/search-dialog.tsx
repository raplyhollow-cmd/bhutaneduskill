/**
 * Search Dialog Component
 *
 * Command palette style search dialog
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export interface SearchItem {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  scope?: string;
  action: () => void;
}

export interface SearchScope {
  id: string;
  name: string;
  items: SearchItem[];
}

export interface SearchDialogProps {
  scopes: SearchScope[];
  placeholder?: string;
}

export function SearchDialog({ scopes, placeholder = "Search..." }: SearchDialogProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);

    // Simulate search across all scopes
    const allResults: SearchItem[] = [];
    for (const scope of scopes) {
      for (const item of scope.items) {
        if (item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
          allResults.push({ ...item, scope: scope.name });
        }
      }
    }

    setResults(allResults);
    setLoading(false);
  };

  const handleSelect = (item: SearchItem) => {
    setOpen(false);
    setQuery("");
    item.action();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Search</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              ref={inputRef}
              type="text"
              placeholder={placeholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
              autoFocus
            />
            {loading && <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-gray-400" />}
          </div>

          {results.length > 0 && (
            <div className="max-h-96 overflow-y-auto">
              {results.map((item, index) => (
                <div
                  key={`${item.scope}-${item.id}-${index}`}
                  className="flex items-center gap-3 p-3 hover:bg-gray-100 cursor-pointer rounded-lg"
                  onClick={() => handleSelect(item)}
                >
                  {item.icon && <div className="text-gray-500">{item.icon}</div>}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.title}</p>
                    {item.description && (
                      <p className="text-sm text-gray-500">{item.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {results.length === 0 && query.trim() && !loading && (
            <div className="text-center py-8 text-gray-500">
              No results found
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function SearchTriggerButton({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      onClick={onClick}
    >
      <Search className="w-4 h-4" />
      {children || "Search..."}
    </button>
  );
}

export function useSearchDialog() {
  const [open, setOpen] = useState(false);

  return {
    open,
    setOpen,
    SearchDialog,
    SearchTriggerButton,
  };
}

export default SearchDialog;
