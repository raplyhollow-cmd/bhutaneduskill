"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Loader2, Search, MapPin, School } from "lucide-react";
import { cn } from "@/lib/utils";

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
      return;
    }

    const timer = setTimeout(async () => {
      await searchSchools(searchQuery);
    }, 500);

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
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchSchools = async (query: string) => {
    setIsLoading(true);
    setError("");

    try {
      searchAbortRef.current = new AbortController();

      const response = await fetch(
        `/api/schools/search?name=${encodeURIComponent(query)}`,
        {
          signal: searchAbortRef.current.signal,
        }
      );

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data = await response.json();

      if (data.success && data.schools) {
        setResults(data.schools);
        setIsOpen(data.schools.length > 0);
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
      <Label htmlFor="school-search">Find Your School</Label>

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
            "pr-10",
            isOpen && "ring-2 ring-ring ring-offset-2"
          )}
        />

        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          {isLoading ? (
            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
          ) : (
            <Search className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 max-h-64 overflow-y-auto"
        >
          <Card className="border shadow-lg">
            {hasResults ? (
              <ul className="py-1" role="listbox">
                {results.map((school) => (
                  <li
                    key={school.id}
                    role="option"
                    className="px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors border-b last:border-b-0"
                    onClick={() => handleSelectSchool(school)}
                    onMouseDown={(e) => {
                      // Prevent mousedown from triggering input blur before click
                      e.preventDefault();
                      handleSelectSchool(school);
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <School className="w-5 h-5 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {school.name}
                        </p>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">
                            {school.city}
                            {school.state && `, ${school.state}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : showNoResults ? (
              <div className="px-4 py-6 text-center">
                <School className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No schools found</p>
                <p className="text-xs text-gray-400 mt-1">
                  Try a different school name or contact your administrator
                </p>
              </div>
            ) : null}
          </Card>
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {/* Help text */}
      <p className="text-xs text-gray-500">
        Start typing your school name to search. Select your school from the list.
      </p>
    </div>
  );
}
