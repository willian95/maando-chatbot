import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { User } from './users.schema';
import { Question } from './questions.schema';

import * as mongoose from 'mongoose';

export type AskedQuestionsDocument = AskedQuestions & Document;

@Schema()
export class AskedQuestions {

    _id: Number

    @Prop({type: mongoose.Schema.Types.ObjectId, ref:'User'})
    userId: User

    @Prop({type: mongoose.Schema.Types.ObjectId, ref:'Question'})
    questionId: User

    @Prop()
    reply?: String;

    @Prop()
    needReply: Boolean

    @Prop({ required: true })
    createdAt: Date;

    @Prop({ required: true })
    updatedAt: Date;

    @Prop()
    deletedAt?: Date;

}

export const AskedQuestionsSchema = SchemaFactory.createForClass(AskedQuestions);