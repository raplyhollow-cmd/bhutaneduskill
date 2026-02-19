"use client";

/**
 * PARENT CHILD SELECTOR
 *
 * Client component for selecting which child to view.
 */

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter, useSearchParams } from "next/navigation";
import type { ChildData } from "./_actions";

interface ParentChildSelectorProps {
  children: ChildData[];
  selectedChildId: string;
}

export function ParentChildSelector({ children, selectedChildId }: ParentChildSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChildChange = (childId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("child", childId);
    router.push(`?${params.toString()}`);
  };

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center gap-4 overflow-x-auto pb-2">
          <Badge className="bg-gray-100 text-gray-700 px-3 py-1.5 whitespace-nowrap">
            {children.length} Children
          </Badge>
          <div className="flex gap-2">
            {children.map((child) => (
              <Button
                key={child.id}
                variant={selectedChildId === child.id ? "default" : "outline"}
                size="sm"
                onClick={() => handleChildChange(child.id)}
                className="whitespace-nowrap"
                style={
                  selectedChildId === child.id
                    ? { background: "linear-gradient(135deg, rgb(107 114 128) 0%, rgb(75 85 99) 100%)" }
                    : undefined
                }
              >
                {child.firstName} {child.lastName}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
