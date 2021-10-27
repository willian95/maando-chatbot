import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Question, QuestionDocument } from '../schemas/questions.schema';
import { Model } from 'mongoose';

@Injectable()
export class QuestionService {

    constructor(@InjectModel(Question.name) private readonly model: Model<QuestionDocument>) {}

    async store(question){

        await new this.model({
            question:question.question,
            languageId: question.language._id,
            createdAt: new Date(),
            updatedAt: new Date(),
        }).save();

    }

}
