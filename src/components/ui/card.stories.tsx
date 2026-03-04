/**
 * CARD STORIES
 */

import type { Meta, StoryObj } from "@storybook/react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./card";
import { Button } from "./button";

const meta = {
  title: "UI/Card",
  component: Card,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description goes here</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card content goes here. This is the main body of the card.</p>
      </CardContent>
      <CardFooter>
        <Button>Action</Button>
      </CardFooter>
    </Card>
  ),
};

export const WithoutHeader: Story = {
  render: () => (
    <Card className="w-80">
      <CardContent className="pt-6">
        <p>Card with just content, no header or footer.</p>
      </CardContent>
    </Card>
  ),
};

export const StudentProfile: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Tashi Wangyel</CardTitle>
        <CardDescription>Class 10 - Section A</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">School:</span>
            <span>Yangchenphug HSS</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Roll No:</span>
            <span>15</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Attendance:</span>
            <span className="text-green-600">92%</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full">View Profile</Button>
      </CardFooter>
    </Card>
  ),
};

export const AssessmentCard: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>RIASEC Assessment</CardTitle>
        <CardDescription>Discover your career interests</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Duration:</span>
            <span>15 minutes</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Questions:</span>
            <span>60</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full">Start Assessment</Button>
      </CardFooter>
    </Card>
  ),
};

export const StatsCard: Story = {
  render: () => (
    <Card className="w-64">
      <CardHeader className="pb-3">
        <CardDescription>Total Students</CardDescription>
        <CardTitle className="text-3xl">1,234</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-green-600">+12% from last month</p>
      </CardContent>
    </Card>
  ),
};

export const WarningCard: Story = {
  render: () => (
    <Card className="w-80 border-amber-200 bg-amber-50">
      <CardHeader>
        <CardTitle className="text-amber-800">Action Required</CardTitle>
        <CardDescription className="text-amber-600">5 students pending approval</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-amber-700">
          Review and approve pending student registrations to grant access.
        </p>
      </CardContent>
      <CardFooter>
        <Button size="sm" variant="outline">Review Now</Button>
      </CardFooter>
    </Card>
  ),
};
