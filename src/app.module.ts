import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { SeederModule } from './seeder/seeder.module';
import { LanguageModule } from './language/language.module';
import { QuestionModule } from './question/question.module';
import { ChatbotModule } from './chatbot/chatbot.module';
import { TwilioModule } from 'nestjs-twilio';
import { AskedQuestionModule } from './asked-question/asked-question.module';
import { UserModule } from './user/user.module';
import { ErrorMessageModule } from './error-message/error-message.module';
import { OrderModule } from './order/order.module';
import { SuccessMessageModule } from './success-message/success-message.module';


@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(process.env.DATABASE_URL),
    TwilioModule.forRoot({
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
    }),
    SeederModule,
    LanguageModule,
    QuestionModule,
    ChatbotModule,
    AskedQuestionModule,
    UserModule,
    ErrorMessageModule,
    OrderModule,
    SuccessMessageModule,
  
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
