import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ArchitecturesModule } from './architectures/architectures.module';
import { CommonModule } from './common/common.module';
import { AiModule } from './ai/ai.module';
import { PostsModule } from './posts/posts.module';
import { DepartmentsModule } from './departments/departments.module';
import { NotesModule } from './notes/notes.module';
import { DocumentFoldersModule } from './document-folders/document-folders.module';
import { DocumentsModule } from './documents/documents.module';
import { ChatProjectsModule } from './chat-projects/chat-projects.module';
import { ChatTeamsModule } from './chat-teams/chat-teams.module';
import { ChatRoomsModule } from './chat-rooms/chat-rooms.module';
import { TasksModule } from './tasks/tasks.module';
import { PilotsModule } from './pilots/pilots.module';
import { ReviewsModule } from './reviews/reviews.module';
import { DbAdminModule } from './db-admin/db-admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    UsersModule,
    AuthModule,
    ArchitecturesModule,
    PilotsModule,
    ReviewsModule,
    DbAdminModule,
    CommonModule,
    AiModule,
    PostsModule,
    DepartmentsModule,
    NotesModule,
    DocumentFoldersModule,
    DocumentsModule,
    ChatProjectsModule,
    ChatTeamsModule,
    ChatRoomsModule,
    TasksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
