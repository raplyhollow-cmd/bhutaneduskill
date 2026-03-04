"use client";

import { FeatureListPage } from "@/components/unified";
import { CounselorNoteFeature } from "@/features";

export default function CounselorNotesPage() {
  return (
    <FeatureListPage
      feature={CounselorNoteFeature}
      title="CounselorNotes"
      onCreate={() => window.location.href = "/admin/counselor_notes/new"}
      onEdit={(id) => window.location.href = `/admin/counselor_notes/${id}/edit`}
    />
  );
}
