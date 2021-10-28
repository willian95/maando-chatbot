import { Controller, Post, Request } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';

@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}


  @Post("whatsapp")
  async test(@Request() req){

    await this.chatbotService.message(req.body)

  }

}
