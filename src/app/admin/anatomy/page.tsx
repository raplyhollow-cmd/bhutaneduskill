/**
 * DIGITAL ANATOMY PAGE
 *
 * Entry point for the Digital Anatomy Dashboard.
 * Accessible at /admin/anatomy
 */

import { DigitalAnatomyDashboard } from "./components/digital-anatomy-dashboard";

export const metadata = {
  title: "Digital Anatomy - System Health",
  description: "Real-time visualization of system vital signs",
};

export default function AnatomyPage() {
  return <DigitalAnatomyDashboard />;
}
