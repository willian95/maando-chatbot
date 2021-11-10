import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Language } from './languages.schema';
import { Document } from 'mongoose';

import * as mongoose from 'mongoose';

export type UserDocument = User & Document;

@Schema()
export class User {
    question(question: any, From: any) {
        throw new Error('Method not implemented.');
    }

    _id: Number

    @Prop()
    phoneNumber: string;

    @Prop({type: mongoose.Schema.Types.ObjectId, ref:'Language'})
    languageId: Language

    order: string

    @Prop({ required: true })
    createdAt: Date;

    @Prop({ required: true })
    updatedAt: Date;

    @Prop()
    deletedAt?: Date;

}

export const UserSchema = SchemaFactory.createForClass(User);