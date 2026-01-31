import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ProjectsModule } from './projects/projects.module';
import { CommonModule } from './common/common.module';
import { AiModule } from './ai/ai.module';
import { PostsModule } from './posts/posts.module';
import { DepartmentsModule } from './departments/departments.module';
import { NotesModule } from './notes/notes.module';
import { DocumentFoldersModule } from './document-folders/document-folders.module';
import { DocumentsModule } from './documents/documents.module';
import { ChatProjectsModule } from './chat-projects/chat-projects.module';
import { ChatTeamsModule } from './chat-teams/chat-teams.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    UsersModule,
    AuthModule,
    ProjectsModule,
    CommonModule,
    AiModule,
    PostsModule,
    DepartmentsModule,
    NotesModule,
    DocumentFoldersModule,
    DocumentsModule,
    ChatProjectsModule,
    ChatTeamsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
