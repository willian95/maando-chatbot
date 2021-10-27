import { Module } from '@nestjs/common';
import { QuestionService } from './question.service';
import { QuestionController } from './question.controller';
import { Question, QuestionSchema } from '../schemas/questions.schema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  controllers: [QuestionController],
  providers: [QuestionService],
  imports: [
    MongooseModule.forFeature([{ name: Question.name, schema: QuestionSchema }]),
  ],
  exports:[QuestionService]
})
export class QuestionModule {}
