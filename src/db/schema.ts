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
import { relations, sql } from 'drizzle-orm';

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

// ============================================
// Board System (게시판 시스템)
// ============================================

// Board type enum
export const boardTypeEnum = pgEnum('board_type', [
  'GENERAL', // 일반 게시판
  'NOTICE', // 공지사항
  'QNA', // Q&A
  'GALLERY', // 갤러리
]);

// Post status enum
export const postStatusEnum = pgEnum('post_status', [
  'DRAFT', // 임시저장
  'PUBLISHED', // 게시됨
  'HIDDEN', // 숨김
]);

// Boards table (게시판 정의)
export const boards = pgTable('boards', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 50 }).notNull().unique(), // notice, free, qna 등
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  boardType: boardTypeEnum('board_type').default('GENERAL').notNull(),
  readPermission: varchar('read_permission', { length: 20 })
    .default('ALL')
    .notNull(),
  writePermission: varchar('write_permission', { length: 20 })
    .default('USER')
    .notNull(),
  config: jsonb('config').default(sql`'{}'::jsonb`), // 기능 설정
  icon: varchar('icon', { length: 50 }),
  displayOrder: integer('display_order').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Board = typeof boards.$inferSelect;
export type NewBoard = typeof boards.$inferInsert;

// Posts table (게시글)
export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  boardId: integer('board_id').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  authorId: integer('author_id').notNull(),
  viewCount: integer('view_count').default(0).notNull(),
  likeCount: integer('like_count').default(0).notNull(),
  commentCount: integer('comment_count').default(0).notNull(),
  isPinned: boolean('is_pinned').default(false).notNull(),
  status: postStatusEnum('status').default('PUBLISHED').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Post comments table (게시글 댓글)
export const postComments = pgTable('post_comments', {
  id: serial('id').primaryKey(),
  postId: integer('post_id').notNull(),
  authorId: integer('author_id').notNull(),
  content: text('content').notNull(),
  parentId: integer('parent_id'), // 대댓글인 경우 부모 댓글 ID
  depth: integer('depth').default(0).notNull(), // 0: 댓글, 1: 대댓글
  isDeleted: boolean('is_deleted').default(false).notNull(),
  isEdited: boolean('is_edited').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type PostComment = typeof postComments.$inferSelect;
export type NewPostComment = typeof postComments.$inferInsert;

// Post likes table (게시글 좋아요)
export const postLikes = pgTable('post_likes', {
  id: serial('id').primaryKey(),
  postId: integer('post_id').notNull(),
  userId: integer('user_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type PostLike = typeof postLikes.$inferSelect;
export type NewPostLike = typeof postLikes.$inferInsert;

// Post attachments table (게시글 첨부파일)
export const postAttachments = pgTable('post_attachments', {
  id: serial('id').primaryKey(),
  postId: integer('post_id').notNull(),
  originalName: varchar('original_name', { length: 255 }).notNull(),
  storedName: varchar('stored_name', { length: 255 }).notNull(),
  filePath: text('file_path').notNull(),
  s3Url: text('s3_url'),
  fileSize: integer('file_size').notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  displayOrder: integer('display_order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type PostAttachment = typeof postAttachments.$inferSelect;
export type NewPostAttachment = typeof postAttachments.$inferInsert;

// Post views table (조회 기록 - 중복 방지용)
export const postViews = pgTable('post_views', {
  id: serial('id').primaryKey(),
  postId: integer('post_id').notNull(),
  userId: integer('user_id'), // NULL이면 비회원
  ipAddress: varchar('ip_address', { length: 45 }), // IPv6 지원
  viewedAt: timestamp('viewed_at').defaultNow().notNull(),
});

export type PostView = typeof postViews.$inferSelect;
export type NewPostView = typeof postViews.$inferInsert;

// ============================================
// Board Relations (게시판 관계 정의)
// ============================================

export const boardsRelations = relations(boards, ({ many }) => ({
  posts: many(posts),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  board: one(boards, {
    fields: [posts.boardId],
    references: [boards.id],
  }),
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
  comments: many(postComments),
  likes: many(postLikes),
  attachments: many(postAttachments),
  views: many(postViews),
}));

export const postCommentsRelations = relations(
  postComments,
  ({ one, many }) => ({
    post: one(posts, {
      fields: [postComments.postId],
      references: [posts.id],
    }),
    author: one(users, {
      fields: [postComments.authorId],
      references: [users.id],
    }),
    parent: one(postComments, {
      fields: [postComments.parentId],
      references: [postComments.id],
      relationName: 'commentReplies',
    }),
    replies: many(postComments, { relationName: 'commentReplies' }),
  }),
);

export const postLikesRelations = relations(postLikes, ({ one }) => ({
  post: one(posts, {
    fields: [postLikes.postId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [postLikes.userId],
    references: [users.id],
  }),
}));

export const postAttachmentsRelations = relations(
  postAttachments,
  ({ one }) => ({
    post: one(posts, {
      fields: [postAttachments.postId],
      references: [posts.id],
    }),
  }),
);

export const postViewsRelations = relations(postViews, ({ one }) => ({
  post: one(posts, {
    fields: [postViews.postId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [postViews.userId],
    references: [users.id],
  }),
}));

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

// ============================================
// DB Admin Management (DB 관리)
// ============================================

// DbAdmin type enum
export const dbAdminTypeEnum = pgEnum('db_admin_type', [
  'ROOT',
  'NOTE',
  'MERMAID',
  'QA',
  'FILE',
]);

// DbAdmin categories table (DB 관리 카테고리)
export const dbAdminCategories = pgTable('db_admin_categories', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  dbAdminType: dbAdminTypeEnum('db_admin_type').default('NOTE').notNull(),
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

export type DbAdminCategory = typeof dbAdminCategories.$inferSelect;
export type NewDbAdminCategory = typeof dbAdminCategories.$inferInsert;

// DbAdmin contents table (DB 관리 컨텐츠)
export const dbAdminContents = pgTable('db_admin_contents', {
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

export type DbAdminContent = typeof dbAdminContents.$inferSelect;
export type NewDbAdminContent = typeof dbAdminContents.$inferInsert;

// DbAdmin category files table (DB 관리 파일)
export const dbAdminCategoryFiles = pgTable('db_admin_category_files', {
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

export type DbAdminCategoryFile = typeof dbAdminCategoryFiles.$inferSelect;
export type NewDbAdminCategoryFile = typeof dbAdminCategoryFiles.$inferInsert;

// ============================================
// Favorites Management (즐찾 관리)
// ============================================

// Favorite type enum
export const favoriteTypeEnum = pgEnum('favorite_type', [
  'ROOT',
  'COMMAND',
  'LINK',
  'DOCUMENT',
]);

// Favorite categories table (즐찾 카테고리)
export const favoriteCategories = pgTable('favorite_categories', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  favoriteType: favoriteTypeEnum('favorite_type').default('ROOT').notNull(),
  description: text('description'),
  parentId: integer('parent_id'),
  displayOrder: integer('display_order').default(0).notNull(),
  depth: integer('depth').default(0).notNull(),
  icon: varchar('icon', { length: 100 }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type FavoriteCategory = typeof favoriteCategories.$inferSelect;
export type NewFavoriteCategory = typeof favoriteCategories.$inferInsert;

// Favorite contents table (즐찾 컨텐츠)
export const favoriteContents = pgTable('favorite_contents', {
  id: serial('id').primaryKey(),
  categoryId: integer('category_id').notNull(),
  userId: integer('user_id').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content'),
  contentType: favoriteTypeEnum('content_type').default('COMMAND').notNull(),
  metadata: jsonb('metadata'), // { url, language, tags }
  displayOrder: integer('display_order').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type FavoriteContent = typeof favoriteContents.$inferSelect;
export type NewFavoriteContent = typeof favoriteContents.$inferInsert;

// Favorite category files table (즐찾 파일)
export const favoriteCategoryFiles = pgTable('favorite_category_files', {
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

export type FavoriteCategoryFile = typeof favoriteCategoryFiles.$inferSelect;
export type NewFavoriteCategoryFile = typeof favoriteCategoryFiles.$inferInsert;

// ============================================
// Skill Tree Management (스킬 트리 관리)
// ============================================

// Skill categories table (스킬 카테고리)
export const skillCategories = pgTable('skill_categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  displayOrder: integer('display_order').default(0).notNull(),
  iconUrl: text('icon_url'),
  color: varchar('color', { length: 20 }), // 예: "#4F46E5"
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type SkillCategory = typeof skillCategories.$inferSelect;
export type NewSkillCategory = typeof skillCategories.$inferInsert;

// Skills table (스킬 정의)
export const skills = pgTable('skills', {
  id: serial('id').primaryKey(),
  categoryId: integer('category_id'),
  parentId: integer('parent_id'), // 선행 스킬 (트리 구조)
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  displayOrder: integer('display_order').default(0).notNull(),
  maxLevel: integer('max_level').default(5).notNull(),
  iconUrl: text('icon_url'),
  metadata: jsonb('metadata').default(sql`'{}'::jsonb`), // { tags, resources, examples }
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Skill = typeof skills.$inferSelect;
export type NewSkill = typeof skills.$inferInsert;

// User skills table (사용자별 스킬 레벨)
export const userSkills = pgTable('user_skills', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  skillId: integer('skill_id').notNull(),
  level: integer('level').default(0).notNull(), // 0-5
  notes: text('notes'), // 개인 메모
  startedAt: timestamp('started_at'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type UserSkill = typeof userSkills.$inferSelect;
export type NewUserSkill = typeof userSkills.$inferInsert;

// Skill activity type enum
export const skillActivityTypeEnum = pgEnum('skill_activity_type', [
  'level_up',
  'level_down',
  'started',
  'note_updated',
]);

// Skill activities table (스킬 활동 로그)
export const skillActivities = pgTable('skill_activities', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  skillId: integer('skill_id').notNull(),
  type: skillActivityTypeEnum('type').notNull(),
  previousLevel: integer('previous_level'),
  newLevel: integer('new_level'),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type SkillActivity = typeof skillActivities.$inferSelect;
export type NewSkillActivity = typeof skillActivities.$inferInsert;
