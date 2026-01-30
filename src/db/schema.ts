import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  pgEnum,
  jsonb,
} from 'drizzle-orm/pg-core';

export const projectTypeEnum = pgEnum('project_type', [
  'ROOT',
  'NOTE',
  'MERMAID',
  'QA',
  'FILE',
  'GITHUB',
  'FAQ',
  'MEMBER',
]);

export const userRoleEnum = pgEnum('user_role', ['ADMIN', 'USER']);

export const contentTypeEnum = pgEnum('content_type', [
  'NOTE',
  'MERMAID',
  'QA',
  'FIGMA',
]);

export const projectCategories = pgTable('project_categories', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  projectType: projectTypeEnum('project_type').default('NOTE').notNull(),
  techType: varchar('tech_type', { length: 50 }),
  description: text('description'),
  parentId: integer('parent_id'),
  displayOrder: integer('display_order').default(0).notNull(),
  depth: integer('depth').default(0).notNull(),
  icon: varchar('icon', { length: 100 }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const projectContents = pgTable('project_contents', {
  id: serial('id').primaryKey(),
  categoryId: integer('category_id').notNull(),
  userId: integer('user_id').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content'),
  contentType: contentTypeEnum('content_type').default('NOTE').notNull(),
  metadata: jsonb('metadata'),
  displayOrder: integer('display_order').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// File type enum
export const fileTypeEnum = pgEnum('file_type', [
  'PDF',
  'DOCX',
  'XLSX',
  'TXT',
  'IMAGE',
  'VIDEO',
  'AUDIO',
  'OTHER',
]);

// Category files table
export const projectCategoryFiles = pgTable('project_category_files', {
  id: serial('id').primaryKey(),
  categoryId: integer('category_id').notNull(),
  userId: integer('user_id').notNull(),
  originalName: varchar('original_name', { length: 255 }).notNull(),
  storedName: varchar('stored_name', { length: 255 }).notNull(),
  s3Url: text('s3_url').notNull(),
  filePath: text('file_path').notNull(),
  fileSize: integer('file_size').notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  fileType: fileTypeEnum('file_type').default('OTHER').notNull(),
  displayOrder: integer('display_order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Note type enum
export const noteTypeEnum = pgEnum('note_type', [
  'ROOT',
  'NOTE',
  'MERMAID',
  'QA',
  'FILE',
]);

// Note categories table (개인 노트)
export const noteCategories = pgTable('note_categories', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  noteType: noteTypeEnum('note_type').default('NOTE').notNull(),
  description: text('description'),
  parentId: integer('parent_id'),
  displayOrder: integer('display_order').default(0).notNull(),
  depth: integer('depth').default(0).notNull(),
  icon: varchar('icon', { length: 100 }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Note contents table
export const noteContents = pgTable('note_contents', {
  id: serial('id').primaryKey(),
  categoryId: integer('category_id').notNull(),
  userId: integer('user_id').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content'),
  contentType: contentTypeEnum('content_type').default('NOTE').notNull(),
  metadata: jsonb('metadata'),
  displayOrder: integer('display_order').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Note files table
export const noteCategoryFiles = pgTable('note_category_files', {
  id: serial('id').primaryKey(),
  categoryId: integer('category_id').notNull(),
  userId: integer('user_id').notNull(),
  originalName: varchar('original_name', { length: 255 }).notNull(),
  storedName: varchar('stored_name', { length: 255 }).notNull(),
  s3Url: text('s3_url').notNull(),
  filePath: text('file_path').notNull(),
  fileSize: integer('file_size').notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  fileType: fileTypeEnum('file_type').default('OTHER').notNull(),
  displayOrder: integer('display_order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type NoteCategory = typeof noteCategories.$inferSelect;
export type NewNoteCategory = typeof noteCategories.$inferInsert;
export type NoteContent = typeof noteContents.$inferSelect;
export type NewNoteContent = typeof noteContents.$inferInsert;
export type NoteCategoryFile = typeof noteCategoryFiles.$inferSelect;
export type NewNoteCategoryFile = typeof noteCategoryFiles.$inferInsert;

// Departments table (부서/조직도)
export const departments = pgTable('departments', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  parentId: integer('parent_id'),
  displayOrder: integer('display_order').default(0).notNull(),
  depth: integer('depth').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Department = typeof departments.$inferSelect;
export type NewDepartment = typeof departments.$inferInsert;

// Posts table (게시판)
export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  authorId: integer('author_id').notNull(),
  viewCount: integer('view_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type ProjectCategory = typeof projectCategories.$inferSelect;
export type NewProjectCategory = typeof projectCategories.$inferInsert;
export type ProjectContent = typeof projectContents.$inferSelect;
export type NewProjectContent = typeof projectContents.$inferInsert;
export type ProjectCategoryFile = typeof projectCategoryFiles.$inferSelect;
export type NewProjectCategoryFile = typeof projectCategoryFiles.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  name: varchar('name', { length: 100 }),
  profileImage: text('profile_image'),
  role: userRoleEnum('role').default('USER').notNull(),
  departmentId: integer('department_id'),
  displayOrder: integer('display_order').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
