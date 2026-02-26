/**
 * ID CARD PREVIEW COMPONENT
 * Live preview of ID card before PDF generation
 */

"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard } from "lucide-react";
import { generateIDVerificationQR, generateIDBarcode } from "@/lib/id-cards/qr-generator";

interface IDCardPreviewProps {
  data: {
    name: string;
    type: string;
    employeeId?: string;
    rollNumber?: string;
    grade?: string;
    section?: string;
    department?: string;
    designation?: string;
    dateOfBirth?: string;
    bloodGroup?: string;
    photo?: string;
    schoolName: string;
    schoolCode?: string;
    validThru?: string;
  };
  className?: string;
}

export function IDCardPreview({ data, className = "" }: IDCardPreviewProps) {
  const [qrCode, setQrCode] = useState<string>("");
  const [barcode, setBarcode] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generateCodes = async () => {
      setLoading(true);
      try {
        // Generate QR code (mock userId for preview)
        const mockUserId = "preview-user-id";
        const mockSchoolId = "preview-school-id";
        const qr = await generateIDVerificationQR(mockUserId, mockSchoolId);
        setQrCode(qr);

        // Generate barcode
        const idNumber = data.employeeId || data.rollNumber || "PREVIEW";
        const bar = generateIDBarcode(mockUserId, idNumber);
        setBarcode(bar);
      } catch (error) {
        console.error("Failed to generate codes:", error);
      } finally {
        setLoading(false);
      }
    };

    generateCodes();
  }, [data]);

  const getRoleLabel = (type: string) => {
    switch (type) {
      case "student": return "STUDENT";
      case "teacher": return "TEACHER";
      case "school_admin": return "SCHOOL ADMIN";
      case "admin": return "ADMINISTRATOR";
      case "counselor": return "COUNSELOR";
      default: return type.toUpperCase();
    }
  };

  const getRoleColor = (type: string) => {
    switch (type) {
      case "student": return "from-orange-500 to-orange-600";
      case "teacher": return "from-blue-500 to-blue-600";
      case "school_admin": return "from-violet-500 to-violet-600";
      case "admin": return "from-pink-500 to-pink-600";
      case "counselor": return "from-purple-500 to-purple-600";
      default: return "from-gray-500 to-gray-600";
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  const cardWidth = 340; // Approximate pixel width (85.6mm at 96dpi)
  const cardHeight = 216; // Approximate pixel height (53.98mm at 96dpi)
  const scale = 1.5; // Scale up for better visibility

  return (
    <div className={`flex items-center justify-center p-8 ${className}`}>
      {loading ? (
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">Generating preview...</p>
        </div>
      ) : (
        <div
          className="relative bg-white rounded-lg shadow-2xl overflow-hidden border-2 border-gray-200"
          style={{
            width: `${cardWidth * scale}px`,
            height: `${cardHeight * scale}px`,
          }}
        >
          {/* Header Strip */}
          <div
            className={`h-8 bg-gradient-to-r ${getRoleColor(data.type)} flex items-center justify-center`}
          >
            <span className="text-white text-xs font-bold tracking-wider">
              {data.schoolCode || "SCHOOL ID CARD"}
            </span>
          </div>

          {/* School Name */}
          <div className="text-center py-2 bg-gray-50 border-b">
            <h3 className="text-sm font-bold text-gray-800">{data.schoolName}</h3>
          </div>

          {/* Main Content */}
          <div className="flex p-4">
            {/* Photo Section */}
            <div className="w-1/3 pr-3">
              <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200 flex items-center justify-center">
                {data.photo ? (
                  <img
                    src={data.photo}
                    alt={data.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <CreditCard className="w-12 h-12 text-gray-300" />
                )}
              </div>
            </div>

            {/* Details Section */}
            <div className="w-2/3 pl-3 space-y-2">
              {/* Name */}
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wide">Name</p>
                <p className="text-sm font-bold text-gray-900 truncate">
                  {data.name.length > 18 ? data.name.substring(0, 16) + "..." : data.name}
                </p>
              </div>

              {/* Role */}
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wide">Role</p>
                <Badge
                  className={`text-[10px] bg-gradient-to-r ${getRoleColor(data.type)} text-white`}
                >
                  {getRoleLabel(data.type)}
                </Badge>
              </div>

              {/* ID Number */}
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wide">ID Number</p>
                <p className="text-xs font-mono font-semibold text-gray-900">
                  {data.employeeId || data.rollNumber || "PREVIEW-ID"}
                </p>
              </div>

              {/* Grade/Department */}
              {data.type === "student" ? (
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide">Class</p>
                  <p className="text-xs text-gray-800">
                    {data.grade || "N/A"}
                    {data.section && `-${data.section}`}
                  </p>
                </div>
              ) : data.department ? (
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide">Department</p>
                  <p className="text-xs text-gray-800">{data.department}</p>
                </div>
              ) : null}

              {/* Designation (for teachers/staff) */}
              {data.designation && data.type !== "student" && (
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide">Designation</p>
                  <p className="text-xs text-gray-800">{data.designation}</p>
                </div>
              )}

              {/* DOB (for students) */}
              {data.type === "student" && data.dateOfBirth && (
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide">Date of Birth</p>
                  <p className="text-xs text-gray-800">{formatDate(data.dateOfBirth)}</p>
                </div>
              )}

              {/* Blood Group (if available) */}
              {data.bloodGroup && (
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide">Blood Group</p>
                  <p className="text-xs text-gray-800">{data.bloodGroup}</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer with QR and Barcode */}
          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gray-50 border-t flex items-center justify-between">
            {/* Valid Thru */}
            <div className="text-[8px] text-gray-600">
              Valid Thru: {data.validThru || "12/31/2026"}
            </div>

            {/* QR Code */}
            {qrCode && (
              <div className="flex items-center gap-2">
                {barcode && (
                  <img
                    src={barcode}
                    alt="Barcode"
                    className="h-6 object-contain"
                  />
                )}
                <img
                  src={qrCode}
                  alt="QR Code"
                  className="h-8 w-8 object-contain"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
