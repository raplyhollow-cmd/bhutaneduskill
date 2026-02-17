"use client";

import { logger } from "@/lib/logger";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateCollege } from "@/app/admin/content/actions";

interface College {
  id: string;
  name: string;
  slug: string;
  location: string;
  website?: string;
  type: string;
  dzongkhag?: string;
  isBhutanCollege?: boolean;
  bhutanCollegeType?: "rub" | "private" | "international";
  acceptanceRate?: number | string;
  avgSAT?: number | string;
  avgACT?: number | string;
  requiredGPA?: string;
}

interface EditCollegeModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  college: College | null;
}

export function EditCollegeModal({ open, onClose, onSuccess, college }: EditCollegeModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [type, setType] = useState("public");
  const [dzongkhag, setDzongkhag] = useState("");
  const [isBhutanCollege, setIsBhutanCollege] = useState(true);
  const [bhutanCollegeType, setBhutanCollegeType] = useState<"rub" | "private" | "international">("private");
  const [acceptanceRate, setAcceptanceRate] = useState("");
  const [avgSAT, setAvgSAT] = useState("");
  const [avgACT, setAvgACT] = useState("");
  const [requiredGPA, setRequiredGPA] = useState("");

  // Populate form when college changes
  useEffect(() => {
    if (college) {
      setName(college.name || "");
      setSlug(college.slug || "");
      setLocation(college.location || "");
      setWebsite(college.website || "");
      setType(college.type || "public");
      setDzongkhag(college.dzongkhag || "");
      setIsBhutanCollege(college.isBhutanCollege ?? true);
      setBhutanCollegeType(college.bhutanCollegeType || "private");
      setAcceptanceRate(college.acceptanceRate ? String(college.acceptanceRate) : "");
      setAvgSAT(college.avgSAT ? String(college.avgSAT) : "");
      setAvgACT(college.avgACT ? String(college.avgACT) : "");
      setRequiredGPA(college.requiredGPA || "");
    }
  }, [college]);

  // Auto-generate slug from name
  const generateSlug = (value: string) => {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slug || slug === generateSlug(name)) {
      setSlug(generateSlug(value));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!college?.id) return;

    setIsLoading(true);

    try {
      // Map form data to match updateCollege function expectations
      const payload = {
        name,
        code: slug, // Map slug to code for compatibility
        type: (type === "public" ? "constituent" : "affiliated") as "constituent" | "affiliated",
        dzongkhag,
        location,
        website,
      };

      await updateCollege(college.id, payload);

      onSuccess();
      onClose();
    } catch (error) {
      logger.error("[EDIT COLLEGE] Error:", error);
      alert(error instanceof Error ? error.message : "Failed to update college. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!open || !college) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Edit College</h2>
          <p className="text-sm text-gray-600 mt-1">Update college information</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-name">College Name *</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g., Royal Thimphu College"
                required
              />
            </div>

            <div>
              <Label htmlFor="edit-slug">Slug *</Label>
              <Input
                id="edit-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g., royal-thimphu-college"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-location">Location *</Label>
              <Input
                id="edit-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Thimphu"
                required
              />
            </div>

            <div>
              <Label htmlFor="edit-dzongkhag">Dzongkhag</Label>
              <Select value={dzongkhag} onValueChange={setDzongkhag}>
                <SelectTrigger>
                  <SelectValue placeholder="Select dzongkhag" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="thimphu">Thimphu</SelectItem>
                  <SelectItem value="paro">Paro</SelectItem>
                  <SelectItem value="punakha">Punakha</SelectItem>
                  <SelectItem value="wangdue">Wangdue Phodrang</SelectItem>
                  <SelectItem value="tsirang">Tsirang</SelectItem>
                  <SelectItem value="dagana">Dagana</SelectItem>
                  <SelectItem value="pemagatshel">Pemagatshel</SelectItem>
                  <SelectItem value="trashigang">Trashigang</SelectItem>
                  <SelectItem value="mongar">Mongar</SelectItem>
                  <SelectItem value="bumthang">Bumthang</SelectItem>
                  <SelectItem value="sarpang">Sarpang</SelectItem>
                  <SelectItem value="samtse">Samtse</SelectItem>
                  <SelectItem value="zhemgang">Zhemgang</SelectItem>
                  <SelectItem value="trashiyangtse">Trashiyangtse</SelectItem>
                  <SelectItem value="samdrupjongkhar">Samdrup Jongkhar</SelectItem>
                  <SelectItem value="lhuentse">Lhuentse</SelectItem>
                  <SelectItem value="gewog">Gasa</SelectItem>
                  <SelectItem value="haa">Haa</SelectItem>
                  <SelectItem value="chukha">Chukha</SelectItem>
                  <SelectItem value="international">International</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="edit-website">Website</Label>
            <Input
              id="edit-website"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="e.g., https://www.rub.edu.bt"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-type">College Type *</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="community">Community</SelectItem>
                  <SelectItem value="international">International</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2 pt-6">
              <input
                type="checkbox"
                id="edit-isBhutanCollege"
                checked={isBhutanCollege}
                onChange={(e) => setIsBhutanCollege(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
              />
              <Label htmlFor="edit-isBhutanCollege" className="cursor-pointer">
                Bhutan College
              </Label>
            </div>
          </div>

          {isBhutanCollege && (
            <div>
              <Label htmlFor="edit-bhutanCollegeType">Bhutan College Type</Label>
              <Select value={bhutanCollegeType} onValueChange={(value: "rub" | "private" | "international") => setBhutanCollegeType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rub">RUB College</SelectItem>
                  <SelectItem value="private">Private College</SelectItem>
                  <SelectItem value="international">International Branch</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="edit-acceptanceRate">Acceptance Rate (%)</Label>
              <Input
                id="edit-acceptanceRate"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={acceptanceRate}
                onChange={(e) => setAcceptanceRate(e.target.value)}
                placeholder="e.g., 45"
              />
            </div>

            <div>
              <Label htmlFor="edit-avgSAT">Avg SAT Score</Label>
              <Input
                id="edit-avgSAT"
                type="number"
                min="400"
                max="1600"
                value={avgSAT}
                onChange={(e) => setAvgSAT(e.target.value)}
                placeholder="e.g., 1200"
              />
            </div>

            <div>
              <Label htmlFor="edit-avgACT">Avg ACT Score</Label>
              <Input
                id="edit-avgACT"
                type="number"
                min="1"
                max="36"
                value={avgACT}
                onChange={(e) => setAvgACT(e.target.value)}
                placeholder="e.g., 25"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="edit-requiredGPA">Required GPA</Label>
            <Input
              id="edit-requiredGPA"
              value={requiredGPA}
              onChange={(e) => setRequiredGPA(e.target.value)}
              placeholder="e.g., 3.0 or 60%"
            />
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !name || !slug || !location}
              className="flex-1"
              style={{ background: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)" }}
            >
              {isLoading ? "Updating..." : "Update College"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
