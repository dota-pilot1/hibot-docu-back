import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

interface ChatRequest {
    message: string;
    systemPrompt?: string;
}

@ApiTags('ai')
@Controller('ai')
export class AiController {
    constructor(private readonly aiService: AiService) { }

    @UseGuards(JwtAuthGuard)
    @Post('chat')
    @ApiOperation({ summary: 'Request AI assistance for document creation' })
    @ApiResponse({ status: 200, description: 'AI generated response' })
    async chat(@Body() body: ChatRequest) {
        const { message, systemPrompt } = body;
        const response = await this.aiService.chat(message, systemPrompt);
        return { response };
    }
}
