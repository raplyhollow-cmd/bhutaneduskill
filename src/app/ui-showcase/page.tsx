"use client";

import * as React from "react";
import {
  PageContainer,
  PageHeader,
  PageSection,
  Grid,
  GridItem,
  CardGrid,
  StatGrid,
  FormGrid,
  ListGrid,
  Stack,
  HStack,
  VStack,
  TightStack,
  LooseStack,
  Separator,
  StackWithSeparator,
  Cluster,
  TightCluster,
  CenterCluster,
  SpaceBetweenCluster,
  Header,
  Breadcrumb,
  PageTitle,
  PageActions,
  EmptyState,
  NoData,
  NoResults,
  NoFiles,
  NoUsers,
  ErrorState,
  LoadingState,
  EmptyStateIcon,
} from "@/components/layouts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Home,
  Settings,
  Users,
  FileText,
  Search,
  Bell,
  Mail,
  Calendar,
  CheckCircle,
  AlertTriangle,
  X,
  Menu,
  LayoutDashboard,
  FolderOpen,
  Plus,
  Filter,
  Download,
  Share,
  MoreHorizontal,
  Star,
  Clock,
  ArrowRight,
  ChevronRight,
} from "lucide-react";

export default function UIShowcasePage() {
  const [activeTab, setActiveTab] = React.useState("container");

  const tabs = [
    { id: "container", label: "Page Container" },
    { id: "grid", label: "Grid" },
    { id: "stack", label: "Stack" },
    { id: "cluster", label: "Cluster" },
    { id: "header", label: "Header" },
    { id: "empty", label: "Empty States" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <Header
        title="Layout Components Showcase"
        subtitle="Explore the comprehensive layout system for consistent UI"
        breadcrumbs={[
          { label: "Home", href: "/", icon: <Home className="h-4 w-4" /> },
          { label: "UI Showcase" },
        ]}
        alert={{
          message: "This is a demo page showcasing all layout components",
          variant: "info",
          dismissible: true,
        }}
      />

      {/* Navigation Tabs */}
      <div className="border-b bg-muted/30">
        <PageContainer size="content">
          <Cluster gap={0} className="py-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "rounded-md px-4 py-2 text-sm font-medium transition-colors",
                  activeTab === tab.id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </Cluster>
        </PageContainer>
      </div>

      {/* Content Area */}
      <main className="py-8">
        <PageContainer size="content">
          {/* Page Container Section */}
          {activeTab === "container" && (
            <Stack gap={48}>
              <PageSection title="PageContainer">
                <Stack gap={24}>
                  <p className="text-muted-foreground">
                    The PageContainer component provides consistent max-width and padding across your pages.
                  </p>

                  {/* Size Variants */}
                  <VStack gap={16}>
                    <Label>Sizes</Label>
                    <Stack gap={16}>
                      <div className="rounded-lg border p-4">
                        <Label className="text-xs text-muted-foreground">narrow (max-w-3xl)</Label>
                        <div className="mt-2 h-16 rounded bg-muted/50" />
                      </div>
                      <div className="rounded-lg border p-4">
                        <Label className="text-xs text-muted-foreground">content (max-w-5xl - default)</Label>
                        <div className="mt-2 h-16 rounded bg-muted/50" />
                      </div>
                      <div className="rounded-lg border p-4">
                        <Label className="text-xs text-muted-foreground">wide (max-w-7xl)</Label>
                        <div className="mt-2 h-16 rounded bg-muted/50" />
                      </div>
                    </Stack>
                  </VStack>

                  {/* Variant Examples */}
                  <VStack gap={16}>
                    <Label>Variants</Label>
                    <HStack gap={16} align="stretch">
                      <div className="flex-1 rounded-lg border-2 border-dashed p-4">
                        <Label className="text-xs text-muted-foreground">default</Label>
                      </div>
                      <div className="flex-1 rounded-lg bg-muted/30 p-4">
                        <Label className="text-xs text-muted-foreground">muted</Label>
                      </div>
                      <div className="flex-1 rounded-lg border bg-card p-4 shadow-sm">
                        <Label className="text-xs text-muted-foreground">card</Label>
                      </div>
                    </HStack>
                  </VStack>
                </Stack>
              </PageSection>

              {/* PageHeader Example */}
              <PageSection title="PageHeader">
                <div className="rounded-lg border p-6">
                  <PageHeader
                    title="Example Page"
                    subtitle="This is an example page header with subtitle"
                    breadcrumbs={[
                      { label: "Home", href: "/" },
                      { label: "Examples", href: "/examples" },
                      { label: "Example Page" },
                    ]}
                    actions={
                      <Cluster gap={8}>
                        <Button variant="outline" size="sm">
                          Cancel
                        </Button>
                        <Button size="sm">Save</Button>
                      </Cluster>
                    }
                  />
                </div>
              </PageSection>

              {/* PageSection Example */}
              <PageSection title="PageSection">
                <div className="rounded-lg border p-6">
                  <PageSection
                    title="Collapsible Section"
                    description="Click the arrow to collapse this section"
                    collapsible
                    actions={
                      <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    }
                  >
                    <div className="rounded-md bg-muted/50 p-4">
                      This content can be collapsed. The section supports all the same features as a regular
                      div but adds the collapsible functionality.
                    </div>
                  </PageSection>
                </div>
              </PageSection>
            </Stack>
          )}

          {/* Grid Section */}
          {activeTab === "grid" && (
            <Stack gap={48}>
              <PageSection title="Grid Component">
                <Stack gap={24}>
                  <p className="text-muted-foreground">
                    The Grid component provides flexible CSS grid layouts with responsive columns.
                  </p>

                  {/* Basic Grid */}
                  <VStack gap={16}>
                    <Label>Basic Grid (responsive)</Label>
                    <div className="rounded-lg border p-4">
                      <Grid cols={{ sm: 1, md: 2, lg: 3 }} gap={16}>
                        {Array.from({ length: 6 }).map((_, i) => (
                          <div key={i} className="rounded-md bg-primary/10 p-4 text-center">
                            Item {i + 1}
                          </div>
                        ))}
                      </Grid>
                    </div>
                  </VStack>

                  {/* Auto-fit Grid */}
                  <VStack gap={16}>
                    <Label>Auto-fit Grid (min-width: 200px)</Label>
                    <div className="rounded-lg border p-4">
                      <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                          <div key={i} className="rounded-md bg-primary/10 p-4 text-center">
                            Card {i + 1}
                          </div>
                        ))}
                      </div>
                    </div>
                  </VStack>

                  {/* Grid with Spans */}
                  <VStack gap={16}>
                    <Label>Grid with Col Spans</Label>
                    <div className="rounded-lg border p-4">
                      <Grid cols={{ sm: 1, md: 2, lg: 4 }} gap={16}>
                        <GridItem colSpan={2} className="rounded-md bg-blue-500/10 p-4 text-center">
                          Spans 2 columns
                        </GridItem>
                        <GridItem className="rounded-md bg-primary/10 p-4 text-center">
                          Normal
                        </GridItem>
                        <GridItem className="rounded-md bg-primary/10 p-4 text-center">
                          Normal
                        </GridItem>
                        <GridItem className="rounded-md bg-primary/10 p-4 text-center">
                          Normal
                        </GridItem>
                        <GridItem className="rounded-md bg-primary/10 p-4 text-center">
                          Normal
                        </GridItem>
                        <GridItem colSpan="full" className="rounded-md bg-green-500/10 p-4 text-center">
                          Spans full width
                        </GridItem>
                      </Grid>
                    </div>
                  </VStack>

                  {/* Preset Grids */}
                  <VStack gap={16}>
                    <Label>CardGrid Preset</Label>
                    <div className="rounded-lg border p-4">
                      <CardGrid>
                        {Array.from({ length: 6 }).map((_, i) => (
                          <div key={i} className="rounded-lg border bg-card p-4 shadow-sm">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-primary/10" />
                              <div className="space-y-1">
                                <div className="h-4 w-24 rounded bg-muted" />
                                <div className="h-3 w-16 rounded bg-muted/50" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </CardGrid>
                    </div>
                  </VStack>

                  <VStack gap={16}>
                    <Label>StatGrid Preset</Label>
                    <div className="rounded-lg border p-4">
                      <StatGrid>
                        {[
                          { label: "Total Users", value: "2,543", icon: Users },
                          { label: "Documents", value: "1,234", icon: FileText },
                          { label: "Notifications", value: "89", icon: Bell },
                          { label: "Messages", value: "456", icon: Mail },
                        ].map((stat, i) => (
                          <div key={i} className="rounded-lg border bg-card p-4">
                            <div className="flex items-center gap-3">
                              <div className="rounded-md bg-primary/10 p-2">
                                <stat.icon className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <p className="text-2xl font-semibold">{stat.value}</p>
                                <p className="text-sm text-muted-foreground">{stat.label}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </StatGrid>
                    </div>
                  </VStack>
                </Stack>
              </PageSection>
            </Stack>
          )}

          {/* Stack Section */}
          {activeTab === "stack" && (
            <Stack gap={48}>
              <PageSection title="Stack Component">
                <Stack gap={24}>
                  <p className="text-muted-foreground">
                    The Stack component arranges items vertically or horizontally with consistent gaps.
                  </p>

                  {/* VStack Examples */}
                  <VStack gap={16}>
                    <Label>Vertical Stack (gap: 8, 16, 24, 32)</Label>
                    <HStack gap={16} align="stretch">
                      <div className="flex-1 rounded-lg border p-4">
                        <Label className="text-xs text-muted-foreground">TightStack (8px)</Label>
                        <TightStack className="mt-2">
                          {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="rounded bg-primary/10 px-3 py-2 text-sm">
                              Item {i + 1}
                            </div>
                          ))}
                        </TightStack>
                      </div>
                      <div className="flex-1 rounded-lg border p-4">
                        <Label className="text-xs text-muted-foreground">VStack (16px)</Label>
                        <VStack className="mt-2">
                          {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="rounded bg-primary/10 px-3 py-2 text-sm">
                              Item {i + 1}
                            </div>
                          ))}
                        </VStack>
                      </div>
                      <div className="flex-1 rounded-lg border p-4">
                        <Label className="text-xs text-muted-foreground">LooseStack (24px)</Label>
                        <LooseStack className="mt-2">
                          {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="rounded bg-primary/10 px-3 py-2 text-sm">
                              Item {i + 1}
                            </div>
                          ))}
                        </LooseStack>
                      </div>
                    </HStack>
                  </VStack>

                  {/* HStack Examples */}
                  <VStack gap={16}>
                    <Label>Horizontal Stack</Label>
                    <div className="rounded-lg border p-4">
                      <HStack gap={16} align="center">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} className="rounded bg-primary/10 px-4 py-2 text-sm">
                            Item {i + 1}
                          </div>
                        ))}
                      </HStack>
                    </div>
                  </VStack>

                  {/* Separator */}
                  <VStack gap={16}>
                    <Label>Separator</Label>
                    <div className="rounded-lg border p-4">
                      <Stack gap={0}>
                        <div className="rounded bg-primary/10 px-4 py-2">Item 1</div>
                        <Separator />
                        <div className="rounded bg-primary/10 px-4 py-2">Item 2</div>
                        <Separator variant="muted" />
                        <div className="rounded bg-primary/10 px-4 py-2">Item 3</div>
                      </Stack>
                    </div>
                  </VStack>

                  {/* StackWithSeparator */}
                  <VStack gap={16}>
                    <Label>StackWithSeparator</Label>
                    <div className="rounded-lg border p-4">
                      <StackWithSeparator gap={16}>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10" />
                          <div>
                            <p className="font-medium">John Doe</p>
                            <p className="text-sm text-muted-foreground">john@example.com</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10" />
                          <div>
                            <p className="font-medium">Jane Smith</p>
                            <p className="text-sm text-muted-foreground">jane@example.com</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10" />
                          <div>
                            <p className="font-medium">Bob Johnson</p>
                            <p className="text-sm text-muted-foreground">bob@example.com</p>
                          </div>
                        </div>
                      </StackWithSeparator>
                    </div>
                  </VStack>

                  {/* Alignment Examples */}
                  <VStack gap={16}>
                    <Label>Stack Alignment</Label>
                    <HStack gap={16} className="flex-wrap">
                      {["start", "center", "end", "stretch"].map((align) => (
                        <div key={align} className="rounded-lg border p-4">
                          <Label className="text-xs text-muted-foreground">align="{align}"</Label>
                          <Stack gap={8} align={align as "start" | "center" | "end" | "stretch" | "baseline"} className="mt-2">
                            <div className="w-24 rounded bg-primary/10 px-3 py-2 text-sm">
                              {align === "stretch" ? "Stretched item" : "Item 1"}
                            </div>
                            <div className="w-32 rounded bg-primary/10 px-3 py-2 text-sm">
                              Item 2 - {align}
                            </div>
                          </Stack>
                        </div>
                      ))}
                    </HStack>
                  </VStack>
                </Stack>
              </PageSection>
            </Stack>
          )}

          {/* Cluster Section */}
          {activeTab === "cluster" && (
            <Stack gap={48}>
              <PageSection title="Cluster Component">
                <Stack gap={24}>
                  <p className="text-muted-foreground">
                    The Cluster component arranges items in a row with wrapping. Perfect for tags, badges, and button groups.
                  </p>

                  {/* Tag Cloud */}
                  <VStack gap={16}>
                    <Label>Tag Cloud</Label>
                    <div className="rounded-lg border p-4">
                      <TightCluster justify="center">
                        {[
                          "React",
                          "TypeScript",
                          "Next.js",
                          "Tailwind CSS",
                          "Framer Motion",
                          "PostgreSQL",
                          "Prisma",
                          "Clerk",
                          "Vercel",
                        ].map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
                          >
                            {tag}
                          </span>
                        ))}
                      </TightCluster>
                    </div>
                  </VStack>

                  {/* Button Groups */}
                  <VStack gap={16}>
                    <Label>Button Groups</Label>
                    <div className="rounded-lg border p-4">
                      <Cluster gap={16}>
                        <Button variant="outline" size="sm">
                          <Filter className="mr-2 h-4 w-4" />
                          Filter
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="mr-2 h-4 w-4" />
                          Export
                        </Button>
                        <Button variant="outline" size="sm">
                          <Share className="mr-2 h-4 w-4" />
                          Share
                        </Button>
                        <Button size="sm">
                          <Plus className="mr-2 h-4 w-4" />
                          Add New
                        </Button>
                      </Cluster>
                    </div>
                  </VStack>

                  {/* Action Buttons */}
                  <VStack gap={16}>
                    <Label>SpaceBetweenCluster</Label>
                    <div className="rounded-lg border p-4">
                      <SpaceBetweenCluster>
                        <span className="text-sm text-muted-foreground">
                          Showing 1-10 of 50 results
                        </span>
                        <Cluster gap={8}>
                          <Button variant="outline" size="sm">Previous</Button>
                          <Button size="sm">Next</Button>
                        </Cluster>
                      </SpaceBetweenCluster>
                    </div>
                  </VStack>

                  {/* User Avatars */}
                  <VStack gap={16}>
                    <Label>Avatar Cluster</Label>
                    <div className="rounded-lg border p-4">
                      <Cluster gap={8}>
                        {Array.from({ length: 8 }).map((_, i) => (
                          <div
                            key={i}
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary"
                          >
                            {String.fromCharCode(65 + i)}
                          </div>
                        ))}
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
                          +5
                        </div>
                      </Cluster>
                    </div>
                  </VStack>

                  {/* Justify Variants */}
                  <VStack gap={16}>
                    <Label>Justify Options</Label>
                    <Stack gap={16}>
                      {["start", "center", "end", "space-between"].map((justify) => (
                        <div key={justify} className="rounded-lg border p-4">
                          <Label className="text-xs text-muted-foreground">justify="{justify}"</Label>
                          <Cluster gap={"md" as any} justify={justify as "start" | "center" | "end" | "space-between"} className="mt-2">
                            {Array.from({ length: 3 }).map((_, i) => (
                              <div
                                key={i}
                                className="rounded-md bg-primary/10 px-3 py-2 text-sm"
                              >
                                {justify === "space-between" ? `Item ${i + 1}` : `${justify}`}
                              </div>
                            ))}
                          </Cluster>
                        </div>
                      ))}
                    </Stack>
                  </VStack>
                </Stack>
              </PageSection>
            </Stack>
          )}

          {/* Header Section */}
          {activeTab === "header" && (
            <Stack gap={48}>
              <PageSection title="Header Components">
                <Stack gap={24}>
                  {/* Breadcrumb */}
                  <VStack gap={16}>
                    <Label>Breadcrumb</Label>
                    <div className="rounded-lg border p-4">
                      <Breadcrumb
                        items={[
                          { label: "Home", href: "/", icon: <Home className="h-4 w-4" /> },
                          { label: "Settings", href: "/settings" },
                          { label: "Profile" },
                        ]}
                      />
                    </div>
                  </VStack>

                  {/* PageTitle */}
                  <VStack gap={16}>
                    <Label>PageTitle</Label>
                    <div className="rounded-lg border p-4">
                      <PageTitle
                        title="Dashboard Overview"
                        subtitle="Welcome back! Here's what's happening today."
                        actions={
                          <Cluster gap={8}>
                            <Button variant="outline" size="sm">
                              <Calendar className="mr-2 h-4 w-4" />
                              Today
                            </Button>
                            <Button size="sm">
                              <Plus className="mr-2 h-4 w-4" />
                              New
                            </Button>
                          </Cluster>
                        }
                      />
                    </div>
                  </VStack>

                  {/* PageActions */}
                  <VStack gap={16}>
                    <Label>PageActions</Label>
                    <div className="space-y-4">
                      <div className="rounded-lg border p-4">
                        <Label className="text-xs text-muted-foreground">Default (right aligned)</Label>
                        <div className="mt-2">
                          <PageActions>
                            <Button variant="outline" size="sm">Cancel</Button>
                            <Button variant="outline" size="sm">Draft</Button>
                            <Button size="sm">Publish</Button>
                          </PageActions>
                        </div>
                      </div>
                      <div className="rounded-lg border p-4">
                        <Label className="text-xs text-muted-foreground">Center aligned</Label>
                        <div className="mt-2">
                          <PageActions align="center">
                            <Button variant="outline" size="sm">Previous</Button>
                            <Button size="sm">Next</Button>
                          </PageActions>
                        </div>
                      </div>
                    </div>
                  </VStack>
                </Stack>
              </PageSection>
            </Stack>
          )}

          {/* Empty State Section */}
          {activeTab === "empty" && (
            <Stack gap={48}>
              <PageSection title="Empty State Components">
                <Stack gap={24}>
                  <p className="text-muted-foreground">
                    Empty states provide helpful guidance when there's no content to display.
                  </p>

                  {/* Preset Empty States */}
                  <div className="rounded-lg border p-4">
                    <Label className="text-xs text-muted-foreground mb-4 block">Preset Empty States</Label>
                    <Grid cols={{ sm: 1, md: 2 }} gap={24}>
                      <NoData />
                      <NoResults />
                      <NoFiles />
                      <NoUsers />
                    </Grid>
                  </div>

                  {/* Error State */}
                  <div className="rounded-lg border p-4">
                    <Label className="text-xs text-muted-foreground mb-4 block">Error State</Label>
                    <ErrorState
                      action={{ label: "Try Again", onClick: () => console.log("Retry") }}
                    />
                  </div>

                  {/* Loading State */}
                  <div className="rounded-lg border p-4">
                    <Label className="text-xs text-muted-foreground mb-4 block">Loading State</Label>
                    <LoadingState message="Loading your data..." />
                  </div>

                  {/* Custom Empty State */}
                  <div className="rounded-lg border p-4">
                    <Label className="text-xs text-muted-foreground mb-4 block">Custom Empty State</Label>
                    <EmptyState
                      icon={<Star className="text-muted-foreground" />}
                      title="No favorites yet"
                      description="Start adding items to your favorites to see them here."
                      action={{
                        label: "Explore Items",
                        onClick: () => console.log("Explore"),
                        icon: <ArrowRight className="h-4 w-4" />,
                      }}
                      size="lg"
                      variant="bordered"
                    />
                  </div>

                  {/* Size Variants */}
                  <div className="rounded-lg border p-4">
                    <Label className="text-xs text-muted-foreground mb-4 block">Size Variants</Label>
                    <Grid cols={{ sm: 1, md: 3 }} gap={16}>
                      <EmptyState
                        icon={<FolderOpen className="text-muted-foreground" />}
                    title="Small size"
                    size="sm"
                  />
                  <EmptyState
                    icon={<FolderOpen className="text-muted-foreground" />}
                    title="Default size"
                    size="default"
                  />
                  <EmptyState
                    icon={<FolderOpen className="text-muted-foreground" />}
                    title="Large size"
                    size="lg"
                  />
                </Grid>
              </div>
            </Stack>
          </PageSection>
        </Stack>
      )}
    </PageContainer>
  </main>

  {/* Footer */}
  <footer className="border-t bg-muted/30 py-8">
    <PageContainer size="content">
      <Cluster justify="center" gap={8} className="text-sm text-muted-foreground">
        <span>Layout Components</span>
        <span>•</span>
        <span>Bhutan EduSkill Platform</span>
        <span>•</span>
        <span>2026</span>
      </Cluster>
    </PageContainer>
  </footer>
</div>
);
}

// Helper function for className
function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}
