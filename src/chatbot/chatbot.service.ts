import { Injectable } from '@nestjs/common';
import { InjectTwilio, TwilioClient } from 'nestjs-twilio';
import { AskedQuestionService } from '../asked-question/asked-question.service'
import { QuestionService } from '../question/question.service'
import { LanguageService } from '../language/language.service'
import { UserService } from '../user/user.service'

@Injectable()
export class ChatbotService {

    constructor( 
        @InjectTwilio() private readonly client: TwilioClient, 
        private readonly askedQuestionService:AskedQuestionService, 
        private readonly userService:UserService,
        private readonly questionService:QuestionService,
        private readonly languageService:LanguageService
    ) {}

    async message(messageBody) {

        try {

            let user = await this.userService.findUserByPhone(messageBody.From)
            let language = await this.languageService.findByLanguageSeeder("Español")
            
            if(user.length == 0){
  
                let storedUser = await this.userService.store(messageBody.From, language._id)
                
                let body = await this.questionService.findByOrderAndLanguage(1, language._id)    
                
                await this.askedQuestionService.store(storedUser._id, body[0])
                
                await this.sendMessage(body[0].question, messageBody.From)

            }else{
                
                let openQuestion = await this.askedQuestionService.userHaveOpenQuestion(user[0]._id)
                
                if(openQuestion){

                    await this.askedQuestionService.updateOpenQuestionWithReply(openQuestion._id, messageBody.Body)
                    await this.setUserLanguage(user[0]._id, openQuestion, messageBody.Body)
                    user = await this.userService.findUserByPhone(messageBody.From)
                }
                
                let lastQuestionAsked = await this.askedQuestionService.getLastQuestionAsked(user[0]._id)
                let lastOrderQuestion = await this.questionService.getLastOrderQuestion()
                let order = lastQuestionAsked.questionId.order

                if(parseInt(order) == lastOrderQuestion.order){

                    let body = await this.questionService.findByOrderAndLanguage(2, user[0].languageId)    
                
                    await this.askedQuestionService.store(user[0]._id, body[0])
                    
                    await this.sendMessage(body[0].question, messageBody.From)

                }
                
                else if(parseInt(order) < lastOrderQuestion.order){

                    let nextOrder = parseInt(order) + 1
                    let body = await this.questionService.findByOrderAndLanguage(nextOrder, user[0].languageId)    
                    
                    await this.askedQuestionService.store(user[0]._id, body[0])
                    
                    await this.sendMessage(body[0].question, messageBody.From)

                }else if(parseInt(order) + 1 == lastOrderQuestion.order){

                    let body = await this.questionService.findByOrderAndLanguage(lastOrderQuestion.order, user[0].languageId)    
                    await this.askedQuestionService.store(user[0]._id, body[0])
                    
                    await this.sendMessage(body[0].question, messageBody.From)
                    
                }

            }   


        } catch (e) {
            console.log(e)
        }
    }

    async sendMessage(body, to){

        try{
            await this.client.messages.create({
                body: body, 
                from: 'whatsapp:'+process.env.TWILIO_WHATSAPP_PHONE_NUMBER,       
                to: to
            });
        }catch (e) {
            console.log(e)
        }

    }

    async setUserLanguage(userId, question, reply){

        if(question.questionId.order == 1){

            let language = await this.languageService.findByOrder(reply)
            return await this.userService.updateLanguage(userId, language._id)

        }


    }


}
