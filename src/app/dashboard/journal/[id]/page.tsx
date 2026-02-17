"use client";

import { logger } from "@/lib/logger";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Trash2, Calendar, Tag } from "lucide-react";

const MOODS = [
  { emoji: "😊", label: "Happy", color: "bg-yellow-100 text-yellow-700" },
  { emoji: "🤔", label: "Thoughtful", color: "bg-blue-100 text-blue-700" },
  { emoji: "💪", label: "Motivated", color: "bg-green-100 text-green-700" },
  { emoji: "😌", label: "Calm", color: "bg-purple-100 text-purple-700" },
  { emoji: "😕", label: "Confused", color: "bg-orange-100 text-orange-700" },
  { emoji: "😴", label: "Tired", color: "bg-gray-100 text-gray-700" },
  { emoji: "😢", label: "Sad", color: "bg-red-100 text-red-700" },
];

type JournalEntry = {
  id: string;
  date: string;
  title: string;
  content: string;
  mood: string;
  tags: string[];
};

export default function JournalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEntry = async () => {
      try {
        const response = await fetch(`/api/journal/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setEntry(data.entry);
          setTitle(data.entry.title);
          setContent(data.entry.content);
          setMood(data.entry.mood);
          setTags(data.entry.tags || []);
        }
      } catch (error) {
        logger.error("Failed to fetch entry:", error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id !== "new") {
      fetchEntry();
    } else {
      setLoading(false);
      setIsEditing(true);
    }
  }, [params.id]);

  const handleSave = async () => {
    try {
      const url = params.id === "new" ? "/api/journal" : `/api/journal/${params.id}`;
      const method = params.id === "new" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          mood,
          tags,
          date: entry?.date || new Date().toISOString(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setEntry(data.entry);
        setIsEditing(false);
        if (params.id === "new") {
          router.push(`/dashboard/journal/${data.entry.id}`);
        }
      }
    } catch (error) {
      logger.error("Failed to save entry:", error);
      alert("Failed to save entry");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this entry?")) return;

    try {
      const response = await fetch(`/api/journal/${params.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/dashboard/journal");
      }
    } catch (error) {
      logger.error("Failed to delete entry:", error);
      alert("Failed to delete entry");
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const selectedMood = MOODS.find((m) => m.label === mood);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {isEditing ? (
        <Card>
          <CardHeader>
            <CardTitle>Edit Journal Entry</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="text-sm font-medium mb-2 block">Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your entry a title..."
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">How are you feeling?</label>
              <div className="flex flex-wrap gap-2">
                {MOODS.map((m) => (
                  <button
                    key={m.label}
                    onClick={() => setMood(m.label)}
                    className={
                      "px-4 py-2 rounded-lg border-2 transition-all " +
                      (mood === m.label ? m.color + " border-current " : "border-gray-200 hover:border-gray-300 ")
                    }
                  >
                    <span className="text-xl mr-1">{m.emoji}</span>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Your thoughts...</label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write about your career journey, goals, reflections..."
                rows={12}
                className="resize-none"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Tags</label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                  placeholder="Add a tag..."
                  className="flex-1"
                />
                <Button type="button" onClick={handleAddTag} variant="outline">
                  <Tag className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => handleRemoveTag(tag)}>
                    {tag}
                    <span className="ml-1">×</span>
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        entry && (
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{entry.title}</CardTitle>
                  <CardDescription className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(entry.date).toLocaleDateString()}
                    </span>
                    {selectedMood && (
                      <span className={"px-3 py-1 rounded-full " + selectedMood.color}>
                        {selectedMood.emoji} {selectedMood.label}
                      </span>
                    )}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="prose max-w-none">
                <p className="whitespace-pre-wrap">{entry.content}</p>
              </div>

              {entry.tags && entry.tags.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {entry.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
}
