"use client";

import { FeatureListPage } from "@/components/unified";
import { CareerMatcheFeature } from "@/features";

export default function CareerMatchesPage() {
  return (
    <FeatureListPage
      feature={CareerMatcheFeature}
      title="CareerMatches"
      onCreate={() => window.location.href = "/admin/career_matches/new"}
      onEdit={(id) => window.location.href = `/admin/career_matches/${id}/edit`}
    />
  );
}
