CREATE TABLE `admin_users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`username` varchar(50) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	CONSTRAINT `admin_users_id` PRIMARY KEY(`id`),
	CONSTRAINT `admin_users_username_unique` UNIQUE(`username`)
);
--> statement-breakpoint
CREATE TABLE `comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`post_id` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`email` varchar(255),
	`body` text NOT NULL,
	`status` enum('pending','approved') NOT NULL DEFAULT 'pending',
	`created_at` datetime NOT NULL,
	CONSTRAINT `comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cv_sections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` varchar(50) NOT NULL,
	`title` varchar(255) NOT NULL,
	`body` text NOT NULL,
	`sort_order` int NOT NULL DEFAULT 0,
	CONSTRAINT `cv_sections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`email` varchar(255) NOT NULL,
	`subject` varchar(255) NOT NULL,
	`body` text NOT NULL,
	`status` enum('unread','read') NOT NULL DEFAULT 'unread',
	`ip_hash` varchar(64) NOT NULL,
	`created_at` datetime NOT NULL,
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `post_likes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`post_id` int NOT NULL,
	`voter_hash` varchar(64) NOT NULL,
	`created_at` datetime NOT NULL,
	CONSTRAINT `post_likes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `post_tags` (
	`post_id` int NOT NULL,
	`tag_id` int NOT NULL,
	CONSTRAINT `post_tags_post_id_tag_id_pk` PRIMARY KEY(`post_id`,`tag_id`)
);
--> statement-breakpoint
CREATE TABLE `posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(255) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`body` text NOT NULL,
	`cover_image` varchar(500),
	`is_draft` boolean NOT NULL DEFAULT true,
	`view_count` int NOT NULL DEFAULT 0,
	`share_count` int NOT NULL DEFAULT 0,
	`published_at` datetime,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `posts_id` PRIMARY KEY(`id`),
	CONSTRAINT `posts_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `profile` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`avatar_url` varchar(500),
	`bio` text,
	`github` varchar(255),
	`linkedin` varchar(255),
	`twitter` varchar(255),
	`website` varchar(255),
	CONSTRAINT `profile_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`slug` varchar(100) NOT NULL,
	CONSTRAINT `tags_id` PRIMARY KEY(`id`),
	CONSTRAINT `tags_name_unique` UNIQUE(`name`),
	CONSTRAINT `tags_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
ALTER TABLE `comments` ADD CONSTRAINT `comments_post_id_posts_id_fk` FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `post_likes` ADD CONSTRAINT `post_likes_post_id_posts_id_fk` FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `post_tags` ADD CONSTRAINT `post_tags_post_id_posts_id_fk` FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `post_tags` ADD CONSTRAINT `post_tags_tag_id_tags_id_fk` FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `post_id_idx` ON `comments` (`post_id`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `comments` (`status`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `messages` (`status`);--> statement-breakpoint
CREATE INDEX `ip_hash_idx` ON `messages` (`ip_hash`);--> statement-breakpoint
CREATE INDEX `post_id_idx` ON `post_likes` (`post_id`);--> statement-breakpoint
CREATE INDEX `voter_hash_idx` ON `post_likes` (`voter_hash`);--> statement-breakpoint
CREATE INDEX `post_id_idx` ON `post_tags` (`post_id`);--> statement-breakpoint
CREATE INDEX `tag_id_idx` ON `post_tags` (`tag_id`);--> statement-breakpoint
CREATE INDEX `slug_idx` ON `posts` (`slug`);--> statement-breakpoint
CREATE INDEX `published_at_idx` ON `posts` (`published_at`);