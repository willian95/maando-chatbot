import { Injectable } from '@nestjs/common';
import { InjectTwilio, TwilioClient } from 'nestjs-twilio';

@Injectable()
export class ChatbotService {

    constructor( @InjectTwilio() private readonly client: TwilioClient) {}

    async message() {

        try {
          await this.client.messages.create({
            body: 'mensaje desde twillio', 
            from: 'whatsapp:'+process.env.TWILIO_WHATSAPP_PHONE_NUMBER,       
            to: 'whatsapp:+584121081638' 
          });

          return {
              success:true,
              message:"sended"
          }

        } catch (e) {
            return {
                success:false,
                error:e
            }
        }
    }


}
