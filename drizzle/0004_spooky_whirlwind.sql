ALTER TABLE "users" DROP CONSTRAINT "users_clerk_id_unique";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "clerk_id";--> statement-breakpoint
ALTER TABLE "component_access" ADD CONSTRAINT "component_access_role_id_component_path_unique" UNIQUE("role_id","component_path");