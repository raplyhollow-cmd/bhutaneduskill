"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  User,
  FileText,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Upload,
  AlertCircle,
  Clock,
  Mail,
  Phone,
  Globe,
  MapPin,
  Shield,
  Loader2,
  FileCheck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Step = "ministry-info" | "admin-details" | "documents" | "review" | "success";

interface MinistryData {
  name: string;
  level: "national" | "district" | "regional";
  country: string;
  region: string;
  officialDomain: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
}

interface AdminData {
  firstName: string;
  lastName: string;
  position: string;
  department: string;
  officialEmail: string;
  phone: string;
  employeeId: string;
}

interface DocumentData {
  governmentId: File | null;
  appointmentLetter: File | null;
  letterhead: File | null;
}

interface VerificationRequest {
  ministry: MinistryData;
  admin: AdminData;
  documents: DocumentData;
}

const DISTRICTS_OF_BHUTAN = [
  "Thimphu", "Paro", "Punakha", "Wangdue Phodrang", "Tsirang",
  "Dagana", "Sarpang", "Zhemgang", "Trashigang", "Trashiyangtse",
  "Monggar", "Lhuentse", "Samdrup Jongkhar", "Pemagatshel", "Samtse",
  "Chukha", "Haa", "Gasa", "Bumthang", "Trongsa"
];

export default function MinistrySignUpPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>("ministry-info");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [ministryData, setMinistryData] = useState<MinistryData>({
    name: "",
    level: "national",
    country: "Bhutan",
    region: "",
    officialDomain: "",
    address: "",
    city: "",
    postalCode: "",
    phone: "",
  });

  const [adminData, setAdminData] = useState<AdminData>({
    firstName: "",
    lastName: "",
    position: "",
    department: "",
    officialEmail: "",
    phone: "",
    employeeId: "",
  });

  const [documentData, setDocumentData] = useState<DocumentData>({
    governmentId: null,
    appointmentLetter: null,
    letterhead: null,
  });

  const [verificationId, setVerificationId] = useState<string | null>(null);

  const steps = [
    { id: "ministry-info" as Step, title: "Ministry Info", icon: Building2 },
    { id: "admin-details" as Step, title: "Admin Details", icon: User },
    { id: "documents" as Step, title: "Documents", icon: FileText },
    { id: "review" as Step, title: "Review", icon: CheckCircle },
  ];

  const validateMinistryStep = (): boolean => {
    if (!ministryData.name || ministryData.name.length < 3) return false;
    if (!ministryData.level) return false;
    if (!ministryData.country) return false;
    if (ministryData.level !== "national" && !ministryData.region) return false;
    if (!ministryData.officialDomain || !ministryData.officialDomain.includes(".")) return false;
    if (!ministryData.address) return false;
    if (!ministryData.city) return false;
    if (!ministryData.phone) return false;
    return true;
  };

  const validateAdminStep = (): boolean => {
    if (!adminData.firstName || adminData.firstName.length < 2) return false;
    if (!adminData.lastName || adminData.lastName.length < 2) return false;
    if (!adminData.position) return false;
    if (!adminData.department) return false;
    if (!adminData.officialEmail || !adminData.officialEmail.includes("@")) return false;
    if (!adminData.phone) return false;
    if (!adminData.employeeId) return false;
    return true;
  };

  const validateDocumentsStep = (): boolean => {
    return !!(
      documentData.governmentId &&
      documentData.appointmentLetter &&
      documentData.letterhead
    );
  };

  const validateEmailDomain = (): boolean => {
    const domain = adminData.officialEmail.split("@")[1];
    return domain === ministryData.officialDomain ||
           domain.endsWith(`.${ministryData.officialDomain}`);
  };

  const handleFileUpload = (type: keyof DocumentData, file: File | null) => {
    setDocumentData(prev => ({ ...prev, [type]: file }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append("ministryData", JSON.stringify(ministryData));
      formData.append("adminData", JSON.stringify(adminData));

      if (documentData.governmentId) {
        formData.append("governmentId", documentData.governmentId);
      }
      if (documentData.appointmentLetter) {
        formData.append("appointmentLetter", documentData.appointmentLetter);
      }
      if (documentData.letterhead) {
        formData.append("letterhead", documentData.letterhead);
      }

      // Simulate upload progress
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += 10;
        setUploadProgress(progress);
        if (progress >= 90) clearInterval(progressInterval);
      }, 200);

      const response = await fetch("/api/verification/ministry", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit verification request");
      }

      setVerificationId(data.verificationId);
      setCurrentStep("success");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred while submitting your request";
      setError(message);
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  const renderMinistryInfo = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Ministry Information</h3>
        <p className="text-gray-600">Provide details about your government ministry or department.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="ministryName">Ministry Name *</Label>
          <Input
            id="ministryName"
            placeholder="e.g., Ministry of Education and Skills Development"
            value={ministryData.name}
            onChange={(e) => setMinistryData({ ...ministryData, name: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ministryLevel">Level *</Label>
          <Select
            value={ministryData.level}
            onValueChange={(value: "national" | "district" | "regional") => setMinistryData({ ...ministryData, level: value })}
          >
            <SelectTrigger id="ministryLevel">
              <SelectValue placeholder="Select level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="national">National Ministry</SelectItem>
              <SelectItem value="district">District Education Office</SelectItem>
              <SelectItem value="regional">Regional Office</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="country">Country *</Label>
          <Input
            id="country"
            placeholder="Country"
            value={ministryData.country}
            onChange={(e) => setMinistryData({ ...ministryData, country: e.target.value })}
          />
        </div>

        {ministryData.level !== "national" && (
          <div className="space-y-2">
            <Label htmlFor="region">District/Region *</Label>
            <Select
              value={ministryData.region}
              onValueChange={(value) => setMinistryData({ ...ministryData, region: value })}
            >
              <SelectTrigger id="region">
                <SelectValue placeholder="Select district" />
              </SelectTrigger>
              <SelectContent>
                {DISTRICTS_OF_BHUTAN.map((district) => (
                  <SelectItem key={district} value={district}>
                    {district}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="officialDomain">Official Domain *</Label>
          <Input
            id="officialDomain"
            placeholder="e.g., moe.gov.bt"
            value={ministryData.officialDomain}
            onChange={(e) => setMinistryData({ ...ministryData, officialDomain: e.target.value })}
          />
          <p className="text-xs text-gray-500">Your official government domain (without @)</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            placeholder="+975 2 XXX XXX"
            value={ministryData.phone}
            onChange={(e) => setMinistryData({ ...ministryData, phone: e.target.value })}
          />
        </div>

        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="address">Address *</Label>
          <Input
            id="address"
            placeholder="Official ministry address"
            value={ministryData.address}
            onChange={(e) => setMinistryData({ ...ministryData, address: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            placeholder="City"
            value={ministryData.city}
            onChange={(e) => setMinistryData({ ...ministryData, city: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="postalCode">Postal Code</Label>
          <Input
            id="postalCode"
            placeholder="Postal code"
            value={ministryData.postalCode}
            onChange={(e) => setMinistryData({ ...ministryData, postalCode: e.target.value })}
          />
        </div>
      </div>
    </div>
  );

  const renderAdminDetails = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Administrator Details</h3>
        <p className="text-gray-600">Information for the primary ministry administrator account.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            placeholder="First name"
            value={adminData.firstName}
            onChange={(e) => setAdminData({ ...adminData, firstName: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            placeholder="Last name"
            value={adminData.lastName}
            onChange={(e) => setAdminData({ ...adminData, lastName: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="position">Position/Title *</Label>
          <Input
            id="position"
            placeholder="e.g., Director, Secretary"
            value={adminData.position}
            onChange={(e) => setAdminData({ ...adminData, position: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="department">Department *</Label>
          <Input
            id="department"
            placeholder="e.g., Higher Education Division"
            value={adminData.department}
            onChange={(e) => setAdminData({ ...adminData, department: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="officialEmail">Official Email *</Label>
          <Input
            id="officialEmail"
            type="email"
            placeholder={`name@${ministryData.officialDomain || "government.gov.bt"}`}
            value={adminData.officialEmail}
            onChange={(e) => setAdminData({ ...adminData, officialEmail: e.target.value })}
          />
          {!validateEmailDomain() && adminData.officialEmail.includes("@") && (
            <p className="text-xs text-orange-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Email should match your official domain ({ministryData.officialDomain})
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="adminPhone">Phone Number *</Label>
          <Input
            id="adminPhone"
            placeholder="+975 XX XX XX XX"
            value={adminData.phone}
            onChange={(e) => setAdminData({ ...adminData, phone: e.target.value })}
          />
        </div>

        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="employeeId">Government Employee ID *</Label>
          <Input
            id="employeeId"
            placeholder="Your government issued employee ID"
            value={adminData.employeeId}
            onChange={(e) => setAdminData({ ...adminData, employeeId: e.target.value })}
          />
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
        <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-900">Security Notice</p>
          <p className="text-xs text-blue-700 mt-1">
            Your email domain will be verified against the official ministry domain.
            Please ensure you use your official government email address.
          </p>
        </div>
      </div>
    </div>
  );

  const renderDocuments = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Document Upload</h3>
        <p className="text-gray-600">Upload required verification documents. Accepted formats: PDF, JPG, PNG (Max 5MB each).</p>
      </div>

      <div className="space-y-6">
        <div className="border border-gray-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
              <FileCheck className="w-5 h-5 text-orange-600" />
            </div>
            <div className="flex-1">
              <Label className="text-base font-medium">Government ID Card *</Label>
              <p className="text-sm text-gray-500 mt-1">Upload a valid government-issued ID (Citizen ID, Passport, etc.)</p>
              <div className="mt-4">
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <Upload className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-700">
                    {documentData.governmentId ? documentData.governmentId.name : "Choose file"}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload("governmentId", e.target.files?.[0] || null)}
                  />
                </label>
                {documentData.governmentId && (
                  <div className="mt-2 inline-flex items-center gap-1 text-sm text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    File uploaded successfully
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <Label className="text-base font-medium">Appointment Letter *</Label>
              <p className="text-sm text-gray-500 mt-1">Official letter of appointment or authorization from the ministry</p>
              <div className="mt-4">
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <Upload className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-700">
                    {documentData.appointmentLetter ? documentData.appointmentLetter.name : "Choose file"}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload("appointmentLetter", e.target.files?.[0] || null)}
                  />
                </label>
                {documentData.appointmentLetter && (
                  <div className="mt-2 inline-flex items-center gap-1 text-sm text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    File uploaded successfully
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <Label className="text-base font-medium">Official Letterhead *</Label>
              <p className="text-sm text-gray-500 mt-1">A document on official ministry letterhead confirming this request</p>
              <div className="mt-4">
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <Upload className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-700">
                    {documentData.letterhead ? documentData.letterhead.name : "Choose file"}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload("letterhead", e.target.files?.[0] || null)}
                  />
                </label>
                {documentData.letterhead && (
                  <div className="mt-2 inline-flex items-center gap-1 text-sm text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    File uploaded successfully
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-yellow-900">Document Privacy</p>
          <p className="text-xs text-yellow-700 mt-1">
            All uploaded documents are encrypted and stored securely. They will only be shared with authorized platform administrators for verification purposes.
          </p>
        </div>
      </div>
    </div>
  );

  const renderReview = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Review & Submit</h3>
        <p className="text-gray-600">Please review all information before submitting your verification request.</p>
      </div>

      <div className="space-y-6">
        {/* Ministry Information */}
        <div className="border border-gray-200 rounded-lg p-6">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-orange-600" />
            Ministry Information
          </h4>
          <dl className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-gray-500">Ministry Name</dt>
              <dd className="font-medium text-gray-900">{ministryData.name}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Level</dt>
              <dd className="font-medium text-gray-900 capitalize">{ministryData.level}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Country</dt>
              <dd className="font-medium text-gray-900">{ministryData.country}</dd>
            </div>
            {ministryData.region && (
              <div>
                <dt className="text-gray-500">District/Region</dt>
                <dd className="font-medium text-gray-900">{ministryData.region}</dd>
              </div>
            )}
            <div>
              <dt className="text-gray-500">Official Domain</dt>
              <dd className="font-medium text-gray-900">{ministryData.officialDomain}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Phone</dt>
              <dd className="font-medium text-gray-900">{ministryData.phone}</dd>
            </div>
            <div className="md:col-span-2">
              <dt className="text-gray-500">Address</dt>
              <dd className="font-medium text-gray-900">{ministryData.address}, {ministryData.city} {ministryData.postalCode}</dd>
            </div>
          </dl>
        </div>

        {/* Administrator Details */}
        <div className="border border-gray-200 rounded-lg p-6">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Administrator Details
          </h4>
          <dl className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-gray-500">Name</dt>
              <dd className="font-medium text-gray-900">{adminData.firstName} {adminData.lastName}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Position</dt>
              <dd className="font-medium text-gray-900">{adminData.position}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Department</dt>
              <dd className="font-medium text-gray-900">{adminData.department}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Employee ID</dt>
              <dd className="font-medium text-gray-900">{adminData.employeeId}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Official Email</dt>
              <dd className="font-medium text-gray-900">{adminData.officialEmail}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Phone</dt>
              <dd className="font-medium text-gray-900">{adminData.phone}</dd>
            </div>
          </dl>
        </div>

        {/* Documents */}
        <div className="border border-gray-200 rounded-lg p-6">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            Documents
          </h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2 text-gray-700">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Government ID: {documentData.governmentId?.name || "Not uploaded"}
            </li>
            <li className="flex items-center gap-2 text-gray-700">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Appointment Letter: {documentData.appointmentLetter?.name || "Not uploaded"}
            </li>
            <li className="flex items-center gap-2 text-gray-700">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Official Letterhead: {documentData.letterhead?.name || "Not uploaded"}
            </li>
          </ul>
        </div>

        {/* Verification Notice */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex gap-3">
          <Clock className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-orange-900">Verification Process</p>
            <p className="text-xs text-orange-700 mt-1">
              Ministry signups require manual verification. Once submitted, our team will review your application within 3-5 business days.
              You will receive an email confirmation with your verification ID.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="text-center py-8">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="w-10 h-10 text-green-600" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-2">Verification Request Submitted</h3>
      <p className="text-gray-600 mb-6">
        Your ministry verification request has been submitted successfully.
        Our team will review your application within 3-5 business days.
      </p>

      {verificationId && (
        <div className="bg-gray-50 rounded-lg p-4 max-w-md mx-auto mb-6">
          <p className="text-sm text-gray-500 mb-1">Your Verification ID</p>
          <p className="text-xl font-mono font-bold text-gray-900">{verificationId}</p>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto mb-8">
        <div className="flex items-start gap-3">
          <Mail className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-left">
            <p className="text-sm font-medium text-blue-900">Next Steps</p>
            <ul className="text-xs text-blue-700 mt-1 space-y-1">
              <li>Check your email for confirmation</li>
              <li>Save your verification ID for reference</li>
              <li>We'll contact you if additional documents are needed</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button variant="outline" asChild>
          <Link href="/sign-up">Back to Sign Up</Link>
        </Button>
        <Button asChild>
          <Link href="/">Go to Homepage</Link>
        </Button>
      </div>
    </div>
  );

  const canProceed = () => {
    switch (currentStep) {
      case "ministry-info":
        return validateMinistryStep();
      case "admin-details":
        return validateAdminStep();
      case "documents":
        return validateDocumentsStep();
      default:
        return true;
    }
  };

  const getCurrentStepIndex = () => {
    return steps.findIndex(s => s.id === currentStep);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50 via-white to-orange-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 py-12 px-4">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(249,115,22,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(249,115,22,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

      <div className="w-full max-w-3xl relative z-10">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/20">
              <span className="text-white font-bold">BE</span>
            </div>
            <span className="font-bold text-2xl text-gray-900 dark:text-white">Bhutan EduSkill</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Ministry of Education Sign Up</h1>
          <p className="text-gray-600 dark:text-gray-400">Government portal registration for education authorities</p>
        </div>

        {/* Stepper */}
        {currentStep !== "success" && (
          <div className="mb-8">
            <div className="flex items-center justify-between relative">
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 -z-10" />
              {steps.map((step, index) => {
                const isCompleted = index < getCurrentStepIndex();
                const isCurrent = index === getCurrentStepIndex();
                return (
                  <div key={step.id} className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                      isCompleted ? "bg-green-500 text-white" :
                      isCurrent ? "bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-lg" :
                      "bg-gray-200 text-gray-500"
                    }`}>
                      {isCompleted ? <CheckCircle className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
                    </div>
                    <span className={`text-xs mt-2 hidden sm:block ${
                      isCurrent ? "text-orange-600 font-medium" : "text-gray-500"
                    }`}>
                      {step.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Form Card */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          {currentStep !== "success" && (
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {steps[getCurrentStepIndex()]?.title}
                </h2>
                <span className="text-sm text-gray-500">
                  Step {getCurrentStepIndex() + 1} of {steps.length}
                </span>
              </div>
            </div>
          )}

          <div className="p-8">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-900">Submission Error</p>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {isSubmitting && currentStep === "review" && (
              <div className="mb-6">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <Loader2 className="w-5 h-5 text-orange-600 animate-spin" />
                  <span className="text-sm text-gray-700">Submitting your application...</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-orange-500 to-red-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {currentStep === "ministry-info" && renderMinistryInfo()}
            {currentStep === "admin-details" && renderAdminDetails()}
            {currentStep === "documents" && renderDocuments()}
            {currentStep === "review" && !isSubmitting && renderReview()}
            {currentStep === "success" && renderSuccess()}
          </div>

          {/* Navigation Buttons */}
          {currentStep !== "success" && (
            <div className="p-6 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  const prevIndex = getCurrentStepIndex() - 1;
                  if (prevIndex >= 0) setCurrentStep(steps[prevIndex].id);
                  else router.push("/sign-up");
                }}
                disabled={isSubmitting}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {getCurrentStepIndex() === 0 ? "Back" : "Previous"}
              </Button>

              <Button
                onClick={() => {
                  const nextIndex = getCurrentStepIndex() + 1;
                  if (nextIndex < steps.length) {
                    setCurrentStep(steps[nextIndex].id);
                  } else {
                    handleSubmit();
                  }
                }}
                disabled={!canProceed() || isSubmitting}
                style={{
                  background: canProceed() && !isSubmitting
                    ? "linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)"
                    : undefined
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : nextStepTitle()}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </div>

        {/* Sign In Link */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          Already have a government account?{" "}
          <Link href="/sign-in" className="text-orange-600 dark:text-orange-400 hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );

  function nextStepTitle() {
    switch (currentStep) {
      case "ministry-info":
        return "Continue";
      case "admin-details":
        return "Continue";
      case "documents":
        return "Review";
      case "review":
        return "Submit Application";
      default:
        return "Continue";
    }
  }
}
