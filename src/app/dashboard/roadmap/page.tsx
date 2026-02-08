"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Map,
  Target,
  GraduationCap,
  BookOpen,
  Award,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Calendar,
  Clock,
  DollarSign,
} from "lucide-react";
import Link from "next/link";

const CAREER_ROADMAPS = {
  "software-developer": {
    name: "Software Developer",
    timeline: "6-8 years",
    stages: [
      {
        title: "Class 6-10: Build Foundation",
        duration: "4 years",
        icon: "🎯",
        color: "bg-blue-100 text-blue-700",
        tasks: [
          "Focus on Mathematics and Science",
          "Learn basic computer skills",
          "Start with Scratch or Code.org",
          "Participate in math/science competitions",
          "Explore YouTube tutorials on programming",
        ],
      },
      {
        title: "Class 11-12: Start Programming",
        duration: "2 years",
        icon: "💻",
        color: "bg-purple-100 text-purple-700",
        tasks: [
          "Take Computer Science as optional subject",
          "Learn Python or JavaScript online",
          "Build small projects (games, websites)",
          "Join coding clubs or competitions",
          "Prepare for Class 12 exams",
          "Take RIASEC assessment on Career Compass",
        ],
      },
      {
        title: "College: B.E./B.Tech/B.Sc. Computer Science",
        duration: "4 years",
        icon: "🎓",
        color: "bg-green-100 text-green-700",
        tasks: [
          "Join RUB (College of Science and Technology) or study abroad",
          "Learn: Data Structures, Algorithms, Databases, Web Development",
          "Build portfolio projects on GitHub",
          "Do internships during breaks",
          "Participate in hackathons",
          "Network with professionals",
        ],
      },
      {
        title: "Entry Level: Junior Developer",
        duration: "2 years",
        icon: "💼",
        color: "bg-orange-100 text-orange-700",
        tasks: [
          "Apply to tech companies or startups",
          "Master common frameworks (React, Node.js, Django)",
          "Contribute to open source projects",
          "Continue learning through online courses",
          "Build professional network",
        ],
      },
      {
        title: "Career Growth: Senior Developer",
        duration: "Ongoing",
        icon: "🚀",
        color: "bg-red-100 text-red-700",
        tasks: [
          "Specialize in a domain (frontend, backend, DevOps, AI/ML)",
          "Take on leadership roles",
          "Mentor junior developers",
          "Consider higher studies (M.Tech/MBA)",
          "Start tech startup (optional)",
        ],
      },
    ],
    salary: "Nu. 40,000 - 150,000+ annually",
    skills: ["Problem Solving", "Logic", "Mathematics", "Attention to Detail"],
  },
  "doctor": {
    name: "Doctor (Physician)",
    timeline: "11-15 years",
    stages: [
      {
        title: "Class 6-10: Build Science Foundation",
        duration: "4 years",
        icon: "🎯",
        color: "bg-blue-100 text-blue-700",
        tasks: [
          "Excel in Biology, Chemistry, Physics",
          "Develop strong study habits",
          "Participate in science Olympiads",
          "Read about medical discoveries",
          "Volunteer at hospitals (if possible)",
        ],
      },
      {
        title: "Class 11-12: Science Stream",
        duration: "2 years",
        icon: "🔬",
        color: "bg-purple-100 text-purple-700",
        tasks: [
          "Choose Physics, Chemistry, Biology (PCB)",
          "Maintain minimum 75% aggregate",
          "Prepare for medical entrance exams",
          "Take RIASEC assessment (Investative/Social types fit well)",
          "Develop communication skills",
        ],
      },
      {
        title: "MBBS: Medical School",
        duration: "5 years",
        icon: "🎓",
        color: "bg-green-100 text-green-700",
        tasks: [
          "Apply to medical schools (Kathmandu University, etc.)",
          "Study anatomy, physiology, pharmacology, pathology",
          "Complete clinical rotations",
          "Pass university exams",
          "Build patient care skills",
        ],
      },
      {
        title: "Internship: House Staffship",
        duration: "1 year",
        icon: "🏥",
        color: "bg-orange-100 text-orange-700",
        tasks: [
          "Work under senior doctors",
          "Gain hands-on patient experience",
          "Choose specialization",
          "Prepare for licensing exams",
        ],
      },
      {
        title: "Specialization (MD/MS)",
        duration: "3-6 years",
        icon: "👨‍⚕️",
        color: "bg-red-100 text-red-700",
        tasks: [
          "Choose specialization (Cardiology, Neurology, Pediatrics, etc.)",
          "Postgraduate training",
          "Research opportunities",
          "Establish private practice or join hospital",
        ],
      },
    ],
    salary: "Nu. 150,000 - 500,000+ annually",
    skills: ["Science", "Empathy", "Attention to Detail", "Communication"],
  },
  "teacher": {
    name: "Teacher",
    timeline: "5-7 years",
    stages: [
      {
        title: "Class 6-10: Explore Interest",
        duration: "4 years",
        icon: "🎯",
        color: "bg-blue-100 text-blue-700",
        tasks: [
          "Maintain good academic record",
          "Help classmates with studies",
          "Participate in teaching activities",
          "Read about teaching methods",
          "Develop patience and empathy",
        ],
      },
      {
        title: "Class 11-12: Choose Stream",
        duration: "2 years",
        icon: "📚",
        color: "bg-purple-100 text-purple-700",
        tasks: [
          "Select subjects based on teaching interest (English, Dzongkha, Math, etc.)",
          "Maintain high grades (70%+)",
          "Participate in school clubs/activities",
          "Take RIASEC assessment (Social/Artistic types fit well)",
          "Practice public speaking",
        ],
      },
      {
        title: "College: B.Ed/B.A./B.Sc.",
        duration: "3 years",
        icon: "🎓",
        color: "bg-green-100 text-green-700",
        tasks: [
          "Join Paro College of Education or RUB Education programs",
          "Learn teaching methodologies",
          "Practice teaching during college",
          "Develop subject expertise",
          "Learn about child psychology",
        ],
      },
      {
        title: "Entry Level: Teacher",
        duration: "2 years",
        icon: "🏫",
        color: "bg-orange-100 text-orange-700",
        tasks: [
          "Apply to schools through RCSC",
          "Prepare lesson plans",
          "Complete teacher licensing process",
          "Pursue professional development",
          "Consider M.A./M.Ed. for advancement",
        ],
      },
      {
        title: "Career Growth",
        duration: "Ongoing",
        icon: "📈",
        color: "bg-red-100 text-red-700",
        tasks: [
          "Pursue higher education (M.A./M.Ed./PhD)",
          "Become principal or administrator",
          "Join Ministry of Education",
          "Teach at college level",
          "Write textbooks/curriculum",
        ],
      },
    ],
    salary: "Nu. 25,000 - 80,000+ annually",
    skills: ["Communication", "Patience", "Subject Knowledge", "Leadership"],
  },
  "data-analyst": {
    name: "Data Analyst",
    timeline: "5-7 years",
    stages: [
      {
        title: "Class 6-10: Math Foundation",
        duration: "4 years",
        icon: "🎯",
        color: "bg-blue-100 text-blue-700",
        tasks: [
          "Excel in Mathematics",
          "Learn basic statistics",
          "Work with spreadsheets",
          "Develop logical thinking",
          "Participate in math competitions",
        ],
      },
      {
        title: "Class 11-12: Choose Science/Commerce",
        duration: "2 years",
        icon: "📊",
        color: "bg-purple-100 text-purple-700",
        tasks: [
          "Take Mathematics as main subject",
          "Learn statistics (if available)",
          "Study Computer Science basics",
          "Practice with Excel/Google Sheets",
          "Maintain good grades",
        ],
      },
      {
        title: "College: B.Sc. Statistics/B.Com./BCA",
        duration: "3 years",
        icon: "🎓",
        color: "bg-green-100 text-green-700",
        tasks: [
          "Study statistics, data science, or related field",
          "Learn SQL, Python/R for data analysis",
          "Work on real datasets",
          "Complete internships",
          "Build portfolio of analysis projects",
        ],
      },
      {
        title: "Entry Level: Junior Data Analyst",
        duration: "2 years",
        icon: "📈",
        color: "bg-orange-100 text-orange-700",
        tasks: [
          "Apply to companies requiring data analysis",
          "Master Excel, SQL, Tableau/Power BI",
          "Learn statistical methods",
          "Take online certifications",
          "Build domain knowledge",
        ],
      },
      {
        title: "Career Growth: Senior Data Analyst",
        duration: "Ongoing",
        icon: "💼",
        color: "bg-red-100 text-red-700",
        tasks: [
          "Specialize in business intelligence or data science",
          "Learn machine learning basics",
          "Consider M.Sc. in Data Science",
          "Move to Data Scientist role (optional)",
        ],
      },
    ],
    salary: "Nu. 50,000 - 150,000+ annually",
    skills: ["Mathematics", "Analytical Thinking", "SQL", "Statistics"],
  },
};

export default function RoadmapPage() {
  const [selectedCareer, setSelectedCareer] = useState<string | null>(null);

  const roadmap = selectedCareer ? CAREER_ROADMAPS[selectedCareer as keyof typeof CAREER_ROADMAPS] : null;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Map className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">
            Career Roadmap Generator
          </h1>
        </div>
        <p className="text-gray-600">
          Visual step-by-step guide to your dream career
        </p>
      </div>

      {!selectedCareer ? (
        <>
          {/* Select Career */}
          <Card>
            <CardHeader>
              <CardTitle>Choose Your Target Career</CardTitle>
              <CardDescription>
                Select a career to see the complete roadmap
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {Object.entries(CAREER_ROADMAPS).map(([key, career]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedCareer(key)}
                    className="p-6 border-2 rounded-lg text-left hover:border-blue-500 hover:bg-blue-50 transition-all"
                  >
                    <h3 className="font-semibold text-lg text-gray-900 mb-2">
                      {career.name}
                    </h3>
                    <p className="text-sm text-gray-600">{career.timeline}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-1 text-sm">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        {career.salary}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {career.skills.slice(0, 3).map((skill) => (
                          <Badge key={skill} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Info */}
          <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
            <CardHeader>
              <CardTitle>How to Use This Roadmap</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-blue-100">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 mt-0.5" />
                  <span>Select your target career to see the complete journey</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 mt-0.5" />
                  <span>Follow the steps from Class 6 to your career goal</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 mt-0.5" />
                  <span>Track your progress on Skills and Journal pages</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 mt-0.5" />
                  <span>Adjust the plan based on your changing interests</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          {/* Roadmap Display */}
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => setSelectedCareer(null)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Careers
            </Button>
            <Button asChild>
              <Link href="/dashboard/assessment">
                Take Assessment First
              </Link>
            </Button>
          </div>

          <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
            <CardHeader>
              <CardTitle className="text-2xl">{roadmap.name} Roadmap</CardTitle>
              <CardDescription className="text-blue-100">
                Complete journey from Class 6 to your dream career • {roadmap.timeline}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span>{roadmap.timeline} journey</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  <span>{roadmap.salary} potential</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  <span>Requires: {roadmap.skills.join(", ")}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Roadmap Stages */}
          <div className="space-y-6">
            {roadmap.stages.map((stage, index) => (
              <Card key={index} className="border-2 border-gray-200">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${stage.color}`}>
                      {stage.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <CardTitle className="text-xl">{stage.title}</CardTitle>
                        <Badge variant="outline">{stage.duration}</Badge>
                      </div>
                      <CardDescription>{stage.icon === "💻" ? "Continue learning..." : stage.icon === "🎓" ? "After Class 12..." : "Preparation phase..."}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {stage.tasks.map((task, taskIndex) => (
                      <li key={taskIndex} className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <CheckCircle2 className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="text-gray-700">{task}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Stage-specific actions */}
                  {stage.icon === "💻" && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm font-semibold text-blue-900 mb-3">
                        <BookOpen className="w-4 h-4 inline mr-2" />
                        Recommended Resources:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" asChild>
                          <Link href="/dashboard/skills">
                            Free Coding Courses
                          </Link>
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <a href="https://freecodecamp.org" target="_blank" rel="noopener noreferrer">
                          freeCodeCamp
                        </a>
                        </Button>
                      </div>
                    </div>
                  )}

                  {stage.icon === "🔬" && (
                    <div className="mt-6 p-4 bg-green-50 rounded-lg">
                      <p className="text-sm font-semibold text-green-900 mb-3">
                        <GraduationCap className="w-4 h-4 inline mr-2" />
                        Medical Entrance Preparation:
                      </p>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>• Focus on Biology, Chemistry, Physics</li>
                        <li>• Practice previous years' questions</li>
                        <li>• Join coaching if available</li>
                        <li>• Take mock tests regularly</li>
                      </ul>
                    </div>
                  )}

                  {stage.icon === "🎓" && (
                    <div className="mt-6 p-4 bg-purple-50 rounded-lg">
                      <p className="text-sm font-semibold text-purple-900 mb-3">
                        <Award className="w-4 h-4 inline mr-2" />
                        Scholarship Opportunities:
                      </p>
                      <Button size="sm" variant="outline" asChild>
                        <Link href="/dashboard/scholarships">
                          View Scholarships
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* CTA */}
          <Card className="border-2 border-blue-200">
            <CardHeader>
              <CardTitle>Ready to Start Your Journey?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <Button className="justify-start" asChild>
                  <Link href="/dashboard/assessment">
                    <Target className="w-4 h-4 mr-2" />
                    Take Assessment
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start" asChild>
                  <Link href="/dashboard/journal">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Start Journaling
                  </Link>
                </Button>
                <Button variant="outline" className="justify-start" asChild>
                  <Link href="/dashboard/saved">
                    <Bookmark className="w-4 h-4 mr-2" />
                    Save This Roadmap
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
