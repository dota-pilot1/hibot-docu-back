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
    'GITHUB',
    'FAQ',
    'MEMBER',
]);

export const contentTypeEnum = pgEnum('content_type', [
    'NOTE',
    'MERMAID',
    'QA',
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

export type ProjectCategory = typeof projectCategories.$inferSelect;
export type NewProjectCategory = typeof projectCategories.$inferInsert;
export type ProjectContent = typeof projectContents.$inferSelect;
export type NewProjectContent = typeof projectContents.$inferInsert;
