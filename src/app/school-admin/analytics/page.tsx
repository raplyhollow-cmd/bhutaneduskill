/**
 * SCHOOL ADMIN - ANALYTICS
 */
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Users, BookOpen, DollarSign, Award, AlertCircle, Calendar, ArrowUp, ArrowDown, Download } from "lucide-react";

export default function SchoolAdminAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">School Analytics</h1>
          <p className="text-gray-600">Comprehensive insights and metrics</p>
        </div>
        <Button variant="outline"><Download className="w-4 h-4 mr-2" />Export Report</Button>
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Total Students</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">487</div><p className="text-xs text-green-600 flex items-center mt-1"><ArrowUp className="w-3 h-3 mr-1" />+12% from last year</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Avg Attendance</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">89%</div><p className="text-xs text-green-600 flex items-center mt-1"><ArrowUp className="w-3 h-3 mr-1" />+3% from last month</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Avg Score</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">72%</div><p className="text-xs text-green-600 flex items-center mt-1"><ArrowUp className="w-3 h-3 mr-1" />+5% from last exam</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">Fee Collection</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">85%</div><p className="text-xs text-green-600 flex items-center mt-1"><ArrowUp className="w-3 h-3 mr-1" />+8% from last term</p></CardContent></Card>
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Attendance Trends</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between gap-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, i) => (
                <div key={day} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full bg-primary-500 rounded-t" style={{ height: `${70 + i * 5}%` }} />
                  <span className="text-xs text-gray-600">{day}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Performance by Grade</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { grade: 'Class 12', pass: 92, avg: 75 },
                { grade: 'Class 11', pass: 88, avg: 71 },
                { grade: 'Class 10', pass: 90, avg: 73 },
                { grade: 'Class 9', pass: 85, avg: 68 },
              ].map((g) => (
                <div key={g.grade} className="space-y-1">
                  <div className="flex justify-between text-sm"><span>{g.grade}</span><span>{g.pass}% pass rate</span></div>
                  <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-green-500 h-2 rounded-full" style={{ width: `${g.pass}%` }} /></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* More Analytics */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Award className="w-5 h-5 text-yellow-500" />Top Performers</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: 'Tashi Dorji', class: 'Class 10 A', score: 92 },
                { name: 'Karma Wangmo', class: 'Class 12 A', score: 89 },
                { name: 'Pema Lhamo', class: 'Class 11 A', score: 87 },
              ].map((s, i) => (
                <div key={s.name} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i === 0 ? 'bg-yellow-100 text-yellow-700' : i === 1 ? 'bg-gray-100 text-gray-700' : 'bg-orange-100 text-orange-700'}`}>{i + 1}</div>
                  <div className="flex-1"><p className="font-medium text-sm">{s.name}</p><p className="text-xs text-gray-500">{s.class}</p></div>
                  <span className="font-semibold">{s.score}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><AlertCircle className="w-5 h-5 text-orange-500" />Need Attention</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: 'Dorji Wangchuk', class: 'Class 9 A', issue: 'Low attendance (65%)', type: 'attendance' },
                { name: 'Sonam Yangden', class: 'Class 10 B', issue: 'Pending fees', type: 'fees' },
                { name: 'Karma Tshering', class: 'Class 11 B', issue: 'Declining scores', type: 'academic' },
              ].map((s) => (
                <div key={s.name} className="p-2 bg-red-50 rounded-lg">
                  <p className="font-medium text-sm">{s.name}</p>
                  <p className="text-xs text-gray-600">{s.class}</p>
                  <p className="text-xs text-red-600 mt-1">{s.issue}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="w-5 h-5 text-green-500" />Fee Status</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-3xl font-bold text-green-600">85%</p>
                <p className="text-sm text-gray-600">Collection Rate</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm"><span>Paid</span><span className="text-green-600">354 students</span></div>
                <div className="flex justify-between text-sm"><span>Partial</span><span className="text-yellow-600">68 students</span></div>
                <div className="flex justify-between text-sm"><span>Pending</span><span className="text-red-600">65 students</span></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
