"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  BookOpen,
  Plus,
  Calendar,
  TrendingUp,
  Lightbulb,
  Target,
  Heart,
  CheckCircle2,
  Trash2,
  Edit,
  Search,
} from "lucide-react";

type JournalEntry = {
  id: string;
  date: string;
  title: string;
  content: string;
  mood: string;
  tags: string[];
};

const PROMPTS = [
  "What career interests you today and why?",
  "What's a new skill you'd like to learn?",
  "Describe a project or activity you enjoyed recently",
  "What are your goals for this month?",
  "What subjects do you enjoy most in school?",
  "If you could have any job, what would it be?",
  "What makes you feel proud of yourself?",
  "What challenges have you overcome recently?",
];

const MOODS = [
  { emoji: "😊", label: "Happy", color: "bg-yellow-100 text-yellow-700" },
  { emoji: "😤�", label: "Thoughtful", color: "bg-blue-100 text-blue-700" },
  { emoji: "💪", label: "Motivated", color: "bg-green-100 text-green-700" },
  { emoji: "😌", label: "Calm", color: "bg-purple-100 text-purple-700" },
  { emoji: "😤", label: "Confused", color: "bg-orange-100 text-orange-700" },
  { emoji: "😴", label: "Tired", color: "bg-gray-100 text-gray-700" },
  { emoji: "😢", label: "Sad", color: "bg-red-100 text-red-700" },
];

const SUGGESTED_TAGS = [
  "Career Goals",
  "Skills",
  "Achievement",
  "Challenge",
  "School",
  "Future",
  "Interests",
  "Dreams",
  "Progress",
];

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isWriting, setIsWriting] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const [newEntry, setNewEntry] = useState({
    title: "",
    content: "",
    mood: "",
    tags: [] as string[],
  });

  const [currentPrompt, setCurrentPrompt] = useState("");

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      const response = await fetch("/api/journal");
      if (response.ok) {
        const data = await response.json();
        setEntries(data.entries || []);
      }
    } catch (error) {
      console.error("Failed to load entries:", error);
    }
  };

  const saveEntry = async () => {
    try {
      const response = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newEntry,
          date: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        loadEntries();
        resetForm();
      }
    } catch (error) {
      console.error("Failed to save entry:", error);
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      await fetch(`/api/journal/${id}`, { method: "DELETE" });
      loadEntries();
    } catch (error) {
      console.error("Failed to delete entry:", error);
    }
  };

  const resetForm = () => {
    setNewEntry({ title: "", content: "", mood: "", tags: [] });
    setCurrentPrompt("");
    setIsWriting(false);
  };

  const toggleTag = (tag: string) => {
    if (newEntry.tags.includes(tag)) {
      setNewEntry({ ...newEntry, tags: newEntry.tags.filter((t) => t !== tag) });
    } else if (newEntry.tags.length < 5) {
      setNewEntry({ ...newEntry, tags: [...newEntry.tags, tag] });
    }
  };

  const getRandomPrompt = () => {
    const prompt = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
    setCurrentPrompt(prompt);
    setNewEntry({ ...newEntry, title: prompt.substring(0, 30) + "..." });
  };

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = !selectedTag || entry.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const sortedEntries = [...filteredEntries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const allTags = Array.from(new Set(entries.flatMap((e) => e.tags)));

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Your Career Journal
          </h1>
          <p className="text-gray-600">
            Reflect on your journey and track your growth over time
          </p>
        </div>
        <Button onClick={() => setIsWriting(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Entry
        </Button>
      </div>

      {isWriting ? (
        <Card className="border-2 border-blue-200">
          <CardHeader>
            <CardTitle>Write Your Reflection</CardTitle>
            <CardDescription>
              Document your thoughts, achievements, and goals
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Writing Prompt */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-900 font-medium mb-2">
                <Lightbulb className="w-4 h-4 inline mr-2" />
                Need inspiration? Try a prompt:
              </p>
              {!currentPrompt ? (
                <Button size="sm" variant="outline" onClick={getRandomPrompt}>
                  Get Random Prompt
                </Button>
              ) : (
                <p className="text-sm text-blue-800">"{currentPrompt}"</p>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Title</label>
              <Input
                value={newEntry.title}
                onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
                placeholder="What's on your mind today?"
              />
            </div>

            {/* Content */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Your Thoughts</label>
              <Textarea
                value={newEntry.content}
                onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
                placeholder="Write about your experiences, goals, or anything on your mind..."
                rows={8}
                className="resize-none"
              />
            </div>

            {/* Mood Selection */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-3 block">How are you feeling?</label>
              <div className="flex flex-wrap gap-3">
                {MOODS.map((mood) => (
                  <button
                    key={mood.label}
                    onClick={() => setNewEntry({ ...newEntry, mood: mood.emoji })}
                    className={`px-4 py-2 rounded-full border-2 transition-all ${
                      newEntry.mood === mood.emoji
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <span className="text-xl mr-1">{mood.emoji}</span>
                    <span className="text-sm">{mood.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-3 block">
                Tags ({newEntry.tags.length}/5)
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {SUGGESTED_TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 rounded-full text-sm border transition-all ${
                      newEntry.tags.includes(tag)
                        ? "border-blue-500 bg-blue-100 text-blue-700"
                        : "border-gray-200 hover:border-gray-300 text-gray-600"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <Button onClick={saveEntry} disabled={!newEntry.title || !newEntry.content}>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Save Entry
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Search and Filter */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search your entries..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <select
                  value={selectedTag || "all"}
                  onChange={(e) => setSelectedTag(e.target.value === "all" ? null : e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Tags</option>
                  {allTags.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Entries List */}
          {sortedEntries.length === 0 ? (
            <Card className="p-12 text-center">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No journal entries yet
              </h3>
              <p className="text-gray-500 mb-6">
                Start documenting your career journey today
              </p>
              <Button onClick={() => setIsWriting(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Write Your First Entry
              </Button>
            </Card>
          ) : (
            <div className="space-y-6">
              {sortedEntries.map((entry) => (
                <Card key={entry.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{entry.title}</h3>
                          <span className="text-xl">{entry.mood}</span>
                          <Badge variant="outline" className="text-xs">
                            <Calendar className="w-3 h-3 mr-1 inline" />
                            {new Date(entry.date).toLocaleDateString()}
                          </Badge>
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap">{entry.content}</p>
                        {entry.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {entry.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => deleteEntry(entry.id)}>
                          <Trash2 className="w-4 h-4 text-gray-400" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Stats */}
          {entries.length > 0 && (
            <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
              <CardHeader>
                <CardTitle>Your Journal Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold">{entries.length}</div>
                    <p className="text-blue-100 text-sm">Total Entries</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold">{allTags.length}</div>
                    <p className="text-blue-100 text-sm">Different Topics</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold">
                      {entries.length > 0
                        ? Math.round(
                            (new Date().getTime() -
                              new Date(entries[entries.length - 1].date).getTime()) /
                              (1000 * 60 * 60 * 24)
                          )
                        : 0}
                    </div>
                    <p className="text-blue-100 text-sm">Days Journaling</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
