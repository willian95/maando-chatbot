import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Order, OrderDocument } from '../schemas/order.schema';
import { Model } from 'mongoose';

@Injectable()
export class OrderService {

    constructor(@InjectModel(Order.name) private readonly model: Model<OrderDocument>) {}

    async store(userId){

        return await new this.model({
            userId:userId,
            createdAt: new Date(),
            updatedAt: new Date(),
        }).save();

    }

    async update(orderId, status){

        let order = await this.model.findOne({
            _id: orderId
        });

        order.status = status
        return await order.save();

    }

    async findOpenOrder(userId){

        return await this.model.findOne({
            status:"started",
            userId:userId,
        });

    }

}
