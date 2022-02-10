import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AskedQuestions, AskedQuestionsDocument } from '../schemas/askedquestions.schema';
import { Model } from 'mongoose';

@Injectable()
export class AskedQuestionService {

    constructor(@InjectModel(AskedQuestions.name) private readonly model: Model<AskedQuestionsDocument>) {}

    async store(userId, questionId, orderId){

        return await new this.model({
            questionId:questionId._id,
            userId:userId,
            reply:null,
            orderId:orderId,
            needReply: questionId.needReply,
            createdAt: new Date(),
            updatedAt: new Date(),
        }).save();

    }

    async userHaveOpenQuestion(userId, orderId){
        
        return await this.model.findOne({
            userId:userId,
            orderId:orderId,
            needReply:true,
            reply:null
        }).populate("questionId");

    }

    async updateOpenQuestionWithReply(questionId, reply, orderId){

        

        let question = await this.model.findOne({_id: questionId, orderId: orderId})
        question.reply = reply
        question.updatedAt = new Date()
        return await question.save()

    }

    async getLastQuestionAsked(userId, orderId){

        return await this.model.findOne({userId: userId, orderId:orderId}).sort({ _id: -1 }).populate("questionId");

    }

    async getQuestionAsked(userId, questionId, orderId){


        return await this.model.findOne({userId: userId, orderId:orderId, questionId: questionId}).sort({ _id: -1 }).populate("questionId");

    }

    async deleteAskedQuestion(userId, questionId, orderId){

        let askedQuestion = await this.model.findOne({userId: userId, orderId:orderId, questionId: questionId})
        await askedQuestion.delete();
    }

}
