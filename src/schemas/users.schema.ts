import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Language } from './languages.schema';
import { Document } from 'mongoose';

import * as mongoose from 'mongoose';

export type UserDocument = User & Document;

@Schema()
export class User {

    _id: Number

    @Prop()
    phoneNumber: string;

    @Prop({type: mongoose.Schema.Types.ObjectId, ref:'Language'})
    languageId: Language

    @Prop({ required: true })
    createdAt: Date;

    @Prop({ required: true })
    updatedAt: Date;

    @Prop()
    deletedAt?: Date;

}

export const LanguageSchema = SchemaFactory.createForClass(Language);