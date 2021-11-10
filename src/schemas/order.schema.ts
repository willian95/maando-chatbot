import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { User } from './users.schema';

import * as mongoose from 'mongoose';

export type OrderDocument = Order & Document;

@Schema()
export class Order {

    _id: Number

    @Prop({ default: 'started' })
    status: string;

    @Prop({type: mongoose.Schema.Types.ObjectId, ref:'User'})
    userId: User

    @Prop({ required: true })
    createdAt: Date;

    @Prop({ required: true })
    updatedAt: Date;

    @Prop()
    deletedAt?: Date;

}

export const OrderSchema = SchemaFactory.createForClass(Order);