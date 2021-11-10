import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../schemas/users.schema';
import { Model } from 'mongoose';

@Injectable()
export class UserService {

    constructor(@InjectModel(User.name) private readonly model: Model<UserDocument>) {}

    async findUserByPhone(phoneNumber){

        return await this.model.find({
            phoneNumber: phoneNumber,
            deletedAt: null
        }).populate("languageId")

    }

    async store(phoneNumber, languageId){

        return await new this.model({
            phoneNumber:phoneNumber,
            languageId:languageId,
            createdAt: new Date(),
            updatedAt: new Date(),
        }).save();

    }

    async updateLanguage(userId, languageId){

        let user = await this.model.findOne({
            _id: userId
        });

        user.languageId = languageId
        return await user.save();

    }



}
