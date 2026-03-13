import { mysqlTable, int, varchar, text, longtext, boolean, datetime, index, mysqlEnum, uniqueIndex, decimal } from 'drizzle-orm/mysql-core'
import { posts } from './posts'

// ==================== STUDENTS ====================
export const students = mysqlTable('students', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 100 }).notNull(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  avatar: varchar('avatar', { length: 500 }),
  bio: text('bio'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: datetime('created_at').notNull().$defaultFn(() => new Date()),
  updatedAt: datetime('updated_at').notNull().$defaultFn(() => new Date()),
}, (table) => [
  uniqueIndex('students_username_idx').on(table.username),
  uniqueIndex('students_email_idx').on(table.email),
])

// ==================== COURSES ====================
export const courses = mysqlTable('courses', {
  id: int('id').primaryKey().autoincrement(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  coverImage: varchar('cover_image', { length: 500 }),
  visibility: mysqlEnum('visibility', ['public', 'private']).notNull().default('public'),
  inviteCode: varchar('invite_code', { length: 50 }),
  maxStudents: int('max_students'),
  status: mysqlEnum('status', ['draft', 'active', 'archived']).notNull().default('draft'),
  createdAt: datetime('created_at').notNull().$defaultFn(() => new Date()),
  updatedAt: datetime('updated_at').notNull().$defaultFn(() => new Date()),
}, (table) => [
  uniqueIndex('courses_slug_idx').on(table.slug),
  index('courses_visibility_idx').on(table.visibility),
  index('courses_status_idx').on(table.status),
])

// ==================== ENROLLMENTS ====================
export const enrollments = mysqlTable('enrollments', {
  id: int('id').primaryKey().autoincrement(),
  courseId: int('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  studentId: int('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  role: mysqlEnum('role', ['student', 'instructor']).notNull().default('student'),
  progress: decimal('progress', { precision: 5, scale: 2 }).notNull().default('0'),
  enrolledAt: datetime('enrolled_at').notNull().$defaultFn(() => new Date()),
  completedAt: datetime('completed_at'),
}, (table) => [
  uniqueIndex('enrollment_unique_idx').on(table.courseId, table.studentId),
  index('enrollments_course_idx').on(table.courseId),
  index('enrollments_student_idx').on(table.studentId),
])

// ==================== COURSE MODULES (sections) ====================
export const courseModules = mysqlTable('course_modules', {
  id: int('id').primaryKey().autoincrement(),
  courseId: int('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  sortOrder: int('sort_order').notNull().default(0),
  createdAt: datetime('created_at').notNull().$defaultFn(() => new Date()),
}, (table) => [
  index('modules_course_idx').on(table.courseId),
])

// ==================== MATERIALS ====================
export const materials = mysqlTable('materials', {
  id: int('id').primaryKey().autoincrement(),
  moduleId: int('module_id').notNull().references(() => courseModules.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  type: mysqlEnum('type', ['content', 'post', 'video', 'file']).notNull().default('content'),
  body: longtext('body'),
  postId: int('post_id').references(() => posts.id, { onDelete: 'set null' }),
  videoUrl: varchar('video_url', { length: 500 }),
  fileUrl: varchar('file_url', { length: 500 }),
  duration: int('duration'), // estimated minutes
  sortOrder: int('sort_order').notNull().default(0),
  createdAt: datetime('created_at').notNull().$defaultFn(() => new Date()),
  updatedAt: datetime('updated_at').notNull().$defaultFn(() => new Date()),
}, (table) => [
  index('materials_module_idx').on(table.moduleId),
])

// ==================== MATERIAL PROGRESS ====================
export const materialProgress = mysqlTable('material_progress', {
  id: int('id').primaryKey().autoincrement(),
  materialId: int('material_id').notNull().references(() => materials.id, { onDelete: 'cascade' }),
  studentId: int('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  completed: boolean('completed').notNull().default(false),
  completedAt: datetime('completed_at'),
}, (table) => [
  uniqueIndex('material_progress_unique_idx').on(table.materialId, table.studentId),
])

// ==================== HOMEWORK / ASSIGNMENTS ====================
export const assignments = mysqlTable('assignments', {
  id: int('id').primaryKey().autoincrement(),
  moduleId: int('module_id').notNull().references(() => courseModules.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: longtext('description'),
  maxScore: int('max_score').notNull().default(100),
  dueDate: datetime('due_date'),
  allowLateSubmission: boolean('allow_late_submission').notNull().default(false),
  sortOrder: int('sort_order').notNull().default(0),
  createdAt: datetime('created_at').notNull().$defaultFn(() => new Date()),
}, (table) => [
  index('assignments_module_idx').on(table.moduleId),
])

// ==================== SUBMISSIONS ====================
export const submissions = mysqlTable('submissions', {
  id: int('id').primaryKey().autoincrement(),
  assignmentId: int('assignment_id').notNull().references(() => assignments.id, { onDelete: 'cascade' }),
  studentId: int('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  content: longtext('content'),
  fileUrl: varchar('file_url', { length: 500 }),
  score: decimal('score', { precision: 5, scale: 2 }),
  feedback: text('feedback'),
  status: mysqlEnum('status', ['submitted', 'graded', 'returned']).notNull().default('submitted'),
  submittedAt: datetime('submitted_at').notNull().$defaultFn(() => new Date()),
  gradedAt: datetime('graded_at'),
}, (table) => [
  index('submissions_assignment_idx').on(table.assignmentId),
  index('submissions_student_idx').on(table.studentId),
])

// ==================== EXAMS ====================
export const exams = mysqlTable('exams', {
  id: int('id').primaryKey().autoincrement(),
  moduleId: int('module_id').notNull().references(() => courseModules.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  duration: int('duration'), // in minutes, null = unlimited
  passingScore: int('passing_score').notNull().default(60),
  maxAttempts: int('max_attempts').notNull().default(1),
  shuffleQuestions: boolean('shuffle_questions').notNull().default(false),
  showResults: boolean('show_results').notNull().default(true),
  isActive: boolean('is_active').notNull().default(false),
  sortOrder: int('sort_order').notNull().default(0),
  createdAt: datetime('created_at').notNull().$defaultFn(() => new Date()),
}, (table) => [
  index('exams_module_idx').on(table.moduleId),
])

// ==================== EXAM QUESTIONS ====================
export const examQuestions = mysqlTable('exam_questions', {
  id: int('id').primaryKey().autoincrement(),
  examId: int('exam_id').notNull().references(() => exams.id, { onDelete: 'cascade' }),
  type: mysqlEnum('type', ['single', 'multiple']).notNull().default('single'),
  question: longtext('question').notNull(),
  // JSON array of { id, text, isCorrect }
  options: longtext('options').notNull(),
  explanation: text('explanation'),
  points: int('points').notNull().default(1),
  sortOrder: int('sort_order').notNull().default(0),
}, (table) => [
  index('questions_exam_idx').on(table.examId),
])

// ==================== EXAM ATTEMPTS ====================
export const examAttempts = mysqlTable('exam_attempts', {
  id: int('id').primaryKey().autoincrement(),
  examId: int('exam_id').notNull().references(() => exams.id, { onDelete: 'cascade' }),
  studentId: int('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  // JSON: { questionId: [selectedOptionIds] }
  answers: longtext('answers'),
  score: decimal('score', { precision: 5, scale: 2 }),
  totalPoints: int('total_points'),
  passed: boolean('passed'),
  startedAt: datetime('started_at').notNull().$defaultFn(() => new Date()),
  completedAt: datetime('completed_at'),
}, (table) => [
  index('attempts_exam_idx').on(table.examId),
  index('attempts_student_idx').on(table.studentId),
])

// ==================== DISCUSSIONS ====================
export const discussions = mysqlTable('discussions', {
  id: int('id').primaryKey().autoincrement(),
  materialId: int('material_id').notNull().references(() => materials.id, { onDelete: 'cascade' }),
  studentId: int('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  parentId: int('parent_id'),
  body: text('body').notNull(),
  isInstructor: boolean('is_instructor').notNull().default(false),
  createdAt: datetime('created_at').notNull().$defaultFn(() => new Date()),
  updatedAt: datetime('updated_at').notNull().$defaultFn(() => new Date()),
}, (table) => [
  index('discussions_material_idx').on(table.materialId),
  index('discussions_parent_idx').on(table.parentId),
])
