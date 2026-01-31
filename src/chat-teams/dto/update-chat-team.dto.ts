import { PartialType } from '@nestjs/mapped-types';
import { CreateChatTeamDto } from './create-chat-team.dto';

export class UpdateChatTeamDto extends PartialType(CreateChatTeamDto) {}
