import { Module } from '@nestjs/common';
import { AskedQuestionService } from './asked-question.service';
import { AskedQuestionController } from './asked-question.controller';
import { AskedQuestions, AskedQuestionsSchema } from '../schemas/askedquestions.schema';
import { MongooseModule } from '@nestjs/mongoose';


@Module({
  controllers: [AskedQuestionController],
  providers: [AskedQuestionService],
  imports: [
    MongooseModule.forFeature([{ name: AskedQuestions.name, schema: AskedQuestionsSchema }]),
  ],
  exports:[
    AskedQuestionService
  ]
})
export class AskedQuestionModule {}
