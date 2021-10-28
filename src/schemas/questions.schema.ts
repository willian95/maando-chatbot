import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Language } from './languages.schema';
import { Document } from 'mongoose';

import * as mongoose from 'mongoose';

export type QuestionDocument = Question & Document;

@Schema()
export class Question {

    _id: Number

    @Prop()
    question: string;

    @Prop({type: mongoose.Schema.Types.ObjectId, ref:'Language'})
    languageId: Language

    @Prop()
    order: Number

    @Prop()
    needReply: Boolean

    @Prop({ required: true })
    createdAt: Date;

    @Prop({ required: true })
    updatedAt: Date;

    @Prop()
    deletedAt?: Date;

}

export const QuestionSchema = SchemaFactory.createForClass(Question);