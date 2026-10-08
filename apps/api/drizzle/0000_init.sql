CREATE TABLE `assessments` (
	`id` text PRIMARY KEY NOT NULL,
	`member_id` text NOT NULL,
	`date` text NOT NULL,
	`scores` text NOT NULL,
	`goal` text DEFAULT '' NOT NULL,
	`personal_axis` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `assessments_member_date_idx` ON `assessments` (`member_id`,`date`);--> statement-breakpoint
CREATE TABLE `member_skills` (
	`member_id` text NOT NULL,
	`skill_id` text NOT NULL,
	`level` integer DEFAULT 0 NOT NULL,
	`in_training` integer DEFAULT false NOT NULL,
	PRIMARY KEY(`member_id`, `skill_id`),
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`skill_id`) REFERENCES `skills`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `members` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`role` text DEFAULT '' NOT NULL,
	`start_date` text,
	`release_date` text,
	`notes` text DEFAULT '' NOT NULL,
	`personal_axis` text DEFAULT '' NOT NULL,
	`is_example` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `skills` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`name_key` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `skills_name_key_unique` ON `skills` (`name_key`);