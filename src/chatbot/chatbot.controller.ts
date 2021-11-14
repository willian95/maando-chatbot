import { Controller, Post, Request } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';

@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}


  @Post("whatsapp")
  async whatsapp(@Request() req){

    let phoneNumber = 'whatsapp:'+process.env.TWILIO_WHATSAPP_PHONE_NUMBER
    await this.chatbotService.message(req.body, phoneNumber)

  }

  @Post("sms")
  async sms(@Request() req){
    let phoneNumber = process.env.TWILLIO_SMS_PHONE_NUMBER
    await this.chatbotService.message(req.body, phoneNumber)

  }

}
