CREATE TYPE "public"."status" AS ENUM('awaiting pickup', 'picked up', 'archived');--> statement-breakpoint
CREATE TYPE "public"."type" AS ENUM('notification', 'reminder', 'extension');--> statement-breakpoint
CREATE TYPE "public"."month" AS ENUM('January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December');--> statement-breakpoint
CREATE TABLE "discs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(256),
	"phone" varchar(256) NOT NULL,
	"color" varchar(256),
	"brand" varchar(256),
	"plastic" varchar(256),
	"mold" varchar(256),
	"location" varchar(256),
	"notes" text,
	"notification_template" uuid,
	"notification_text" text NOT NULL,
	"reminder_template" uuid,
	"reminder_text" text NOT NULL,
	"extension_template" uuid,
	"extension_text" text NOT NULL,
	"notified" boolean DEFAULT false NOT NULL,
	"reminded" boolean DEFAULT false NOT NULL,
	"status" "status" DEFAULT 'awaiting pickup' NOT NULL,
	"held_until" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "type" NOT NULL,
	"name" varchar(256) NOT NULL,
	"content" text NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trends" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"month" "month" NOT NULL,
	"year" integer NOT NULL,
	"found" integer NOT NULL,
	"returned" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"name" varchar(256) NOT NULL,
	"laf" varchar(256) NOT NULL,
	"hold_duration" integer DEFAULT 60 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "discs" ADD CONSTRAINT "discs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discs" ADD CONSTRAINT "discs_notification_template_templates_id_fk" FOREIGN KEY ("notification_template") REFERENCES "public"."templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discs" ADD CONSTRAINT "discs_reminder_template_templates_id_fk" FOREIGN KEY ("reminder_template") REFERENCES "public"."templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discs" ADD CONSTRAINT "discs_extension_template_templates_id_fk" FOREIGN KEY ("extension_template") REFERENCES "public"."templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "templates" ADD CONSTRAINT "templates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trends" ADD CONSTRAINT "trends_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;