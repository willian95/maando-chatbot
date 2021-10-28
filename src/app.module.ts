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
  
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
