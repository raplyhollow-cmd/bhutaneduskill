"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { STUDY_ABROAD_REQUIREMENTS, RUB_COLLEGES } from "@/lib/tenant";
import {
  GraduationCap,
  Globe,
  DollarSign,
  Languages,
  Home,
  ArrowLeft,
  Check,
  Info,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function StudyAbroadComparePage() {
  const router = useRouter();

  // Get available countries from STUDY_ABROAD_REQUIREMENTS
  const countryOptions = Object.entries(STUDY_ABROAD_REQUIREMENTS).map(([key, data]: [string, any]) => ({
    id: key,
    name: data.name,
    requirements: data.requirements,
    ielts: data.ielts,
    avgTuition: data.avgTuition,
    popularCourses: data.popularCourses,
  }));

  // Default selections
  const [selectedCountries, setSelectedCountries] = useState<string[]>([
    "australia",
    "singapore",
  ]);

  const toggleCountry = (countryId: string) => {
    if (selectedCountries.includes(countryId)) {
      if (selectedCountries.length > 1) {
        setSelectedCountries(selectedCountries.filter((id) => id !== countryId));
      }
    } else if (selectedCountries.length < 3) {
      setSelectedCountries([...selectedCountries, countryId]);
    }
  };

  const selectedData = countryOptions.filter((c) =>
    selectedCountries.includes(c.id)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/student/study-abroad")}
            className="mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Study Abroad
          </Button>
          <h1 className="text-3xl font-bold">Compare Study Destinations</h1>
          <p className="text-gray-600 mt-1">
            Compare requirements, costs, and opportunities across different countries
          </p>
        </div>
      </div>

      {/* Country Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Countries to Compare</CardTitle>
          <CardDescription>
            Choose up to 3 countries to compare side by side
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {countryOptions.map((country) => (
              <Button
                key={country.id}
                variant={selectedCountries.includes(country.id) ? "default" : "outline"}
                onClick={() => toggleCountry(country.id)}
                className="min-w-[120px]"
              >
                <Globe className="w-4 h-4 mr-2" />
                {country.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Comparison Table */}
      {selectedData.length >= 1 && (
        <div className="overflow-x-auto">
          <Card>
            <CardContent className="p-0">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="p-4 text-left font-semibold text-gray-700 min-w-[150px]">
                      Feature
                    </th>
                    {selectedData.map((country) => (
                      <th
                        key={country.id}
                        className="p-4 text-center font-semibold min-w-[200px]"
                      >
                        {country.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* IELTS Requirement */}
                  <tr className="border-b">
                    <td className="p-4 font-medium flex items-center gap-2">
                      <Languages className="w-4 h-4 text-purple-600" />
                      IELTS Score
                    </td>
                    {selectedData.map((country) => (
                      <td key={country.id} className="p-4 text-center">
                        <span className="font-semibold">
                          {country.ielts ? `${country.ielts}+` : "N/A"}
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* Tuition */}
                  <tr className="border-b">
                    <td className="p-4 font-medium flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-yellow-600" />
                      Annual Tuition
                    </td>
                    {selectedData.map((country) => (
                      <td key={country.id} className="p-4 text-center">
                        <span className="text-sm">{country.avgTuition}</span>
                      </td>
                    ))}
                  </tr>

                  {/* Popular Courses */}
                  <tr>
                    <td className="p-4 font-medium flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-green-600" />
                      Popular Courses
                    </td>
                    {selectedData.map((country) => (
                      <td key={country.id} className="p-4 text-center">
                        <div className="flex flex-wrap justify-center gap-1">
                          {country.popularCourses.slice(0, 3).map((course, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {course}
                            </Badge>
                          ))}
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {selectedData.map((country) => (
          <Card key={country.id}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Globe className="w-6 h-6 text-blue-600" />
                <CardTitle>{country.name}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm text-gray-600 mb-1">IELTS</h4>
                <p className="text-sm">
                  {country.ielts ? `${country.ielts}+ required` : "Check specific requirements"}
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-sm text-gray-600 mb-1">Annual Tuition</h4>
                <p className="text-sm">{country.avgTuition}</p>
              </div>

              <div>
                <h4 className="font-semibold text-sm text-gray-600 mb-1">Requirements</h4>
                <ul className="text-sm space-y-1">
                  {country.requirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <Check className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push("/student/scholarships")}
              >
                View Scholarships
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Help Section */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <CardTitle className="text-lg">Need Help Deciding?</CardTitle>
              <CardDescription>
                Consult with our counselors to find the best study abroad option for you
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button className="flex-1" asChild>
              <Link href="/student/counselor">Book Counseling Session</Link>
            </Button>
            <Button variant="outline" className="flex-1" asChild>
              <Link href="/student/rub">
                <GraduationCap className="w-4 h-4 mr-2" />
                Compare RUB Programs
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
