ALTER TABLE `comments` ADD `parent_id` int;--> statement-breakpoint
ALTER TABLE `comments` ADD `is_admin` int DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX `parent_id_idx` ON `comments` (`parent_id`);