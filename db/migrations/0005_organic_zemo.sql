CREATE TABLE `assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`module_id` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` longtext,
	`max_score` int NOT NULL DEFAULT 100,
	`due_date` datetime,
	`allow_late_submission` boolean NOT NULL DEFAULT false,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` datetime NOT NULL,
	CONSTRAINT `assignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `course_modules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`course_id` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` datetime NOT NULL,
	CONSTRAINT `course_modules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `courses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(255) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`cover_image` varchar(500),
	`visibility` enum('public','private') NOT NULL DEFAULT 'public',
	`invite_code` varchar(50),
	`max_students` int,
	`status` enum('draft','active','archived') NOT NULL DEFAULT 'draft',
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `courses_id` PRIMARY KEY(`id`),
	CONSTRAINT `courses_slug_unique` UNIQUE(`slug`),
	CONSTRAINT `courses_slug_idx` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `discussions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`material_id` int NOT NULL,
	`student_id` int NOT NULL,
	`parent_id` int,
	`body` text NOT NULL,
	`is_instructor` boolean NOT NULL DEFAULT false,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `discussions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `enrollments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`course_id` int NOT NULL,
	`student_id` int NOT NULL,
	`role` enum('student','instructor') NOT NULL DEFAULT 'student',
	`progress` decimal(5,2) NOT NULL DEFAULT '0',
	`enrolled_at` datetime NOT NULL,
	`completed_at` datetime,
	CONSTRAINT `enrollments_id` PRIMARY KEY(`id`),
	CONSTRAINT `enrollment_unique_idx` UNIQUE(`course_id`,`student_id`)
);
--> statement-breakpoint
CREATE TABLE `exam_attempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`exam_id` int NOT NULL,
	`student_id` int NOT NULL,
	`answers` longtext,
	`score` decimal(5,2),
	`total_points` int,
	`passed` boolean,
	`started_at` datetime NOT NULL,
	`completed_at` datetime,
	CONSTRAINT `exam_attempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `exam_questions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`exam_id` int NOT NULL,
	`type` enum('single','multiple') NOT NULL DEFAULT 'single',
	`question` longtext NOT NULL,
	`options` longtext NOT NULL,
	`explanation` text,
	`points` int NOT NULL DEFAULT 1,
	`sort_order` int NOT NULL DEFAULT 0,
	CONSTRAINT `exam_questions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `exams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`module_id` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`duration` int,
	`passing_score` int NOT NULL DEFAULT 60,
	`max_attempts` int NOT NULL DEFAULT 1,
	`shuffle_questions` boolean NOT NULL DEFAULT false,
	`show_results` boolean NOT NULL DEFAULT true,
	`is_active` boolean NOT NULL DEFAULT false,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` datetime NOT NULL,
	CONSTRAINT `exams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `material_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`material_id` int NOT NULL,
	`student_id` int NOT NULL,
	`completed` boolean NOT NULL DEFAULT false,
	`completed_at` datetime,
	CONSTRAINT `material_progress_id` PRIMARY KEY(`id`),
	CONSTRAINT `material_progress_unique_idx` UNIQUE(`material_id`,`student_id`)
);
--> statement-breakpoint
CREATE TABLE `materials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`module_id` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`type` enum('content','post','video','file') NOT NULL DEFAULT 'content',
	`body` longtext,
	`post_id` int,
	`video_url` varchar(500),
	`file_url` varchar(500),
	`duration` int,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `materials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `students` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`username` varchar(50) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`avatar` varchar(500),
	`bio` text,
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `students_id` PRIMARY KEY(`id`),
	CONSTRAINT `students_username_unique` UNIQUE(`username`),
	CONSTRAINT `students_email_unique` UNIQUE(`email`),
	CONSTRAINT `students_username_idx` UNIQUE(`username`),
	CONSTRAINT `students_email_idx` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `submissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assignment_id` int NOT NULL,
	`student_id` int NOT NULL,
	`content` longtext,
	`file_url` varchar(500),
	`score` decimal(5,2),
	`feedback` text,
	`status` enum('submitted','graded','returned') NOT NULL DEFAULT 'submitted',
	`submitted_at` datetime NOT NULL,
	`graded_at` datetime,
	CONSTRAINT `submissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `assignments` ADD CONSTRAINT `assignments_module_id_course_modules_id_fk` FOREIGN KEY (`module_id`) REFERENCES `course_modules`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `course_modules` ADD CONSTRAINT `course_modules_course_id_courses_id_fk` FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `discussions` ADD CONSTRAINT `discussions_material_id_materials_id_fk` FOREIGN KEY (`material_id`) REFERENCES `materials`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `discussions` ADD CONSTRAINT `discussions_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `enrollments` ADD CONSTRAINT `enrollments_course_id_courses_id_fk` FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `enrollments` ADD CONSTRAINT `enrollments_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `exam_attempts` ADD CONSTRAINT `exam_attempts_exam_id_exams_id_fk` FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `exam_attempts` ADD CONSTRAINT `exam_attempts_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `exam_questions` ADD CONSTRAINT `exam_questions_exam_id_exams_id_fk` FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `exams` ADD CONSTRAINT `exams_module_id_course_modules_id_fk` FOREIGN KEY (`module_id`) REFERENCES `course_modules`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `material_progress` ADD CONSTRAINT `material_progress_material_id_materials_id_fk` FOREIGN KEY (`material_id`) REFERENCES `materials`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `material_progress` ADD CONSTRAINT `material_progress_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `materials` ADD CONSTRAINT `materials_module_id_course_modules_id_fk` FOREIGN KEY (`module_id`) REFERENCES `course_modules`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `materials` ADD CONSTRAINT `materials_post_id_posts_id_fk` FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `submissions` ADD CONSTRAINT `submissions_assignment_id_assignments_id_fk` FOREIGN KEY (`assignment_id`) REFERENCES `assignments`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `submissions` ADD CONSTRAINT `submissions_student_id_students_id_fk` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `assignments_module_idx` ON `assignments` (`module_id`);--> statement-breakpoint
CREATE INDEX `modules_course_idx` ON `course_modules` (`course_id`);--> statement-breakpoint
CREATE INDEX `courses_visibility_idx` ON `courses` (`visibility`);--> statement-breakpoint
CREATE INDEX `courses_status_idx` ON `courses` (`status`);--> statement-breakpoint
CREATE INDEX `discussions_material_idx` ON `discussions` (`material_id`);--> statement-breakpoint
CREATE INDEX `discussions_parent_idx` ON `discussions` (`parent_id`);--> statement-breakpoint
CREATE INDEX `enrollments_course_idx` ON `enrollments` (`course_id`);--> statement-breakpoint
CREATE INDEX `enrollments_student_idx` ON `enrollments` (`student_id`);--> statement-breakpoint
CREATE INDEX `attempts_exam_idx` ON `exam_attempts` (`exam_id`);--> statement-breakpoint
CREATE INDEX `attempts_student_idx` ON `exam_attempts` (`student_id`);--> statement-breakpoint
CREATE INDEX `questions_exam_idx` ON `exam_questions` (`exam_id`);--> statement-breakpoint
CREATE INDEX `exams_module_idx` ON `exams` (`module_id`);--> statement-breakpoint
CREATE INDEX `materials_module_idx` ON `materials` (`module_id`);--> statement-breakpoint
CREATE INDEX `submissions_assignment_idx` ON `submissions` (`assignment_id`);--> statement-breakpoint
CREATE INDEX `submissions_student_idx` ON `submissions` (`student_id`);