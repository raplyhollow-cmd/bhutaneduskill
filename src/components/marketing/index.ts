// Marketing Components for Homepage
// These components are designed for the public-facing landing page

export { TrustedBy, SchoolLogo } from "./trusted-by";
export {
  Testimonials,
  TestimonialCard,
  CompactTestimonial,
} from "./testimonials";
export {
  Integrations,
  PartnerInstitutionCard,
  TechCard,
  IntegrationBadge,
  IntegrationGrid,
} from "./integrations";

// Re-export types for TypeScript consumers
export type { default } from "./trusted-by";
export type { default } from "./testimonials";
export type { default } from "./integrations";
