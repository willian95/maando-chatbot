import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AskedQuestions, AskedQuestionsDocument } from '../schemas/askedquestions.schema';
import { Model } from 'mongoose';

@Injectable()
export class AskedQuestionService {

    constructor(@InjectModel(AskedQuestions.name) private readonly model: Model<AskedQuestionsDocument>) {}

    async store(userId, questionId){

        return await new this.model({
            questionId:questionId._id,
            userId:userId,
            reply:null,
            needReply: questionId.needReply,
            createdAt: new Date(),
            updatedAt: new Date(),
        }).save();

    }

    async userHaveOpenQuestion(userId){
        
        return await this.model.findOne({
            userId:userId,
            needReply:true,
            reply:null
        }).populate("questionId");

    }

    async updateOpenQuestionWithReply(questionId, reply){

        let question = await this.model.findOne({_id: questionId})
        question.reply = reply
        question.updatedAt = new Date()
        return await question.save()

    }

    async getLastQuestionAsked(userId){

        return await this.model.findOne({userId: userId}).sort({ _id: -1 }).populate("questionId");

    }

    

}
