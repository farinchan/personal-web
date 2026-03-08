CREATE TABLE `backup_jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`provider` enum('google_drive','onedrive') NOT NULL,
	`client_id` varchar(500) NOT NULL,
	`client_secret` varchar(500) NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`token_expiry` datetime,
	`folder_id` varchar(500),
	`backup_type` enum('database','files','full') NOT NULL DEFAULT 'full',
	`schedule` enum('disabled','daily','weekly','monthly') NOT NULL DEFAULT 'disabled',
	`enabled` boolean NOT NULL DEFAULT true,
	`last_backup_at` datetime,
	`last_backup_status` text,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `backup_jobs_id` PRIMARY KEY(`id`)
);
