"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createCollege } from "@/app/admin/content/actions";

interface AddCollegeModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddCollegeModal({ open, onClose, onSuccess }: AddCollegeModalProps) {
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
    setIsLoading(true);

    try {
      // Map form data to match createCollege function expectations
      const payload = {
        name,
        code: slug, // Map slug to code for compatibility
        type: (type === "public" ? "constituent" : "affiliated") as "constituent" | "affiliated", // Map type values
        dzongkhag,
        location,
        website,
      };

      await createCollege(payload);

      onSuccess();
      onClose();

      // Reset form
      setName("");
      setSlug("");
      setLocation("");
      setWebsite("");
      setType("public");
      setDzongkhag("");
      setIsBhutanCollege(true);
      setBhutanCollegeType("private");
      setAcceptanceRate("");
      setAvgSAT("");
      setAvgACT("");
      setRequiredGPA("");
    } catch (error) {
      console.error("[ADD COLLEGE] Error:", error);
      alert(error instanceof Error ? error.message : "Failed to create college. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Add New College</h2>
          <p className="text-sm text-gray-600 mt-1">Add a college to the database</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">College Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g., Royal Thimphu College"
                required
              />
            </div>

            <div>
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g., royal-thimphu-college"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Thimphu"
                required
              />
            </div>

            <div>
              <Label htmlFor="dzongkhag">Dzongkhag</Label>
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
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="e.g., https://www.rub.edu.bt"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">College Type *</Label>
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
                id="isBhutanCollege"
                checked={isBhutanCollege}
                onChange={(e) => setIsBhutanCollege(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
              />
              <Label htmlFor="isBhutanCollege" className="cursor-pointer">
                Bhutan College
              </Label>
            </div>
          </div>

          {isBhutanCollege && (
            <div>
              <Label htmlFor="bhutanCollegeType">Bhutan College Type</Label>
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
              <Label htmlFor="acceptanceRate">Acceptance Rate (%)</Label>
              <Input
                id="acceptanceRate"
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
              <Label htmlFor="avgSAT">Avg SAT Score</Label>
              <Input
                id="avgSAT"
                type="number"
                min="400"
                max="1600"
                value={avgSAT}
                onChange={(e) => setAvgSAT(e.target.value)}
                placeholder="e.g., 1200"
              />
            </div>

            <div>
              <Label htmlFor="avgACT">Avg ACT Score</Label>
              <Input
                id="avgACT"
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
            <Label htmlFor="requiredGPA">Required GPA</Label>
            <Input
              id="requiredGPA"
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
              {isLoading ? "Creating..." : "Create College"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
