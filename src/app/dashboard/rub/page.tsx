"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  GraduationCap,
  MapPin,
  Users,
  BookOpen,
  Search,
  ExternalLink,
  Building,
} from "lucide-react";
import { RUB_COLLEGES, CAREERS_DATABASE } from "@/lib/tenant";
import Link from "next/link";

export default function RUBPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCollege, setSelectedCollege] = useState<string | null>(null);

  // Filter colleges based on search
  const filteredColleges = RUB_COLLEGES.filter((college) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      college.name.toLowerCase().includes(searchLower) ||
      college.location.toLowerCase().includes(searchLower) ||
      college.programs.some((p: any) => p.name.toLowerCase().includes(searchLower))
    );
  });

  // Get recommended programs based on career interests
  const getRecommendedPrograms = (collegePrograms: any[]) => {
    // This would use user's assessment results in production
    const popularPrograms = [
      "B.E. in Computer Science",
      "B.B.A",
      "B.Sc. in Data Science",
      "B.A.",
      "B.Sc. in Agriculture",
    ];
    return collegePrograms.filter((p: any) =>
      popularPrograms.some((pp) => p.name.includes(pp.split(" in ")[1] || pp))
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <GraduationCap className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">
            Royal University of Bhutan Colleges
          </h1>
        </div>
        <p className="text-gray-600">
          Explore degree programs offered by RUB colleges across Bhutan
        </p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search colleges, locations, or programs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* RUB Overview */}
      <Card className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0">
        <CardHeader>
          <CardTitle className="text-2xl">Why Consider RUB Colleges?</CardTitle>
          <CardDescription className="text-orange-100">
            Quality education close to home at affordable costs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <Building className="w-8 h-8 mx-auto mb-2" />
              <div className="text-2xl font-bold">11</div>
              <p className="text-orange-100 text-sm">Constituent Colleges</p>
            </div>
            <div className="text-center">
              <BookOpen className="w-8 h-8 mx-auto mb-2" />
              <div className="text-2xl font-bold">60+</div>
              <p className="text-orange-100 text-sm">Programs Offered</p>
            </div>
            <div className="text-center">
              <Users className="w-8 h-8 mx-auto mb-2" />
              <div className="text-2xl font-bold">10,000+</div>
              <p className="text-orange-100 text-sm">Students Enrolled</p>
            </div>
            <div className="text-center">
              <MapPin className="w-8 h-8 mx-auto mb-2" />
              <div className="text-2xl font-bold">8</div>
              <p className="text-orange-100 text-sm">Dzongkhags</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Colleges Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {filteredColleges.map((college) => (
          <Card key={college.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{college.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1 mt-1">
                    <MapPin className="w-4 h-4" />
                    {college.location}
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                  RUB
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Programs */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Programs Offered ({college.programs.length})
                </h4>
                <div className="space-y-2">
                  {college.programs.slice(0, 4).map((program: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        <div>
                          <p className="font-medium">{program.name}</p>
                          <p className="text-xs text-gray-500">{program.duration} • Min: {program.minMarks}%</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {program.seats} seats
                      </Badge>
                    </div>
                  ))}
                  {college.programs.length > 4 && (
                    <p className="text-xs text-gray-500">
                      +{college.programs.length - 4} more programs
                    </p>
                  )}
                </div>
              </div>

              {/* Career Connections */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Related Careers
                </h4>
                <div className="flex flex-wrap gap-2">
                  {getRelatedCareers(college.programs).map((career) => (
                    <Badge key={career} variant="outline" className="text-xs">
                      {career}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" className="flex-1">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  College Website
                </Button>
                <Button size="sm" className="flex-1" asChild>
                  <Link href="/dashboard/careers">
                    Explore Careers
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Application Guide */}
      <Card className="border-2 border-blue-200">
        <CardHeader>
          <CardTitle>How to Apply to RUB Colleges</CardTitle>
          <CardDescription>
            Step-by-step guide for Class 12 students
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                1
              </div>
              <h4 className="font-medium mb-1">Check Eligibility</h4>
              <p className="text-sm text-gray-600">
                Minimum Class 12 pass with required subjects
              </p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                2
              </div>
              <h4 className="font-medium mb-1">Choose Program</h4>
              <p className="text-sm text-gray-600">
                Select from available programs based on your interests
              </p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                3
              </div>
              <h4 className="font-medium mb-1">Submit Application</h4>
              <p className="text-sm text-gray-600">
                Apply through RUB online portal during admission period
              </p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                4
              </div>
              <h4 className="font-medium mb-1">Await Results</h4>
              <p className="text-sm text-gray-600">
                Merit list published on RUB website
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scholarship Info */}
      <Card className="bg-gradient-to-r from-green-600 to-teal-600 text-white border-0">
        <CardHeader>
          <CardTitle className="text-xl">Scholarship Opportunities</CardTitle>
          <CardDescription className="text-green-100">
            Financial support options for deserving students
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-white rounded-full mt-2" />
              <div>
                <p className="font-medium">Government Scholarships</p>
                <p className="text-green-100 text-sm">
                  Full scholarships for meritorious students based on Class 12 results
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-white rounded-full mt-2" />
              <div>
                <p className="font-medium">Need-Based Financial Aid</p>
                <p className="text-green-100 text-sm">
                  Support for students from economically disadvantaged backgrounds
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-white rounded-full mt-2" />
              <div>
                <p className="font-medium">College-Specific Awards</p>
                <p className="text-green-100 text-sm">
                  Individual colleges offer various scholarships and stipends
                </p>
              </div>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper function to get related careers based on college programs
function getRelatedCareers(programs: string[]): string[] {
  const careerMap: Record<string, string[]> = {
    "Computer Science": ["Software Developer", "Data Analyst", "IT Specialist"],
    "Civil Engineering": ["Civil Engineer", "Architect", "Project Manager"],
    "Electrical Engineering": ["Electrical Engineer", "Power Systems Engineer"],
    "Information Technology": ["Software Developer", "Network Administrator", "IT Support"],
    "Business": ["Business Analyst", "Accountant", "Marketing Manager"],
    "B.B.A": ["Business Analyst", "Entrepreneur", "Manager"],
    "B.Com": ["Accountant", "Financial Analyst", "Tax Consultant"],
    "Education": ["Teacher", "Education Administrator", "Counselor"],
    "Nursing": ["Nurse", "Healthcare Administrator"],
    "Agriculture": ["Agriculturist", "Farm Manager", "Agricultural Scientist"],
    "Forestry": ["Forest Officer", "Environmental Consultant"],
    "Animal Science": ["Veterinarian", "Livestock Manager"],
  };

  const related = new Set<string>();
  programs.forEach((program: any) => {
    const programName = typeof program === 'string' ? program : program.name;
    Object.entries(careerMap).forEach(([key, careers]) => {
      if (programName.toLowerCase().includes(key.toLowerCase())) {
        careers.forEach((c) => related.add(c));
      }
    });
  });

  return Array.from(related).slice(0, 4);
}
