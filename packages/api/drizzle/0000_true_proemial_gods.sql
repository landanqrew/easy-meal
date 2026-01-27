CREATE TYPE "public"."grocery_list_status" AS ENUM('active', 'completed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."ingredient_category" AS ENUM('produce', 'dairy', 'meat', 'seafood', 'pantry', 'frozen', 'bakery', 'beverages', 'other');--> statement-breakpoint
CREATE TYPE "public"."recipe_source" AS ENUM('ai_generated', 'manual', 'imported');--> statement-breakpoint
CREATE TABLE "grocery_list_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"grocery_list_id" uuid NOT NULL,
	"ingredient_id" uuid NOT NULL,
	"quantity" numeric(10, 3) NOT NULL,
	"unit" varchar(50) NOT NULL,
	"is_checked" boolean DEFAULT false NOT NULL,
	"recipe_id" uuid,
	"original_servings" integer,
	"scaled_servings" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_user_id" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by_user_id" text
);
--> statement-breakpoint
CREATE TABLE "grocery_lists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"status" "grocery_list_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_user_id" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by_user_id" text
);
--> statement-breakpoint
CREATE TABLE "households" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"invite_code" varchar(20) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_user_id" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by_user_id" uuid,
	CONSTRAINT "households_invite_code_unique" UNIQUE("invite_code")
);
--> statement-breakpoint
CREATE TABLE "ingredients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"category" "ingredient_category" DEFAULT 'other' NOT NULL,
	"default_unit" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_user_id" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by_user_id" text,
	CONSTRAINT "ingredients_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "recipe_ingredients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipe_id" uuid NOT NULL,
	"ingredient_id" uuid NOT NULL,
	"quantity" numeric(10, 3) NOT NULL,
	"unit" varchar(50) NOT NULL,
	"preparation" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_user_id" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by_user_id" text,
	CONSTRAINT "unique_recipe_ingredient" UNIQUE("recipe_id","ingredient_id")
);
--> statement-breakpoint
CREATE TABLE "recipe_list_items" (
	"recipe_list_id" uuid NOT NULL,
	"recipe_id" uuid NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_user_id" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by_user_id" text,
	CONSTRAINT "recipe_list_items_recipe_list_id_recipe_id_pk" PRIMARY KEY("recipe_list_id","recipe_id")
);
--> statement-breakpoint
CREATE TABLE "recipe_lists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"household_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_user_id" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by_user_id" text
);
--> statement-breakpoint
CREATE TABLE "recipe_tags" (
	"recipe_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_user_id" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by_user_id" text,
	CONSTRAINT "recipe_tags_recipe_id_tag_id_pk" PRIMARY KEY("recipe_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "recipes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"servings" integer DEFAULT 4 NOT NULL,
	"instructions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"cuisine" varchar(100),
	"prep_time" integer,
	"cook_time" integer,
	"source" "recipe_source" DEFAULT 'manual' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_user_id" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by_user_id" text
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"household_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"color" varchar(7),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_user_id" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by_user_id" text,
	CONSTRAINT "unique_tag_per_household" UNIQUE("household_id","name")
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"household_id" text,
	"dietary_restrictions" text DEFAULT '[]',
	"preferences" text DEFAULT '{}',
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "grocery_list_items" ADD CONSTRAINT "grocery_list_items_grocery_list_id_grocery_lists_id_fk" FOREIGN KEY ("grocery_list_id") REFERENCES "public"."grocery_lists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grocery_list_items" ADD CONSTRAINT "grocery_list_items_ingredient_id_ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grocery_list_items" ADD CONSTRAINT "grocery_list_items_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grocery_list_items" ADD CONSTRAINT "grocery_list_items_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grocery_list_items" ADD CONSTRAINT "grocery_list_items_updated_by_user_id_user_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grocery_lists" ADD CONSTRAINT "grocery_lists_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grocery_lists" ADD CONSTRAINT "grocery_lists_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grocery_lists" ADD CONSTRAINT "grocery_lists_updated_by_user_id_user_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingredients" ADD CONSTRAINT "ingredients_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingredients" ADD CONSTRAINT "ingredients_updated_by_user_id_user_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_ingredient_id_ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_updated_by_user_id_user_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_list_items" ADD CONSTRAINT "recipe_list_items_recipe_list_id_recipe_lists_id_fk" FOREIGN KEY ("recipe_list_id") REFERENCES "public"."recipe_lists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_list_items" ADD CONSTRAINT "recipe_list_items_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_list_items" ADD CONSTRAINT "recipe_list_items_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_list_items" ADD CONSTRAINT "recipe_list_items_updated_by_user_id_user_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_lists" ADD CONSTRAINT "recipe_lists_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_lists" ADD CONSTRAINT "recipe_lists_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_lists" ADD CONSTRAINT "recipe_lists_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_lists" ADD CONSTRAINT "recipe_lists_updated_by_user_id_user_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_tags" ADD CONSTRAINT "recipe_tags_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_tags" ADD CONSTRAINT "recipe_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_tags" ADD CONSTRAINT "recipe_tags_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_tags" ADD CONSTRAINT "recipe_tags_updated_by_user_id_user_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_updated_by_user_id_user_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_household_id_households_id_fk" FOREIGN KEY ("household_id") REFERENCES "public"."households"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_updated_by_user_id_user_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_grocery_list_items_grocery_list_id" ON "grocery_list_items" USING btree ("grocery_list_id");--> statement-breakpoint
CREATE INDEX "idx_grocery_list_items_ingredient_id" ON "grocery_list_items" USING btree ("ingredient_id");--> statement-breakpoint
CREATE INDEX "idx_grocery_list_items_is_checked" ON "grocery_list_items" USING btree ("is_checked");--> statement-breakpoint
CREATE INDEX "idx_grocery_lists_household_id" ON "grocery_lists" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "idx_grocery_lists_status" ON "grocery_lists" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_grocery_lists_created_at" ON "grocery_lists" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_households_invite_code" ON "households" USING btree ("invite_code");--> statement-breakpoint
CREATE INDEX "idx_ingredients_name" ON "ingredients" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_ingredients_category" ON "ingredients" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_recipe_ingredients_recipe_id" ON "recipe_ingredients" USING btree ("recipe_id");--> statement-breakpoint
CREATE INDEX "idx_recipe_ingredients_ingredient_id" ON "recipe_ingredients" USING btree ("ingredient_id");--> statement-breakpoint
CREATE INDEX "idx_recipe_list_items_recipe_id" ON "recipe_list_items" USING btree ("recipe_id");--> statement-breakpoint
CREATE INDEX "idx_recipe_lists_user_id" ON "recipe_lists" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_recipe_lists_household_id" ON "recipe_lists" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "idx_recipe_tags_tag_id" ON "recipe_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "idx_recipes_household_id" ON "recipes" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "idx_recipes_cuisine" ON "recipes" USING btree ("cuisine");--> statement-breakpoint
CREATE INDEX "idx_recipes_source" ON "recipes" USING btree ("source");--> statement-breakpoint
CREATE INDEX "idx_recipes_created_at" ON "recipes" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_tags_household_id" ON "tags" USING btree ("household_id");--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");