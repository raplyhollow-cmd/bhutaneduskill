"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Globe,
  DollarSign,
  GraduationCap,
  Clock,
  Check,
  X,
  TrendingUp,
  BookOpen,
  Users,
  Building,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

const COUNTRIES = [
  {
    id: "australia",
    name: "Australia",
    flag: "🇦🇺",
    requirements: {
      ielts: 6.5,
      toefl: 79,
      gpa: "60%+",
      documents: ["Transcript", "IELTS Score", "Passport", "Visa", "Financial Proof", "Health Insurance"],
    },
    education: {
      tuitionRange: "$25,000 - $45,000 AUD/year",
      livingCosts: "$20,000 - $25,000 AUD/year",
      scholarships: "Australia Awards, Endeavour Leadership",
      popularUniversities: ["UNSW Sydney", "University of Melbourne", "ANU", "Monash University"],
      popularCourses: ["IT", "Engineering", "Business", "Health Sciences", "Environmental Science"],
    },
    work: {
      partTimeJobs: "20 hrs/week during semester",
      minWage: "$21.38 AUD/hr",
      postStudyWork: "2-4 years depending on degree",
      jobProspects: "High demand in tech, healthcare, engineering",
    },
    visa: {
      type: "Subclass 500 Student Visa",
      processingTime: "1-4 months",
      successRate: "85%",
      financialRequirement: "$24,505 AUD/year",
    },
    pros: ["High quality education", "Part-time work allowed", "Post-study work visa", "Multicultural"],
    cons: ["High tuition", "Strict visa requirements", "Distance from Bhutan"],
    bhutanCommunity: "Growing - ~500 Bhutanese students",
    overallRating: 4.5,
  },
  {
    id: "new-zealand",
    name: "New Zealand",
    flag: "🇳🇿",
    requirements: {
      ielts: 6.0,
      toefl: 70,
      gpa: "60%+",
      documents: ["Transcript", "IELTS Score", "Passport", "Visa", "Financial Proof", "Medical Certificate"],
    },
    education: {
      tuitionRange: "$20,000 - $35,000 NZD/year",
      livingCosts: "$15,000 - $20,000 NZD/year",
      scholarships: "New Zealand Excellence Awards, Commonwealth Scholarships",
      popularUniversities: ["University of Auckland", "Victoria University of Wellington", "University of Otago"],
      popularCourses: ["IT", "Agriculture", "Hospitality", "Business", "Environmental Studies"],
    },
    work: {
      partTimeJobs: "20 hrs/week during semester",
      minWage: "$22.70 NZD/hr",
      postStudyWork: "1-3 years depending on degree",
      jobProspects: "Good in agriculture, tourism, tech sectors",
    },
    visa: {
      type: "Fee Paying Student Visa",
      processingTime: "1-3 months",
      successRate: "82%",
      financialRequirement: "$20,000 NZD/year",
    },
    pros: ["Lower tuition than Australia", "Friendly policies", "Beautiful scenery", "Growing industries"],
    cons: ["Limited universities", "Smaller job market", "Isolated location"],
    bhutanCommunity: "Established - ~300 Bhutanese students",
    overallRating: 4.3,
  },
  {
    id: "usa",
    name: "United States",
    flag: "🇺🇸",
    requirements: {
      ielts: 6.5,
      toefl: 80,
      sat: 1200,
      gpa: "3.0+ (80%+)",
      documents: ["Transcript", "SAT/ACT", "Essays", "Recommendations", "Financial Proof", "F-1 Visa"],
    },
    education: {
      tuitionRange: "$30,000 - $60,000 USD/year",
      livingCosts: "$15,000 - $25,000 USD/year",
      scholarships: "Fulbright, University Merit Awards, Sports Scholarships",
      popularUniversities: ["MIT", "Stanford", "UC Berkeley", "UCLA", "Georgia Tech"],
      popularCourses: ["Computer Science", "Engineering", "Business", "Liberal Arts", "Media"],
    },
    work: {
      partTimeJobs: "On-campus only (20 hrs/week)",
      minWage: "$7.25-15 USD/hr (varies by state)",
      postStudyWork: "OPT: 1-3 years (STEM: 3 years)",
      jobProspects: "Excellent - highest salaries in world",
    },
    visa: {
      type: "F-1 Student Visa",
      processingTime: "1-3 months",
      successRate: "75%",
      financialRequirement: "$50,000+ USD/year proof required",
    },
    pros: ["World's best universities", "STEM OPT benefits", "High salaries", "Diverse programs"],
    cons: ["Very expensive", "Strict visa process", "Limited on-campus work", "Competitive admissions"],
    bhutanCommunity: "Emerging - ~200 Bhutanese students",
    overallRating: 4.7,
  },
  {
    id: "singapore",
    name: "Singapore",
    flag: "🇸🇬",
    requirements: {
      ielts: 6.5,
      toefl: 80,
      gpa: "70%+",
      documents: ["Transcript", "IELTS Score", "Passport", "Student Pass", "Financial Proof"],
    },
    education: {
      tuitionRange: "$20,000 - $40,000 SGD/year",
      livingCosts: "$12,000 - $18,000 SGD/year",
      scholarships: "Singapore Scholarship, ASEAN Undergraduate Scholarship",
      popularUniversities: ["NUS", "NTU", "SMU", "SUTD"],
      popularCourses: ["Business", "Computer Science", "Engineering", "Design", "Law"],
    },
    work: {
      partTimeJobs: "16 hrs/week during semester",
      minWage: "$14-18 SGD/hr",
      postStudyWork: "Eligible for work pass after graduation",
      jobProspects: "Excellent - Asian business hub",
    },
    visa: {
      type: "Student Pass",
      processingTime: "2-4 weeks",
      successRate: "90%",
      financialRequirement: "$15,000 SGD/year",
    },
    pros: ["Close to Bhutan", "High quality education", "Safe country", "Asian cultural familiar"],
    cons: ["Competitive admissions", "High living costs", "Hot/humid climate", "Stressful environment"],
    bhutanCommunity: "Growing - ~150 Bhutanese students",
    overallRating: 4.6,
  },
  {
    id: "europe",
    name: "Europe (Germany, UK, Netherlands)",
    flag: "🇪🇺",
    requirements: {
      ielts: 6.0,
      toefl: 72,
      gpa: " varies by country",
      documents: ["Transcript", "IELTS", "Passport", "Visa", "Blocked Account", "Health Insurance"],
    },
    education: {
      tuitionRange: "€5,000 - €20,000/year (Germany: Free!) ",
      livingCosts: "€10,000 - €15,000/year",
      scholarships: "Erasmus+, DAAD, Chevening, Commonwealth",
      popularUniversities: ["Oxford", "Cambridge", "TU Munich", "Delft University", "ETH Zurich"],
      popularCourses: ["Engineering", "Business", "Arts", "Sciences", "Design"],
    },
    work: {
      partTimeJobs: "20 hrs/week (varies by country)",
      minWage: "€10-15/hr (varies by country)",
      postStudyWork: "1-2 years (Germany: 18 months job seeker visa)",
      jobProspects: "Good in engineering, tech, automotive sectors",
    },
    visa: {
      type: "Student Visa (varies by country)",
      processingTime: "1-3 months",
      successRate: "70%",
      financialRequirement: "€11,208/year blocked account (Germany)",
    },
    pros: ["Germany has free tuition", "Rich culture", "Travel opportunities", "Work-friendly"],
    cons: ["Language barriers (non-English)", "Complex applications", "Cold weather", "Different systems per country"],
    bhutanCommunity: "Small - ~100 Bhutanese students",
    overallRating: 4.2,
  },
];

export default function StudyAbroadComparePage() {
  const [selectedCountries, setSelectedCountries] = useState<string[]>(["australia", "new-zealand"]);
  const [compareBy, setCompareBy] = useState<"all" | "cost" | "requirements" | "visa">("all");

  const toggleCountry = (countryId: string) => {
    if (selectedCountries.includes(countryId)) {
      if (selectedCountries.length > 1) {
        setSelectedCountries(selectedCountries.filter((c) => c !== countryId));
      }
    } else if (selectedCountries.length < 4) {
      setSelectedCountries([...selectedCountries, countryId]);
    }
  };

  const selectedCountriesData = COUNTRIES.filter((c) => selectedCountries.includes(c.id));

  const getTotalCost = (country: typeof COUNTRIES[0]) => {
    const tuitionLow = parseInt(country.education.tuitionRange.split("-")[0].replace(/[^0-9]/g, ""));
    const tuitionHigh = parseInt(country.education.tuitionRange.split("-")[1].replace(/[^0-9]/g, ""));
    const livingLow = parseInt(country.education.livingCosts.split("-")[0].replace(/[^0-9]/g, ""));
    const livingHigh = parseInt(country.education.livingCosts.split("-")[1].replace(/[^0-9]/g, ""));
    return {
      low: (tuitionLow + livingLow) / 1000,
      high: (tuitionHigh + livingHigh) / 1000,
    };
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/study-abroad">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Compare Study Abroad Options
          </h1>
          <p className="text-gray-600">
            Side-by-side comparison of popular destinations
          </p>
        </div>
      </div>

      {/* Country Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Countries to Compare</CardTitle>
          <CardDescription>Choose 2-4 countries to compare</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {COUNTRIES.map((country) => (
              <button
                key={country.id}
                onClick={() => toggleCountry(country.id)}
                className={`px-4 py-3 rounded-lg border-2 transition-all flex items-center gap-2 ${
                  selectedCountries.includes(country.id)
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <span className="text-2xl">{country.flag}</span>
                <span className="font-medium">{country.name}</span>
                {selectedCountries.includes(country.id) && (
                  <Check className="w-4 h-4 text-blue-600" />
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Comparison Table */}
      {selectedCountriesData.length >= 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Side-by-Side Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Criteria</th>
                    {selectedCountriesData.map((country) => (
                      <th key={country.id} className="text-center py-3 px-4">
                        <div className="text-2xl mb-1">{country.flag}</div>
                        <div className="font-semibold">{country.name}</div>
                        <Badge variant="outline" className="mt-1">
                          ⭐ {country.overallRating}
                        </Badge>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-3 px-4 font-medium">IELTS Required</td>
                    {selectedCountriesData.map((country) => (
                      <td key={country.id} className="text-center py-3 px-4">
                        {country.requirements.ielts}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4 font-medium">Annual Tuition</td>
                    {selectedCountriesData.map((country) => (
                      <td key={country.id} className="text-center py-3 px-4">
                        {country.education.tuitionRange}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4 font-medium">Living Costs</td>
                    {selectedCountriesData.map((country) => (
                      <td key={country.id} className="text-center py-3 px-4">
                        {country.education.livingCosts}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4 font-medium">Total Annual Cost</td>
                    {selectedCountriesData.map((country) => {
                      const cost = getTotalCost(country);
                      return (
                        <td key={country.id} className="text-center py-3 px-4">
                          ${cost.low}k - ${cost.high}k
                        </td>
                      );
                    })}
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4 font-medium">Part-time Work</td>
                    {selectedCountriesData.map((country) => (
                      <td key={country.id} className="text-center py-3 px-4 text-sm">
                        {country.work.partTimeJobs}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4 font-medium">Min Wage/hr</td>
                    {selectedCountriesData.map((country) => (
                      <td key={country.id} className="text-center py-3 px-4">
                        {country.work.minWage}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4 font-medium">Post-Study Work</td>
                    {selectedCountriesData.map((country) => (
                      <td key={country.id} className="text-center py-3 px-4">
                        {country.work.postStudyWork}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 px-4 font-medium">Visa Success Rate</td>
                    {selectedCountriesData.map((country) => (
                      <td key={country.id} className="text-center py-3 px-4">
                        <Badge variant={country.visa.successRate >= "80" ? "default" : "secondary"}>
                          {country.visa.successRate}
                        </Badge>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium">Bhutanese Students</td>
                    {selectedCountriesData.map((country) => (
                      <td key={country.id} className="text-center py-3 px-4 text-sm">
                        {country.bhutanCommunity}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Comparison Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {selectedCountriesData.map((country) => (
          <Card key={country.id} className="border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <span className="text-3xl">{country.flag}</span>
                  {country.name}
                </CardTitle>
                <Badge variant="outline" className="text-base">
                  ⭐ {country.overallRating}/5
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Requirements */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  Requirements
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">IELTS Score:</span>
                    <span className="font-medium">{country.requirements.ielts}+</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Minimum GPA:</span>
                    <span className="font-medium">{country.requirements.gpa}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Documents:</span>
                    <span className="font-medium">{country.requirements.documents.length} items</span>
                  </div>
                </div>
              </div>

              {/* Costs */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Estimated Annual Cost
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tuition:</span>
                    <span className="font-medium">{country.education.tuitionRange}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Living:</span>
                    <span className="font-medium">{country.education.livingCosts}</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-2 border-t">
                    <span className="text-gray-900">Total:</span>
                    <span className="text-blue-600">
                      {(() => {
                        const c = getTotalCost(country);
                        return `$${c.low}k - $${c.high}k`;
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Work & Visa */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    Work
                  </h4>
                  <div className="text-sm space-y-1">
                    <p className="text-gray-600">{country.work.partTimeJobs}</p>
                    <p className="text-gray-600">{country.work.postStudyWork}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Visa
                  </h4>
                  <div className="text-sm space-y-1">
                    <p className="text-gray-600">{country.visa.processingTime} processing</p>
                    <p className="text-gray-600">{country.visa.successRate} success</p>
                  </div>
                </div>
              </div>

              {/* Pros & Cons */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-green-700 mb-2">Pros</h4>
                  <ul className="space-y-1">
                    {country.pros.map((pro, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        {pro}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-red-700 mb-2">Cons</h4>
                  <ul className="space-y-1">
                    {country.cons.map((con, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <X className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                        {con}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Popular Courses */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Popular Courses</h4>
                <div className="flex flex-wrap gap-1">
                  {country.education.popularCourses.map((course) => (
                    <Badge key={course} variant="secondary" className="text-xs">
                      {course}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Recommendation */}
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
        <CardHeader>
          <CardTitle>Which Country Should You Choose?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">🇦🇺 Choose Australia if:</h4>
              <ul className="space-y-1 text-sm text-blue-100">
                <li>• You want high-quality education</li>
                <li>• You're interested in IT, Engineering, or Business</li>
                <li>• You want good post-study work options</li>
                <li>• Budget is not a major constraint</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">🇳🇿 Choose New Zealand if:</h4>
              <ul className="space-y-1 text-sm text-blue-100">
                <li>• You want lower tuition than Australia</li>
                <li>• You're interested in Agriculture, Tourism, or IT</li>
                <li>• You prefer a relaxed lifestyle</li>
                <li>• You want easier visa requirements</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
