import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SuccessMessageDocument = SuccessMessage & Document;

@Schema()
export class SuccessMessage {

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

export const SuccessMessageSchema = SchemaFactory.createForClass(SuccessMessage);