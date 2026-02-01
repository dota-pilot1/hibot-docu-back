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

export const architectureTypeEnum = pgEnum('architecture_type', [
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

export const architectureCategories = pgTable('architecture_categories', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  architectureType: architectureTypeEnum('architecture_type')
    .default('NOTE')
    .notNull(),
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

export const architectureContents = pgTable('architecture_contents', {
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
export const architectureCategoryFiles = pgTable(
  'architecture_category_files',
  {
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
  },
);

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

export type ArchitectureCategory = typeof architectureCategories.$inferSelect;
export type NewArchitectureCategory =
  typeof architectureCategories.$inferInsert;
export type ArchitectureContent = typeof architectureContents.$inferSelect;
export type NewArchitectureContent = typeof architectureContents.$inferInsert;
export type ArchitectureCategoryFile =
  typeof architectureCategoryFiles.$inferSelect;
export type NewArchitectureCategoryFile =
  typeof architectureCategoryFiles.$inferInsert;
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

// Document folders table (문서 폴더)
export const documentFolders = pgTable('document_folders', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  displayOrder: integer('display_order').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type DocumentFolder = typeof documentFolders.$inferSelect;
export type NewDocumentFolder = typeof documentFolders.$inferInsert;

// Documents table (문서)
export const documents = pgTable('documents', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 200 }).notNull(),
  content: text('content').default(''),
  folderId: integer('folder_id'),
  createdBy: integer('created_by'),
  updatedBy: integer('updated_by'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;

// Chat projects table (채팅 프로젝트 - 폴더 역할)
export const chatProjects = pgTable('chat_projects', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  displayOrder: integer('display_order').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type ChatProject = typeof chatProjects.$inferSelect;
export type NewChatProject = typeof chatProjects.$inferInsert;

// Chat teams table (채팅 팀 - 채팅방 역할)
export const chatTeams = pgTable('chat_teams', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  projectId: integer('project_id'),
  createdBy: integer('created_by'),
  displayOrder: integer('display_order').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type ChatTeam = typeof chatTeams.$inferSelect;
export type NewChatTeam = typeof chatTeams.$inferInsert;

// Chat room type enum
export const chatRoomTypeEnum = pgEnum('chat_room_type', [
  'GENERAL',
  'AI_ENABLED',
]);

// Chat message type enum
export const chatMessageTypeEnum = pgEnum('chat_message_type', [
  'CHAT',
  'SYSTEM',
  'AI',
]);

// Chat rooms table (채팅방)
export const chatRooms = pgTable('chat_rooms', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id').notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  roomType: chatRoomTypeEnum('room_type').default('GENERAL').notNull(),
  maxParticipants: integer('max_participants').default(50).notNull(),
  createdBy: integer('created_by'),
  displayOrder: integer('display_order').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type ChatRoom = typeof chatRooms.$inferSelect;
export type NewChatRoom = typeof chatRooms.$inferInsert;

// Chat room participants table (채팅방 참여자)
export const chatRoomParticipants = pgTable(
  'chat_room_participants',
  {
    id: serial('id').primaryKey(),
    roomId: integer('room_id').notNull(),
    userId: integer('user_id').notNull(),
    joinedAt: timestamp('joined_at').defaultNow().notNull(),
    lastReadAt: timestamp('last_read_at'),
    isActive: boolean('is_active').default(true).notNull(),
  },
  (table) => ({
    // roomId + userId unique constraint로 중복 참여 방지
    uniqueRoomUser: { columns: [table.roomId, table.userId], unique: true },
  }),
);

export type ChatRoomParticipant = typeof chatRoomParticipants.$inferSelect;
export type NewChatRoomParticipant = typeof chatRoomParticipants.$inferInsert;

// Chat messages table (채팅 메시지)
export const chatMessages = pgTable('chat_messages', {
  id: serial('id').primaryKey(),
  roomId: integer('room_id').notNull(),
  userId: integer('user_id').notNull(),
  messageType: chatMessageTypeEnum('message_type').default('CHAT').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type NewChatMessage = typeof chatMessages.$inferInsert;
