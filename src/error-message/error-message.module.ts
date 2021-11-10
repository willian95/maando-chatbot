import { Module } from '@nestjs/common';
import { ErrorMessageService } from './error-message.service';
import { ErrorMessageController } from './error-message.controller';
import { ErrorMessage, ErrorMessageSchema } from '../schemas/errorMessages.schema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  controllers: [ErrorMessageController],
  providers: [ErrorMessageService],
  imports: [
    MongooseModule.forFeature([{ name: ErrorMessage.name, schema: ErrorMessageSchema }]),
  ],
  exports:[
    ErrorMessageService
  ]
})
export class ErrorMessageModule {}
