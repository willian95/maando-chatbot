import { Module } from '@nestjs/common';
import { SuccessMessageService } from './success-message.service';
import { SuccessMessageController } from './success-message.controller';
import { SuccessMessage, SuccessMessageSchema } from '../schemas/successMessages.schema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  controllers: [SuccessMessageController],
  providers: [SuccessMessageService],
  imports: [
    MongooseModule.forFeature([{ name: SuccessMessage.name, schema: SuccessMessageSchema }]),
  ],
  exports:[
    SuccessMessageService
  ]
})
export class SuccessMessageModule {}
