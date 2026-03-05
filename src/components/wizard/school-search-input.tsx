"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Search, MapPin, School, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export interface School {
  id: string;
  name: string;
  code: string;
  city: string;
  state?: string;
}

interface SchoolSearchInputProps {
  onSchoolSelect: (school: School) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function SchoolSearchInput({
  onSchoolSelect,
  disabled = false,
  placeholder = "Search for your school by name...",
}: SchoolSearchInputProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<School[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchAbortRef = useRef<AbortController | null>(null);

  // Debounced search
  useEffect(() => {
    // Cancel any pending request
    if (searchAbortRef.current) {
      searchAbortRef.current.abort();
    }

    // Clear results if query is too short
    if (searchQuery.length < 2) {
      setResults([]);
      setIsOpen(false);
      setError("");
      setFocusedIndex(-1);
      return;
    }

    const timer = setTimeout(async () => {
      await searchSchools(searchQuery);
    }, 400);

    return () => {
      clearTimeout(timer);
      if (searchAbortRef.current) {
        searchAbortRef.current.abort();
      }
    };
  }, [searchQuery]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || results.length === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setFocusedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case "Enter":
          e.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < results.length) {
            handleSelectSchool(results[focusedIndex]);
          }
          break;
        case "Escape":
          setIsOpen(false);
          setFocusedIndex(-1);
          inputRef.current?.blur();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, results, focusedIndex]);

  const searchSchools = async (query: string) => {
    setIsLoading(true);
    setError("");

    try {
      searchAbortRef.current = new AbortController();

      // Using unified API pattern for public school search
      const response = await fetch(
        `/api/resources/schools/public?public=search&q=${encodeURIComponent(query)}`,
        {
          signal: searchAbortRef.current.signal,
        }
      );

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data = await response.json();

      // Handle unified API format { data: [...] }
      const schools = data.data || [];

      if (schools) {
        setResults(schools);
        setIsOpen(schools.length > 0);
      } else {
        setResults([]);
        setIsOpen(false);
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        setError("Unable to search schools. Please try again.");
        setResults([]);
        setIsOpen(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSchool = (school: School) => {
    setSearchQuery(school.name);
    setIsOpen(false);
    setFocusedIndex(-1);
    onSchoolSelect(school);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (!isOpen && e.target.value.length >= 2) {
      setIsOpen(true);
    }
  };

  const hasResults = results.length > 0;
  const showNoResults = !isLoading && !hasResults && searchQuery.length >= 2 && !error;

  return (
    <div className="space-y-2 relative">
      <Label htmlFor="school-search" className="text-slate-700 font-medium">
        Find Your School
      </Label>

      <div className="relative">
        <Input
          ref={inputRef}
          id="school-search"
          value={searchQuery}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          onFocus={() => {
            if (searchQuery.length >= 2 && hasResults) {
              setIsOpen(true);
            }
          }}
          className={cn(
            "pr-12 h-12 text-base border-slate-300 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200",
            isOpen && "ring-2 ring-blue-500/20 border-blue-500 shadow-lg shadow-blue-500/10"
          )}
        />

        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
          {isLoading ? (
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
          ) : (
            <Search className={cn(
              "w-5 h-5 transition-colors",
              isOpen ? "text-blue-500" : "text-slate-400"
            )} />
          )}
        </div>
      </div>

      {/* Floating Dropdown Popover */}
      <AnimatePresence>
        {isOpen && (
          <div
            ref={dropdownRef}
            className="absolute z-[100] w-full mt-2"
            style={{ left: 0, right: 0 }}
          >
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative"
            >
              {/* Dropdown Card */}
              <div className="bg-white rounded-2xl shadow-2xl shadow-slate-200/50 border border-slate-200/60 overflow-hidden">
                {hasResults ? (
                  <div className="max-h-80 overflow-y-auto">
                    <div className="p-2">
                      {results.map((school, index) => (
                        <motion.button
                          key={school.id}
                          type="button"
                          onClick={() => handleSelectSchool(school)}
                          onMouseEnter={() => setFocusedIndex(index)}
                          className={cn(
                            "w-full flex items-start gap-3 p-3 rounded-xl transition-all duration-150 text-left",
                            focusedIndex === index
                              ? "bg-gradient-to-r from-blue-50 to-indigo-50 shadow-sm"
                              : "hover:bg-slate-50"
                          )}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03, duration: 0.2 }}
                        >
                          {/* School Icon */}
                          <div className={cn(
                            "w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors",
                            focusedIndex === index
                              ? "bg-gradient-to-br from-blue-500 to-indigo-500"
                              : "bg-slate-100"
                          )}>
                            <Building2 className={cn(
                              "w-5 h-5",
                              focusedIndex === index ? "text-white" : "text-slate-600"
                            )} />
                          </div>

                          {/* School Info */}
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              "font-semibold truncate transition-colors",
                              focusedIndex === index ? "text-blue-700" : "text-slate-900"
                            )}>
                              {school.name}
                            </p>
                            <div className={cn(
                              "flex items-center gap-1.5 text-sm mt-0.5",
                              focusedIndex === index ? "text-blue-600/80" : "text-slate-500"
                            )}>
                              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="truncate">
                                {school.city}
                                {school.state && `, ${school.state}`}
                              </span>
                            </div>
                          </div>

                          {/* Checkmark on hover */}
                          {focusedIndex === index && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 self-center"
                            >
                              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </motion.div>
                          )}
                        </motion.button>
                      ))}
                    </div>

                    {/* Results Footer */}
                    <div className="px-4 py-2 bg-slate-50 border-t border-slate-100">
                      <p className="text-xs text-slate-500 text-center">
                        {results.length} school{results.length !== 1 ? "s" : ""} found
                      </p>
                    </div>
                  </div>
                ) : showNoResults ? (
                  <div className="px-6 py-10 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                      <School className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-base font-medium text-slate-700 mb-1">No schools found</p>
                    <p className="text-sm text-slate-500">
                      Try a different search term or contact your administrator
                    </p>
                  </div>
                ) : isLoading ? (
                  <div className="px-6 py-10 text-center">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-3" />
                    <p className="text-sm text-slate-500">Searching schools...</p>
                  </div>
                ) : null}
              </div>

              {/* Arrow pointer */}
              <div className="absolute -top-2 left-6 w-4 h-4 bg-white border-l border-t border-slate-200/60 transform rotate-45" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Error message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg"
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </motion.div>
      )}

      {/* Help text */}
      <p className="text-xs text-slate-500 flex items-center gap-1.5">
        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Start typing to search. Use ↑↓ arrows to navigate, Enter to select.
      </p>
    </div>
  );
}