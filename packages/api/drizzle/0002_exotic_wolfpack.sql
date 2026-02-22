CREATE TYPE "public"."recipe_type" AS ENUM('full_meal', 'entree', 'side', 'dessert', 'appetizer', 'snack', 'drink', 'other');--> statement-breakpoint
ALTER TYPE "public"."recipe_source" ADD VALUE 'community';--> statement-breakpoint
CREATE TABLE "recipe_checkins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipe_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"notes" text,
	"enjoyment_rating" integer NOT NULL,
	"instruction_rating" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_user_id" text,
	"updated_by_user_id" text
);
--> statement-breakpoint
ALTER TABLE "meal_plans" DROP CONSTRAINT "unique_meal_plan_slot";--> statement-breakpoint
ALTER TABLE "meal_plans" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "recipes" ADD COLUMN "type" "recipe_type" DEFAULT 'full_meal' NOT NULL;--> statement-breakpoint
ALTER TABLE "recipes" ADD COLUMN "is_public" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "recipes" ADD COLUMN "copied_from_recipe_id" uuid;--> statement-breakpoint
ALTER TABLE "recipe_checkins" ADD CONSTRAINT "recipe_checkins_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_checkins" ADD CONSTRAINT "recipe_checkins_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_checkins" ADD CONSTRAINT "recipe_checkins_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_checkins" ADD CONSTRAINT "recipe_checkins_updated_by_user_id_user_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_checkins_recipe_id" ON "recipe_checkins" USING btree ("recipe_id");--> statement-breakpoint
CREATE INDEX "idx_checkins_user_id" ON "recipe_checkins" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_checkins_created_at" ON "recipe_checkins" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_copied_from_recipe_id_recipes_id_fk" FOREIGN KEY ("copied_from_recipe_id") REFERENCES "public"."recipes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_recipes_is_public" ON "recipes" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "idx_recipes_type" ON "recipes" USING btree ("type");