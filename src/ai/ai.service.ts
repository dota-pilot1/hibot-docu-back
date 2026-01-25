import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class AiService {
    private readonly logger = new Logger(AiService.name);
    private genAI: GoogleGenerativeAI;
    private model: any;

    constructor(private configService: ConfigService) {
        const apiKey = this.configService.get<string>('GEMINI_API_KEY');
        if (apiKey) {
            this.genAI = new GoogleGenerativeAI(apiKey);
            this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        }
    }

    async chat(message: string, systemPrompt?: string): Promise<string> {
        if (!this.model) {
            throw new Error('AI Service not initialized (missing API key)');
        }

        try {
            const prompt = systemPrompt
                ? `${systemPrompt}\n\nUser Question: ${message}`
                : message;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            this.logger.error(`AI Chat failed: ${error.message}`);
            throw error;
        }
    }
}
