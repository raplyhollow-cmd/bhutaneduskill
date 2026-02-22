"use client";

import { useState } from "react";
import {
  Database,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileText,
  Download,
  Upload,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function EMISSyncPage() {
  const colors = {
    primary: "rgb(168 85 247)",
    secondary: "rgb(147 51 234)",
    gradient: "linear-gradient(135deg, rgb(168 85 247) 0%, rgb(147 51 234) 100%)",
  };

  const syncStatus = {
    lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    nextScheduled: new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString(),
    status: "success",
    recordsProcessed: 245000,
    recordsUpdated: 12345,
    recordsFailed: 3,
  };

  const dataCategories = [
    { name: "Student Enrollment", records: 245000, lastUpdate: "2 hours ago", status: "synced" },
    { name: "Teacher Records", records: 8540, lastUpdate: "2 hours ago", status: "synced" },
    { name: "Assessment Results", records: 189000, lastUpdate: "2 hours ago", status: "synced" },
    { name: "Attendance Data", records: 245000, lastUpdate: "2 hours ago", status: "synced" },
    { name: "School Infrastructure", records: 245, lastUpdate: "1 day ago", status: "pending" },
    { name: "Financial Data", records: 4560, lastUpdate: "1 day ago", status: "pending" },
  ];

  const syncHistory = [
    { date: "2026-02-22 14:00", status: "success", records: 245000, duration: "2m 34s" },
    { date: "2026-02-21 14:00", status: "success", records: 244500, duration: "2m 28s" },
    { date: "2026-02-20 14:00", status: "success", records: 244000, duration: "2m 31s" },
    { date: "2026-02-19 14:00", status: "partial", records: 243500, duration: "2m 15s" },
    { date: "2026-02-18 14:00", status: "success", records: 243000, duration: "2m 29s" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-6 h-6" style={{ color: colors.primary }} />
            <h1 className="text-3xl font-bold text-gray-900">EMIS Synchronization</h1>
          </div>
          <p className="text-gray-600 mt-1">Real-time Education Management Information System data sync</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Export EMIS Data
          </Button>
          <Button style={{ background: colors.gradient }} className="text-white">
            <RefreshCw className="w-4 h-4 mr-2" />
            Sync Now
          </Button>
        </div>
      </div>

      {/* Sync Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-green-100">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Last Sync</p>
                <p className="text-lg font-bold text-gray-900">2 hours ago</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-100">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Next Scheduled</p>
                <p className="text-lg font-bold text-gray-900">22:00 today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-purple-100">
                <Database className="w-6 h-6" style={{ color: colors.primary }} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Records Processed</p>
                <p className="text-lg font-bold text-gray-900">{syncStatus.recordsProcessed.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-yellow-100">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Records Failed</p>
                <p className="text-lg font-bold text-yellow-700">{syncStatus.recordsFailed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Data Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dataCategories.map((category, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{category.name}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    category.status === "synced" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {category.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>{category.records.toLocaleString()} records</span>
                  <span>{category.lastUpdate}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sync History */}
      <Card>
        <CardHeader>
          <CardTitle>Sync History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Date & Time</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Records</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Duration</th>
                </tr>
              </thead>
              <tbody>
                {syncHistory.map((sync, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-3 px-4 text-gray-900">{sync.date}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        sync.status === "success" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {sync.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-gray-700">{sync.records.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-gray-700">{sync.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* EMIS Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <FileText className="w-6 h-6 text-blue-600 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">About EMIS Integration</h3>
              <p className="text-sm text-blue-700">
                The EMIS (Education Management Information System) sync ensures that national education data
                is automatically transmitted to the Ministry of Education. Data is aggregated from all schools
                and synchronized daily at 22:00. Manual sync can be triggered at any time for urgent updates.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}