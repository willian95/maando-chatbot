import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ErrorMessageDocument = ErrorMessage & Document;

@Schema()
export class ErrorMessage {

    _id: Number

    @Prop()
    message: string;

    @Prop()
    languageOrder: Number

    @Prop()
    order: string

    @Prop({ required: true })
    createdAt: Date;

    @Prop({ required: true })
    updatedAt: Date;

    @Prop()
    deletedAt?: Date;

}

export const ErrorMessageSchema = SchemaFactory.createForClass(ErrorMessage);