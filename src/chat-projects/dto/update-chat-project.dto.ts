import { PartialType } from '@nestjs/mapped-types';
import { CreateChatProjectDto } from './create-chat-project.dto';

export class UpdateChatProjectDto extends PartialType(CreateChatProjectDto) {}
