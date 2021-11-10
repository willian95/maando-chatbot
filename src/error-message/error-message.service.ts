import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ErrorMessage, ErrorMessageDocument } from '../schemas/errorMessages.schema';
import { Model } from 'mongoose';

@Injectable()
export class ErrorMessageService {

    constructor(@InjectModel(ErrorMessage.name) private readonly model: Model<ErrorMessageDocument>) {}

    async store(errorMessage){

        return await new this.model({
            message:errorMessage.message,
            languageOrder:errorMessage.languageOrder,
            order: errorMessage.order,
            createdAt: new Date(),
            updatedAt: new Date(),
        }).save();

    }

    async findErrorMessage(order, languageOrder){
        
        return await this.model.findOne({
            order:order,
            languageOrder:languageOrder,
            deletedAt:null
        });

    }


}
