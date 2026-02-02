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
import { sql } from 'drizzle-orm';

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

// ============================================
// Task Management (업무 관리)
// ============================================

// Task 상태 enum
// - 주요 상태 3개: pending, in_progress, completed (UI 전면 노출)
// - 보조 상태 2개: blocked, review (아이콘/뱃지로만 표시)
export const taskStatusEnum = pgEnum('task_status', [
  'pending', // 대기 (주요)
  'in_progress', // 진행중 (주요)
  'completed', // 완료 (주요)
  'blocked', // 막힘 (보조)
  'review', // 리뷰중 (보조)
]);

// Task 우선순위 enum
export const taskPriorityEnum = pgEnum('task_priority', [
  'low',
  'medium',
  'high',
]);

// Task 활동 타입 enum
export const taskActivityTypeEnum = pgEnum('task_activity_type', [
  'created', // Task 생성
  'updated', // Task 수정
  'completed', // Task 완료
  'commented', // 코멘트 추가
  'status_changed', // 상태 변경
]);

// Tasks table (업무)
export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  status: taskStatusEnum('status').default('pending').notNull(),
  priority: taskPriorityEnum('priority').default('medium').notNull(),
  assigneeId: integer('assignee_id'),
  isCurrent: boolean('is_current').default(false).notNull(),
  dueDate: timestamp('due_date'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;

// Task activities table (활동 로그)
export const taskActivities = pgTable('task_activities', {
  id: serial('id').primaryKey(),
  taskId: integer('task_id').notNull(),
  userId: integer('user_id').notNull(),
  type: taskActivityTypeEnum('type').notNull(),
  description: text('description').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type TaskActivity = typeof taskActivities.$inferSelect;
export type NewTaskActivity = typeof taskActivities.$inferInsert;

// User memos table (개인 메모)
export const userMemos = pgTable('user_memos', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().unique(),
  memo: text('memo'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  updatedBy: integer('updated_by'),
});

export type UserMemo = typeof userMemos.$inferSelect;
export type NewUserMemo = typeof userMemos.$inferInsert;

// Task issues table (업무 이슈/댓글)
export const taskIssues = pgTable('task_issues', {
  id: serial('id').primaryKey(),
  taskId: integer('task_id').notNull(),
  userId: integer('user_id').notNull(),
  content: text('content').notNull(),
  isResolved: boolean('is_resolved').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type TaskIssue = typeof taskIssues.$inferSelect;
export type NewTaskIssue = typeof taskIssues.$inferInsert;

// Task issue replies table (이슈 답변/대댓글)
export const taskIssueReplies = pgTable('task_issue_replies', {
  id: serial('id').primaryKey(),
  issueId: integer('issue_id').notNull(),
  parentId: integer('parent_id'), // 대댓글인 경우 부모 답변 ID
  userId: integer('user_id').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type TaskIssueReply = typeof taskIssueReplies.$inferSelect;
export type NewTaskIssueReply = typeof taskIssueReplies.$inferInsert;

// ============================================
// Task Details (업무 상세)
// ============================================

// Task details table (업무 상세 정보)
export const taskDetails = pgTable('task_details', {
  id: serial('id').primaryKey(),
  taskId: integer('task_id')
    .notNull()
    .unique()
    .references(() => tasks.id, { onDelete: 'cascade' }),

  // 상세 설명 (Markdown)
  description: text('description').default(''),

  // 피그마 링크
  figmaUrl: text('figma_url'),
  figmaEmbedKey: varchar('figma_embed_key', { length: 255 }),

  // 메타 정보
  estimatedHours: varchar('estimated_hours', { length: 10 }), // decimal을 varchar로 저장
  actualHours: varchar('actual_hours', { length: 10 }),
  difficulty: varchar('difficulty', { length: 20 }), // 'easy', 'medium', 'hard'
  progress: integer('progress').default(0), // 0-100

  // 태그 및 라벨
  tags: jsonb('tags').default(sql`'[]'::jsonb`),

  // 체크리스트
  checklist: jsonb('checklist').default(sql`'[]'::jsonb`),

  // 관련 링크
  links: jsonb('links').default(sql`'[]'::jsonb`),

  // 메타
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  updatedBy: integer('updated_by').references(() => users.id),
});

export type TaskDetail = typeof taskDetails.$inferSelect;
export type NewTaskDetail = typeof taskDetails.$inferInsert;

// Task detail images table (업무 상세 이미지)
export const taskDetailImages = pgTable('task_detail_images', {
  id: serial('id').primaryKey(),
  taskDetailId: integer('task_detail_id')
    .notNull()
    .references(() => taskDetails.id, { onDelete: 'cascade' }),

  // 파일 정보
  originalName: varchar('original_name', { length: 255 }).notNull(),
  storedName: varchar('stored_name', { length: 255 }).notNull(),
  s3Url: text('s3_url').notNull(),
  filePath: text('file_path').notNull(),

  fileSize: integer('file_size').notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  width: integer('width'),
  height: integer('height'),

  // 이미지 설명
  caption: text('caption'),
  altText: varchar('alt_text', { length: 255 }),

  // 순서
  displayOrder: integer('display_order').default(0).notNull(),

  // 메타
  createdAt: timestamp('created_at').defaultNow().notNull(),
  uploadedBy: integer('uploaded_by').references(() => users.id),
});

export type TaskDetailImage = typeof taskDetailImages.$inferSelect;
export type NewTaskDetailImage = typeof taskDetailImages.$inferInsert;

// Task detail attachments table (업무 상세 첨부파일)
export const taskDetailAttachments = pgTable('task_detail_attachments', {
  id: serial('id').primaryKey(),
  taskDetailId: integer('task_detail_id')
    .notNull()
    .references(() => taskDetails.id, { onDelete: 'cascade' }),

  // 파일 정보
  originalName: varchar('original_name', { length: 255 }).notNull(),
  storedName: varchar('stored_name', { length: 255 }).notNull(),
  s3Url: text('s3_url').notNull(),
  filePath: text('file_path').notNull(),

  fileSize: integer('file_size').notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  fileType: varchar('file_type', { length: 50 }),

  // 설명
  description: text('description'),
  displayOrder: integer('display_order').default(0).notNull(),

  // 메타
  createdAt: timestamp('created_at').defaultNow().notNull(),
  uploadedBy: integer('uploaded_by').references(() => users.id),
});

export type TaskDetailAttachment = typeof taskDetailAttachments.$inferSelect;
export type NewTaskDetailAttachment = typeof taskDetailAttachments.$inferInsert;

// ============================================
// Pilot Management (파일럿 프로젝트 관리)
// ============================================

// Pilot type enum
export const pilotTypeEnum = pgEnum('pilot_type', [
  'ROOT',
  'NOTE',
  'MERMAID',
  'QA',
  'FILE',
]);

// Pilot categories table (파일럿 프로젝트 카테고리)
export const pilotCategories = pgTable('pilot_categories', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  pilotType: pilotTypeEnum('pilot_type').default('NOTE').notNull(),
  projectType: varchar('project_type', { length: 50 }),
  description: text('description'),
  parentId: integer('parent_id'),
  displayOrder: integer('display_order').default(0).notNull(),
  depth: integer('depth').default(0).notNull(),
  icon: varchar('icon', { length: 100 }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type PilotCategory = typeof pilotCategories.$inferSelect;
export type NewPilotCategory = typeof pilotCategories.$inferInsert;

// Pilot contents table (파일럿 프로젝트 컨텐츠)
export const pilotContents = pgTable('pilot_contents', {
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

export type PilotContent = typeof pilotContents.$inferSelect;
export type NewPilotContent = typeof pilotContents.$inferInsert;

// Pilot category files table (파일럿 프로젝트 파일)
export const pilotCategoryFiles = pgTable('pilot_category_files', {
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

export type PilotCategoryFile = typeof pilotCategoryFiles.$inferSelect;
export type NewPilotCategoryFile = typeof pilotCategoryFiles.$inferInsert;

// ============================================
// Review Management (코드 리뷰 관리)
// ============================================

// Review type enum
export const reviewTypeEnum = pgEnum('review_type', [
  'ROOT',
  'NOTE',
  'MERMAID',
  'QA',
  'FILE',
]);

// Review categories table (코드 리뷰 카테고리)
export const reviewCategories = pgTable('review_categories', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  reviewType: reviewTypeEnum('review_type').default('NOTE').notNull(),
  reviewTarget: varchar('review_target', { length: 50 }),
  description: text('description'),
  parentId: integer('parent_id'),
  displayOrder: integer('display_order').default(0).notNull(),
  depth: integer('depth').default(0).notNull(),
  icon: varchar('icon', { length: 100 }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type ReviewCategory = typeof reviewCategories.$inferSelect;
export type NewReviewCategory = typeof reviewCategories.$inferInsert;

// Review contents table (코드 리뷰 컨텐츠)
export const reviewContents = pgTable('review_contents', {
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

export type ReviewContent = typeof reviewContents.$inferSelect;
export type NewReviewContent = typeof reviewContents.$inferInsert;

// Review category files table (코드 리뷰 파일)
export const reviewCategoryFiles = pgTable('review_category_files', {
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

export type ReviewCategoryFile = typeof reviewCategoryFiles.$inferSelect;
export type NewReviewCategoryFile = typeof reviewCategoryFiles.$inferInsert;
