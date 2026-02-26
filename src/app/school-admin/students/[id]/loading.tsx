import { CardGridSkeleton } from "@/components/ui/skeleton/card-skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-9 w-24 animate-pulse rounded-lg bg-muted duration-500" />
          <div className="space-y-2">
            <div className="h-8 w-48 animate-pulse rounded-lg bg-muted duration-500" />
            <div className="h-4 w-32 animate-pulse rounded-lg bg-muted duration-500" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-20 animate-pulse rounded-lg bg-muted duration-500" />
          <div className="h-9 w-16 animate-pulse rounded-lg bg-muted duration-500" />
          <div className="h-9 w-20 animate-pulse rounded-lg bg-muted duration-500" />
        </div>
      </div>

      {/* Quick Stats skeleton */}
      <CardGridSkeleton count={4} />

      {/* Main content skeleton */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left column - Personal Info cards */}
        <div className="space-y-6">
          <div className="p-6 border rounded-lg space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-16 w-16 animate-pulse rounded-full bg-muted duration-500" />
              <div className="space-y-2 flex-1">
                <div className="h-5 w-3/4 animate-pulse rounded-lg bg-muted duration-500" />
                <div className="h-3 w-1/4 animate-pulse rounded-lg bg-muted duration-500" />
              </div>
            </div>
            <div className="space-y-3 pt-4">
              <div className="h-4 w-full animate-pulse rounded-lg bg-muted duration-500" />
              <div className="h-4 w-5/6 animate-pulse rounded-lg bg-muted duration-500" />
              <div className="h-4 w-4/6 animate-pulse rounded-lg bg-muted duration-500" />
            </div>
          </div>

          {/* Academic Info card skeleton */}
          <div className="p-6 border rounded-lg space-y-4">
            <div className="h-6 w-1/2 animate-pulse rounded-lg bg-muted duration-500" />
            <div className="space-y-3">
              <div className="h-4 w-full animate-pulse rounded-lg bg-muted duration-500" />
              <div className="h-4 w-3/4 animate-pulse rounded-lg bg-muted duration-500" />
              <div className="h-4 w-1/2 animate-pulse rounded-lg bg-muted duration-500" />
            </div>
          </div>

          {/* Documents card skeleton */}
          <div className="p-6 border rounded-lg space-y-3">
            <div className="h-6 w-1/3 animate-pulse rounded-lg bg-muted duration-500" />
            <div className="h-3 w-2/3 animate-pulse rounded-lg bg-muted duration-500" />
            <div className="space-y-2">
              <div className="h-10 w-full animate-pulse rounded-lg bg-muted duration-500" />
              <div className="h-10 w-full animate-pulse rounded-lg bg-muted duration-500" />
              <div className="h-10 w-full animate-pulse rounded-lg bg-muted duration-500" />
            </div>
          </div>
        </div>

        {/* Right column - Activity & Records cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* Attendance Overview card skeleton */}
          <div className="p-6 border rounded-lg space-y-4">
            <div className="space-y-2">
              <div className="h-6 w-1/3 animate-pulse rounded-lg bg-muted duration-500" />
              <div className="h-3 w-2/3 animate-pulse rounded-lg bg-muted duration-500" />
            </div>
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-3 bg-muted/50 rounded-lg">
                  <div className="h-8 w-8 mx-auto animate-pulse rounded-lg bg-muted duration-500 mb-2" />
                  <div className="h-3 w-16 mx-auto animate-pulse rounded-lg bg-muted duration-500" />
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <div className="h-4 w-1/4 animate-pulse rounded-lg bg-muted duration-500" />
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 w-full animate-pulse rounded-lg bg-muted duration-500" />
              ))}
            </div>
          </div>

          {/* Fee Status card skeleton */}
          <div className="p-6 border rounded-lg space-y-4">
            <div className="space-y-2">
              <div className="h-6 w-1/4 animate-pulse rounded-lg bg-muted duration-500" />
              <div className="h-3 w-2/3 animate-pulse rounded-lg bg-muted duration-500" />
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-3 w-12 animate-pulse rounded-lg bg-muted duration-500" />
                  <div className="h-6 w-20 animate-pulse rounded-lg bg-muted duration-500" />
                </div>
              ))}
            </div>
          </div>

          {/* Assessment Results card skeleton */}
          <div className="p-6 border rounded-lg space-y-3">
            <div className="space-y-2">
              <div className="h-6 w-1/3 animate-pulse rounded-lg bg-muted duration-500" />
              <div className="h-3 w-2/3 animate-pulse rounded-lg bg-muted duration-500" />
            </div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 w-full animate-pulse rounded-lg bg-muted duration-500" />
            ))}
          </div>

          {/* Homework Submissions card skeleton */}
          <div className="p-6 border rounded-lg space-y-3">
            <div className="space-y-2">
              <div className="h-6 w-1/3 animate-pulse rounded-lg bg-muted duration-500" />
              <div className="h-3 w-2/3 animate-pulse rounded-lg bg-muted duration-500" />
            </div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 w-full animate-pulse rounded-lg bg-muted duration-500" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
