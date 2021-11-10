import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { SuccessMessage, SuccessMessageDocument } from '../schemas/successMessages.schema';
import { Model } from 'mongoose';

@Injectable()
export class SuccessMessageService {

    constructor(@InjectModel(SuccessMessage.name) private readonly model: Model<SuccessMessageDocument>) {}

    async store(successMessage){

        return await new this.model({
            message:successMessage.message,
            languageOrder:successMessage.languageOrder,
            order: successMessage.order,
            createdAt: new Date(),
            updatedAt: new Date(),
        }).save();

    }

    async findSuccessMessage(order, languageOrder){
        
        return await this.model.findOne({
            order:order,
            languageOrder:languageOrder,
            deletedAt:null
        });

    }

}
