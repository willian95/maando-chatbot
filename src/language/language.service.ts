import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Language, LanguageDocument } from '../schemas/languages.schema';
import { Model } from 'mongoose';

@Injectable()
export class LanguageService {

    constructor(@InjectModel(Language.name) private readonly model: Model<LanguageDocument>) {}

    async store(language){

        await new this.model({
            language:language,
            createdAt: new Date(),
            updatedAt: new Date(),
        }).save();

    }

    async findByLanguage(language){
        
        let result = await this.model.findOne({
            language: language,
            deletedAt:null
        });

        return result

    }

}
