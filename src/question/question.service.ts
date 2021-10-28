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
            order:question.order,
            needReply:question.needReply,
            createdAt: new Date(),
            updatedAt: new Date(),
        }).save();

    }

    async findByOrderAndLanguage(order, languageId){

        return await this.model.find({
            order:order,
            languageId: languageId,
            deletedAt:null
        })

    }

    async getLastOrderQuestion(){
        return await this.model.findOne().sort({ order: -1 });
    }

}
