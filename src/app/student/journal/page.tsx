"use client";

import { logger } from "@/lib/logger";
import { useToast } from "@/components/ui/toaster";

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
  Sparkles,
  Loader2,
  Tags,
  Wand2,
  Shuffle,
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
  const { toast } = useToast();
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

  // AI Feature States
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [aiTags, setAiTags] = useState<string[]>([]);
  const [aiFeedback, setAiFeedback] = useState("");

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
      logger.error("Failed to load entries:", error);
      toast({
        title: "Failed to load entries",
        description: "Please try refreshing the page",
        variant: "error",
      });
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
        // Get AI feedback for the saved entry
        if (newEntry.content && newEntry.mood) {
          try {
            const feedbackResponse = await fetch("/api/journal/ai-insights", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "feedback",
                entry: {
                  title: newEntry.title,
                  content: newEntry.content,
                  mood: newEntry.mood,
                },
              }),
            });

            if (feedbackResponse.ok) {
              const feedbackData = await feedbackResponse.json();
              setAiFeedback(feedbackData.feedback || "");
            }
          } catch (error) {
            logger.error("Failed to get AI feedback:", error);
          }
        }

        loadEntries();
        resetForm();

        toast({
          title: "Entry saved!",
          description: "Your journal entry has been saved successfully.",
          variant: "success",
        });

        // Show AI feedback if available
        if (aiFeedback) {
          setTimeout(() => {
            toast({
              title: "✨ AI Reflection",
              description: aiFeedback,
              variant: "default",
            });
          }, 1500);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast({
          title: "Failed to save",
          description: errorData.error || "Something went wrong",
          variant: "error",
        });
      }
    } catch (error) {
      logger.error("Failed to save entry:", error);
      toast({
        title: "Failed to save",
        description: "Please check your connection and try again",
        variant: "error",
      });
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      const response = await fetch(`/api/journal/${id}`, { method: "DELETE" });

      if (response.ok) {
        loadEntries();
        toast({
          title: "Entry deleted",
          description: "Your journal entry has been deleted.",
          variant: "default",
        });
      } else {
        toast({
          title: "Failed to delete",
          description: "Could not delete the entry",
          variant: "error",
        });
      }
    } catch (error) {
      logger.error("Failed to delete entry:", error);
      toast({
        title: "Failed to delete",
        description: "Please check your connection and try again",
        variant: "error",
      });
    }
  };

  const resetForm = () => {
    setNewEntry({ title: "", content: "", mood: "", tags: [] });
    setCurrentPrompt("");
    setAiPrompt("");
    setAiSuggestions([]);
    setAiTags([]);
    setAiFeedback("");
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

  // AI: Generate personalized prompt
  const getAIPrompt = async () => {
    setIsAiLoading(true);
    try {
      const response = await fetch("/api/journal/ai-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "prompt",
          context: {
            pastTopics: entries.slice(-5).flatMap((e) => e.tags),
            interests: entries.flatMap((e) => e.tags),
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAiPrompt(data.prompt || "");
        setCurrentPrompt(data.prompt || "");
        setNewEntry({ ...newEntry, title: data.prompt?.substring(0, 30) + "..." || "" });
      }
    } catch (error) {
      logger.error("Failed to get AI prompt:", error);
      toast({
        title: "AI unavailable",
        description: "Using a random prompt instead",
        variant: "default",
      });
      getRandomPrompt();
    } finally {
      setIsAiLoading(false);
    }
  };

  // AI: Get writing suggestions
  const getAISuggestions = async () => {
    if (!newEntry.content || newEntry.content.length < 20) {
      toast({
        title: "Write more first",
        description: "Add a few more sentences to get AI suggestions",
        variant: "default",
      });
      return;
    }

    setIsAiLoading(true);
    try {
      const response = await fetch("/api/journal/ai-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "suggestions",
          entry: { content: newEntry.content },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAiSuggestions(data.suggestions || []);
      }
    } catch (error) {
      logger.error("Failed to get AI suggestions:", error);
    } finally {
      setIsAiLoading(false);
    }
  };

  // AI: Suggest tags based on content
  const getAITags = async () => {
    if (!newEntry.content || newEntry.content.length < 20) {
      toast({
        title: "Write more first",
        description: "Add a few more sentences to get AI tag suggestions",
        variant: "default",
      });
      return;
    }

    setIsAiLoading(true);
    try {
      const response = await fetch("/api/journal/ai-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "tags",
          entry: { content: newEntry.content },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const suggestedTags = data.tags || [];
        setAiTags(suggestedTags);
        // Auto-select first 3 suggested tags if not already selected
        const newTags = [...newEntry.tags];
        suggestedTags.slice(0, 3).forEach((tag: string) => {
          if (!newTags.includes(tag) && newTags.length < 5) {
            newTags.push(tag);
          }
        });
        setNewEntry({ ...newEntry, tags: newTags });
      }
    } catch (error) {
      logger.error("Failed to get AI tags:", error);
    } finally {
      setIsAiLoading(false);
    }
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
              <div className="flex flex-wrap gap-2">
                {!currentPrompt ? (
                  <>
                    <Button size="sm" variant="outline" onClick={getRandomPrompt}>
                      <Shuffle className="w-3 h-3 mr-1" />
                      Random Prompt
                    </Button>
                    <Button size="sm" variant="outline" onClick={getAIPrompt} disabled={isAiLoading}>
                      {isAiLoading ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          AI Thinking...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3 mr-1" />
                          AI Personalized Prompt
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-blue-800 flex-1">"{currentPrompt}"</p>
                    <Button size="sm" variant="ghost" onClick={() => setCurrentPrompt("")}>
                      <Edit className="w-3 h-3" />
                    </Button>
                  </>
                )}
              </div>
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
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Your Thoughts</label>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={getAISuggestions}
                  disabled={isAiLoading || !newEntry.content}
                  className="text-purple-600 hover:text-purple-700"
                >
                  {isAiLoading ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Thinking...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-3 h-3 mr-1" />
                      Get AI Suggestions
                    </>
                  )}
                </Button>
              </div>
              <Textarea
                value={newEntry.content}
                onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
                placeholder="Write about your experiences, goals, or anything on your mind..."
                rows={8}
                className="resize-none"
              />

              {/* AI Writing Suggestions */}
              {aiSuggestions.length > 0 && (
                <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
                  <p className="text-sm font-medium text-purple-900 mb-2">
                    <Sparkles className="w-4 h-4 inline mr-1" />
                    Suggestions to deepen your reflection:
                  </p>
                  <ul className="text-sm text-purple-800 space-y-1">
                    {aiSuggestions.map((suggestion, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
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
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700">
                  Tags ({newEntry.tags.length}/5)
                </label>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={getAITags}
                  disabled={isAiLoading || !newEntry.content}
                  className="text-purple-600 hover:text-purple-700"
                >
                  {isAiLoading ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      AI Tagging...
                    </>
                  ) : (
                    <>
                      <Tags className="w-3 h-3 mr-1" />
                      AI Suggest Tags
                    </>
                  )}
                </Button>
              </div>

              {/* AI Suggested Tags */}
              {aiTags.length > 0 && (
                <div className="mb-3 p-2 bg-purple-50 rounded-lg">
                  <p className="text-xs text-purple-700 mb-1">AI suggested:</p>
                  <div className="flex flex-wrap gap-1">
                    {aiTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant={newEntry.tags.includes(tag) ? "default" : "outline"}
                        className="cursor-pointer text-xs"
                        onClick={() => toggleTag(tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
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
