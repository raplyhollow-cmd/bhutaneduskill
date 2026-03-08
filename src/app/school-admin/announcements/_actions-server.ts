"use server";

import { revalidatePath } from "next/cache";
import type { AnnouncementFormData } from "@/components/announcements";

export async function handleCreateAction(data: AnnouncementFormData) {
  const { createAnnouncement } = await import("./../_actions");
  const result = await createAnnouncement(data);
  if (result.success) {
    revalidatePath("/school-admin/announcements");
  }
  return result;
}

export async function handleUpdateAction(id: string, data: Partial<AnnouncementFormData>) {
  const { updateAnnouncement } = await import("./../_actions");
  const result = await updateAnnouncement(id, data);
  if (result.success) {
    revalidatePath("/school-admin/announcements");
  }
  return result;
}

export async function handleDeleteAction(id: string) {
  const { deleteAnnouncement } = await import("./../_actions");
  const result = await deleteAnnouncement(id);
  if (result.success) {
    revalidatePath("/school-admin/announcements");
  }
  return result;
}

export async function handleTogglePinAction(id: string) {
  const { togglePinAnnouncement } = await import("./../_actions");
  const result = await togglePinAnnouncement(id);
  if (result.success) {
    revalidatePath("/school-admin/announcements");
  }
  return result;
}
