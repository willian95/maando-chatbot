import { Module } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { ChatbotController } from './chatbot.controller';
import { LanguageModule } from '../language/language.module';
import { QuestionModule } from '../question/question.module';
import { UserModule } from '../user/user.module';
import { AskedQuestionModule } from '../asked-question/asked-question.module';

@Module({
  controllers: [ChatbotController],
  providers: [ChatbotService],
  imports: [
    LanguageModule,
    QuestionModule,
    UserModule,
    AskedQuestionModule
  ],
})
export class ChatbotModule {}
