import { Module, HttpModule } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { ChatbotController } from './chatbot.controller';
import { LanguageModule } from '../language/language.module';
import { QuestionModule } from '../question/question.module';
import { UserModule } from '../user/user.module';
import { AskedQuestionModule } from '../asked-question/asked-question.module';
import { ErrorMessageModule } from '../error-message/error-message.module';
import { SuccessMessageModule } from '../success-message/success-message.module';
import { OrderModule } from '../order/order.module';


@Module({
  controllers: [ChatbotController],
  providers: [ChatbotService],
  imports: [
    HttpModule,
    LanguageModule,
    QuestionModule,
    UserModule,
    AskedQuestionModule,
    ErrorMessageModule,
    SuccessMessageModule,
    OrderModule
  ],
})
export class ChatbotModule {}
