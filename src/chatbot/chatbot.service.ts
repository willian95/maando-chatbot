import { Injectable, HttpService } from '@nestjs/common';
import { InjectTwilio, TwilioClient } from 'nestjs-twilio';
import { AskedQuestionService } from '../asked-question/asked-question.service'
import { QuestionService } from '../question/question.service'
import { LanguageService } from '../language/language.service'
import { UserService } from '../user/user.service'
import { OrderService } from '../order/order.service'
import { ErrorMessageService } from '../error-message/error-message.service';
import { SuccessMessageService } from '../success-message/success-message.service';
import { v4 as uuidv4 } from 'uuid'
const FormData = require('form-data');
const fs = require('fs');

@Injectable()
export class ChatbotService {

    constructor( 
        @InjectTwilio() private readonly client: TwilioClient, 
        private readonly askedQuestionService:AskedQuestionService, 
        private readonly userService:UserService,
        private readonly questionService:QuestionService,
        private readonly languageService:LanguageService,
        private readonly errorMessageService:ErrorMessageService,
        private readonly successMessageService:SuccessMessageService,
        private readonly orderService:OrderService,
        private httpService:HttpService
    ) {}

    async message(messageBody, phoneNumber) {

        try {

            let user = await this.userService.findUserByPhone(messageBody.From)
            let language = await this.languageService.findByLanguageSeeder("English")
            
            if(user.length == 0){
  
                this.askForLanguage(messageBody, language, phoneNumber);

            }else{
                
                language = await this.languageService.findById(user[0].languageId)
                let openOrder = await this.orderService.findOpenOrder(user[0]._id)
                let openQuestion = await this.askedQuestionService.userHaveOpenQuestion(user[0]._id, openOrder ? openOrder._id : null)

                if(openQuestion){

                    //preguntar idioma
                    if(openQuestion.questionId.order == 1){
                        let isInteger = await this.validateInteger(messageBody)
                        let countLanguages = await this.languageService.countAllLanguages();
                        
                        if(!isInteger){
                            
                            let message = await this.errorMessageService.findErrorMessage(1, language.order)
                            await this.sendMessage(message.message, messageBody.From, phoneNumber)
                            await this.sendMessage(openQuestion.questionId.question, messageBody.From, phoneNumber)
                            return
                        }
                        else if(isInteger == 0 || isInteger > countLanguages){
                            let message = await this.errorMessageService.findErrorMessage(2, language.order)
                            await this.sendMessage(message.message, messageBody.From, phoneNumber)
                            await this.sendMessage(openQuestion.questionId.question, messageBody.From, phoneNumber)
                            return
                        }
                        else{

                            await this.updateUserLanguage(openQuestion, messageBody, user)
                            await this.showQuestion(2, messageBody, phoneNumber)

                        }

                    }

                    //menu
                    else if(openQuestion.questionId.order == 2){

                        let isInteger = await this.validateInteger(messageBody)
                        if(!isInteger){
                            
                            let message = await this.errorMessageService.findErrorMessage(1, language.order)
                            await this.sendMessage(message.message, messageBody.From, phoneNumber)
                            await this.sendMessage(openQuestion.questionId.question, messageBody.From, phoneNumber)
                            return
                        }
                        else if(isInteger == 0 || isInteger > 3){ //cambiar en caso de añadir otra opción al menu
                            let message = await this.errorMessageService.findErrorMessage(2, language.order)
                            await this.sendMessage(message.message, messageBody.From, phoneNumber)
                            await this.sendMessage(openQuestion.questionId.question, messageBody.From, phoneNumber)
                            return
                        }else{

                            await this.askedQuestionService.updateOpenQuestionWithReply(openQuestion._id, messageBody.Body, null)
                            if(messageBody.Body == "1"){

                                await this.orderService.store(user[0]._id)
                                await this.showQuestion(3, messageBody, phoneNumber)

                            }else if(messageBody.Body == "2"){

                                await this.showQuestion(18, messageBody,phoneNumber)

                            }else if(messageBody.Body == "3"){



                            }

                        }

                    }

                    //titulo del paquete
                    else if(openQuestion.questionId.order == 3){

                        let openOrder = await this.orderService.findOpenOrder(user[0]._id)
                        await this.askedQuestionService.updateOpenQuestionWithReply(openQuestion._id, messageBody.Body, openOrder ? openOrder._id : null)
                        
                        await this.showQuestion(5, messageBody, phoneNumber)
                        let message = await this.getAvailableCountries()
                        await this.sendMessage(message, messageBody.From, phoneNumber)
                        
                        

                    }

                    //país de salida
                    else if(openQuestion.questionId.order == 5){         
                        

                        let isInteger = await this.validateInteger(messageBody)
                        if(!isInteger){
                            
                            let message = await this.errorMessageService.findErrorMessage(1, language.order)
                            await this.sendMessage(message.message, messageBody.From, phoneNumber)
                            await this.sendMessage(openQuestion.questionId.question, messageBody.From, phoneNumber)
                            return
                        }
                        else if(isInteger == 0 || isInteger > await this.countAvailableCountries()){ //cambiar en caso de añadir otra opción al menu
                            let message = await this.errorMessageService.findErrorMessage(2, language.order)
                            await this.sendMessage(message.message, messageBody.From, phoneNumber)
                            await this.sendMessage(openQuestion.questionId.question, messageBody.From, phoneNumber)
                            return
                        }
                        
                        let validation = await this.validateCountry(messageBody.Body)
                        if(validation.success == false){

                            let message = await this.errorMessageService.findErrorMessage(10, language.order)
                            await this.sendMessage(message.message, messageBody.From, phoneNumber)
                            await this.sendMessage(openQuestion.questionId.question, messageBody.From, phoneNumber)
                            return

                        }

                        let question = await this.questionService.findByOrderAndLanguage(5, language._id)
                        let openOrder = await this.orderService.findOpenOrder(user[0]._id)
                        await this.askedQuestionService.updateOpenQuestionWithReply(openQuestion._id, validation.country, openOrder ? openOrder._id : null)
                        
                        await this.showQuestion(6, messageBody, phoneNumber)
                        let message = await this.getAvailableCities(user[0]._id, question[0]._id, openOrder._id)
                        await this.sendMessage(message, messageBody.From, phoneNumber)
                        
                        
                        

                    }

                    else if(openQuestion.questionId.order == 6){                        
                 
                        let question = await this.questionService.findByOrderAndLanguage(5, language._id)
                        let openOrder = await this.orderService.findOpenOrder(user[0]._id)

                        let isInteger = await this.validateInteger(messageBody)
                        if(!isInteger){
                            
                            let message = await this.errorMessageService.findErrorMessage(1, language.order)
                            await this.sendMessage(message.message, messageBody.From, phoneNumber)
                            await this.sendMessage(openQuestion.questionId.question, messageBody.From, phoneNumber)
                            return
                        }
                        else if(isInteger == 0 || isInteger > await this.countAvailableCity(user[0]._id, question[0]._id, openOrder._id)){ //cambiar en caso de añadir otra opción al menu
                            let message = await this.errorMessageService.findErrorMessage(2, language.order)
                            await this.sendMessage(message.message, messageBody.From, phoneNumber)
                            await this.sendMessage(openQuestion.questionId.question, messageBody.From, phoneNumber)
                            return
                        }


                        let validation = await this.validateCity(messageBody.Body, user[0]._id, question[0]._id, openOrder._id)

                        if(validation.success == false){

                            let message = await this.errorMessageService.findErrorMessage(4, language.order)
                            await this.sendMessage(message.message, messageBody.From, phoneNumber)
                            await this.sendMessage(openQuestion.questionId.question, messageBody.From, phoneNumber)
                            return

                        }
                        
                        await this.askedQuestionService.updateOpenQuestionWithReply(openQuestion._id, validation.city, openOrder ? openOrder._id : null)

                        await this.showQuestion(7, messageBody, phoneNumber)

                        let message = await this.getAvailableCountries()
                        await this.sendMessage(message, messageBody.From, phoneNumber)

                        

                    }

                    else if(openQuestion.questionId.order == 7){       

                        let isInteger = await this.validateInteger(messageBody)
                        if(!isInteger){
                            
                            let message = await this.errorMessageService.findErrorMessage(1, language.order)
                            await this.sendMessage(message.message, messageBody.From, phoneNumber)
                            await this.sendMessage(openQuestion.questionId.question, messageBody.From, phoneNumber)
                            return
                        }
                        else if(isInteger == 0 || isInteger > await this.countAvailableCountries()){ //cambiar en caso de añadir otra opción al menu
                            let message = await this.errorMessageService.findErrorMessage(2, language.order)
                            await this.sendMessage(message.message, messageBody.From, phoneNumber)
                            await this.sendMessage(openQuestion.questionId.question, messageBody.From, phoneNumber)
                            return
                        }
                        
                        let validation = await this.validateCountry(messageBody.Body)
                        if(validation.success == false){

                            let message = await this.errorMessageService.findErrorMessage(4, language.order)
                            await this.sendMessage(message.message, messageBody.From, phoneNumber)
                            await this.sendMessage(openQuestion.questionId.question, messageBody.From, phoneNumber)
                            return

                        }

                        let openOrder = await this.orderService.findOpenOrder(user[0]._id)
                        await this.askedQuestionService.updateOpenQuestionWithReply(openQuestion._id, validation.country, openOrder ? openOrder._id : null)


                        await this.showQuestion(8, messageBody, phoneNumber)
                        let question = await this.questionService.findByOrderAndLanguage(7, language._id)
                        let openOrderCountry = await this.orderService.findOpenOrder(user[0]._id)
                        let message = await this.getAvailableCities(user[0]._id, question[0]._id, openOrderCountry._id)
                        await this.sendMessage(message, messageBody.From, phoneNumber)

                        

                    }

                    else if(openQuestion.questionId.order == 8){                        
                        
                        let question = await this.questionService.findByOrderAndLanguage(7, language._id)
                        let openOrder = await this.orderService.findOpenOrder(user[0]._id)

                        let isInteger = await this.validateInteger(messageBody)
                        if(!isInteger){
                            
                            let message = await this.errorMessageService.findErrorMessage(1, language.order)
                            await this.sendMessage(message.message, messageBody.From, phoneNumber)
                            await this.sendMessage(openQuestion.questionId.question, messageBody.From, phoneNumber)
                            return
                        }
                        else if(isInteger == 0 || isInteger > await this.countAvailableCity(user[0]._id, question[0]._id, openOrder._id)){ //cambiar en caso de añadir otra opción al menu
                            let message = await this.errorMessageService.findErrorMessage(2, language.order)
                            await this.sendMessage(message.message, messageBody.From, phoneNumber)
                            await this.sendMessage(openQuestion.questionId.question, messageBody.From, phoneNumber)
                            return
                        }

                        let validation = await this.validateCity(messageBody.Body, user[0]._id, question[0]._id, openOrder._id)

                        if(validation.success == false){

                            let message = await this.errorMessageService.findErrorMessage(4, language.order)
                            await this.sendMessage(message.message, messageBody.From, phoneNumber)
                            await this.sendMessage(openQuestion.questionId.question, messageBody.From, phoneNumber)
                            return

                        }

                        await this.askedQuestionService.updateOpenQuestionWithReply(openQuestion._id, validation.city, openOrder ? openOrder._id : null)
                        await this.showQuestion(9, messageBody, phoneNumber)

                    }

                    else if(openQuestion.questionId.order == 9){ 

                        let cityValidation = await this.validateDate(messageBody.Body)
                        if(!cityValidation.success){

                            let message = await this.errorMessageService.findErrorMessage(cityValidation.order, language.order)
                            await this.sendMessage(message.message, messageBody.From, phoneNumber)
                            await this.sendMessage(openQuestion.questionId.question, messageBody.From, phoneNumber)
                            return

                        }

                        let openOrder = await this.orderService.findOpenOrder(user[0]._id)
                        await this.askedQuestionService.updateOpenQuestionWithReply(openQuestion._id, messageBody.Body, openOrder ? openOrder._id : null)
                        await this.showQuestion(10, messageBody, phoneNumber)

                    }
                    else if(openQuestion.questionId.order == 10){ 

                        let openOrder = await this.orderService.findOpenOrder(user[0]._id)
                        let cityValidation = await this.validateDate(messageBody.Body)
                        if(!cityValidation.success){

                            let message = await this.errorMessageService.findErrorMessage(cityValidation.order, language.order)
                            await this.sendMessage(message.message, messageBody.From, phoneNumber)
                            await this.sendMessage(openQuestion.questionId.question, messageBody.From, phoneNumber)
                            return

                        }


                        let departureDate = await this.getReply(openOrder._id, 9, language.order, user[0]._id)
                        let departureDateReply = departureDate.reply

                        let departureDateValidation = await this.validateDateBothDates(departureDateReply, messageBody.Body)
                        if(!departureDateValidation.success){

                            let message = await this.errorMessageService.findErrorMessage(departureDateValidation.order, language.order)
                            await this.sendMessage(message.message, messageBody.From, phoneNumber)
                            await this.sendMessage(openQuestion.questionId.question, messageBody.From, phoneNumber)
                            return

                        }

                        
                        await this.askedQuestionService.updateOpenQuestionWithReply(openQuestion._id, messageBody.Body, openOrder ? openOrder._id : null)
                        await this.showQuestion(11, messageBody, phoneNumber)

                    }

                    else if(openQuestion.questionId.order == 11){ 

                        let openOrder = await this.orderService.findOpenOrder(user[0]._id)
                        await this.askedQuestionService.updateOpenQuestionWithReply(openQuestion._id, messageBody.Body, openOrder ? openOrder._id : null)

                        //console.log(openOrder, language, user[0])

                        await this.showQuestion(12, messageBody, phoneNumber)
                        let message = await this.getAddress(openOrder._id, language.order, user[0]._id)
                        await this.sendMessage(message, messageBody.From, phoneNumber)
                        

                    }

                    else if(openQuestion.questionId.order == 12){ 

                        let openOrder = await this.orderService.findOpenOrder(user[0]._id)
                        
                        let isInteger = await this.validateInteger(messageBody)
                        if(!isInteger){
                            
                            let message = await this.errorMessageService.findErrorMessage(1, language.order)
                            await this.sendMessage(message.message, messageBody.From, phoneNumber)
                            await this.sendMessage(openQuestion.questionId.question, messageBody.From, phoneNumber)
                            return
                        }

                        else if(isInteger < 0 || isInteger > await this.countAddress(openOrder._id, language.order, user[0]._id)){ //cambiar en caso de añadir otra opción al menu
                            let message = await this.errorMessageService.findErrorMessage(2, language.order)
                            await this.sendMessage(message.message, messageBody.From, phoneNumber)
                            await this.sendMessage(openQuestion.questionId.question, messageBody.From, phoneNumber)
                            return
                        }

                        else if(messageBody.Body == 0){

                            await this.deleteAskedQuestion(openOrder._id, 12, language.order, user[0]._id)
                            await this.deleteAskedQuestion(openOrder._id, 11, language.order, user[0]._id)
                            await this.showQuestion(11, messageBody, phoneNumber)
                            return
                        }

                        let validation = await this.validateAddress(messageBody.Body, openOrder._id, language.order, user[0]._id)
                        
                        await this.askedQuestionService.updateOpenQuestionWithReply(openQuestion._id, validation, openOrder ? openOrder._id : null)
                        await this.showQuestion(13, messageBody, phoneNumber)

                    }

                    else if(openQuestion.questionId.order == 13){

                        if(!messageBody.MediaContentType0){

                            let message = await this.errorMessageService.findErrorMessage(7, language.order)
                            await this.sendMessage(message.message, messageBody.From, phoneNumber)
                            await this.sendMessage(openQuestion.questionId.question, messageBody.From, phoneNumber)
                            return 
                        }   

                        if(messageBody.MediaContentType0.indexOf("image") <= -1){

                            let message = await this.errorMessageService.findErrorMessage(7, language.order)
                            await this.sendMessage(message.message, messageBody.From,phoneNumber)
                            await this.sendMessage(openQuestion.questionId.question, messageBody.From, phoneNumber)
                            return

                        }

                        let openOrder = await this.orderService.findOpenOrder(user[0]._id)
                        await this.askedQuestionService.updateOpenQuestionWithReply(openQuestion._id, messageBody.MediaUrl0, openOrder ? openOrder._id : null)
                        await this.showQuestion(14, messageBody, phoneNumber)

                    }

                    else if(openQuestion.questionId.order == 14){
                        
                        if(!await this.validateEmail(messageBody.Body)){

                            let message = await this.errorMessageService.findErrorMessage(8, language.order)
                            await this.sendMessage(message.message, messageBody.From, phoneNumber)
                            await this.sendMessage(openQuestion.questionId.question, messageBody.From, phoneNumber)
                            return

                        }

                        let openOrder = await this.orderService.findOpenOrder(user[0]._id)
                        await this.askedQuestionService.updateOpenQuestionWithReply(openQuestion._id, messageBody.Body.toLowerCase(), openOrder ? openOrder._id : null)
                        await this.showQuestion(15, messageBody, phoneNumber)

                    }

                    else if(openQuestion.questionId.order == 15){
                        
                        if(!await this.validatePhone(messageBody.Body)){

                            let message = await this.errorMessageService.findErrorMessage(9, language.order)
                            await this.sendMessage(message.message, messageBody.From, phoneNumber)
                            await this.sendMessage(openQuestion.questionId.question, messageBody.From, phoneNumber)
                            return

                        }

                        let openOrder = await this.orderService.findOpenOrder(user[0]._id)
                        await this.askedQuestionService.updateOpenQuestionWithReply(openQuestion._id, messageBody.Body.split(' ').join(''), openOrder ? openOrder._id : null)
                        await this.showQuestion(16, messageBody, phoneNumber)

                    }

                    else if(openQuestion.questionId.order == 16){
                        

                        let openOrder = await this.orderService.findOpenOrder(user[0]._id)
                        await this.askedQuestionService.updateOpenQuestionWithReply(openQuestion._id, messageBody.Body, openOrder ? openOrder._id : null)

                        await this.showQuestion(17, messageBody, phoneNumber)
                        let message = await this.getAvailableCountries()
                        await this.sendMessage(message, messageBody.From, phoneNumber)

                        

                    }

                    else if(openQuestion.questionId.order == 17){

                        
                        let isInteger = await this.validateInteger(messageBody)
                        if(!isInteger){
                            
                            let message = await this.errorMessageService.findErrorMessage(1, language.order)
                            await this.sendMessage(message.message, messageBody.From, phoneNumber)
                            await this.sendMessage(openQuestion.questionId.question, messageBody.From, phoneNumber)
                            return
                        }
                        else if(isInteger == 0 || isInteger > await this.countAvailableCountries()){ //cambiar en caso de añadir otra opción al menu
                            let message = await this.errorMessageService.findErrorMessage(2, language.order)
                            await this.sendMessage(message.message, messageBody.From, phoneNumber)
                            await this.sendMessage(openQuestion.questionId.question, messageBody.From, phoneNumber)
                            return
                        }


                        
                        let validation = await this.validateCountry(messageBody.Body)
                        if(!validation.success){

                            let message = await this.errorMessageService.findErrorMessage(10, language.order)
                            await this.sendMessage(message.message, messageBody.From, phoneNumber)
                            await this.sendMessage(openQuestion.questionId.question, messageBody.From, phoneNumber)
                            return

                        }

                        await this.askedQuestionService.updateOpenQuestionWithReply(openQuestion._id, validation.country, openOrder ? openOrder._id : null)

                        let question = await this.questionService.findByOrderAndLanguage(17, language._id)
                        let openOrderCountry = await this.orderService.findOpenOrder(user[0]._id)

                        await this.showQuestion(18, messageBody, phoneNumber)
                        let message = await this.getAvailableCities(user[0]._id, question[0]._id, openOrderCountry._id)
                        await this.sendMessage(message, messageBody.From, phoneNumber)

                        

                    }

                    else if(openQuestion.questionId.order == 18){

                        
                        let question = await this.questionService.findByOrderAndLanguage(17, language._id)
                        let openOrder = await this.orderService.findOpenOrder(user[0]._id)

                        let isInteger = await this.validateInteger(messageBody)
                        if(!isInteger){
                            
                            let message = await this.errorMessageService.findErrorMessage(1, language.order)
                            await this.sendMessage(message.message, messageBody.From, phoneNumber)
                            await this.sendMessage(openQuestion.questionId.question, messageBody.From, phoneNumber)
                            return
                        }
                        else if(isInteger == 0 || isInteger > await this.countAvailableCity(user[0]._id, question[0]._id, openOrder._id)){ //cambiar en caso de añadir otra opción al menu
                            let message = await this.errorMessageService.findErrorMessage(2, language.order)
                            await this.sendMessage(message.message, messageBody.From, phoneNumber)
                            await this.sendMessage(openQuestion.questionId.question, messageBody.From, phoneNumber)
                            return
                        }

                        let validation = await this.validateCity(messageBody.Body, user[0]._id, question[0]._id, openOrder._id)

                        if(validation.success == false){

                            let message = await this.errorMessageService.findErrorMessage(4, language.order)
                            await this.sendMessage(message.message, messageBody.From, phoneNumber)
                            await this.sendMessage(openQuestion.questionId.question, messageBody.From, phoneNumber)
                            return

                        }

                        await this.askedQuestionService.updateOpenQuestionWithReply(openQuestion._id, validation.city, openOrder ? openOrder._id : null)
                        await this.showQuestion(19, messageBody, phoneNumber)
                        

                    }

                    else if(openQuestion.questionId.order == 19){

                        let openOrder = await this.orderService.findOpenOrder(user[0]._id)

                        let isInteger = await this.validateInteger(messageBody)
                        if(!isInteger){
                            
                            let message = await this.errorMessageService.findErrorMessage(1, language.order)
                            await this.sendMessage(message.message, messageBody.From, phoneNumber)
                            await this.sendMessage(openQuestion.questionId.question, messageBody.From, phoneNumber)
                            return
                        }
                        else if(isInteger == 0 || isInteger > 2){ //cambiar en caso de añadir otra opción al menu
                            let message = await this.errorMessageService.findErrorMessage(2, language.order)
                            await this.sendMessage(message.message, messageBody.From, phoneNumber)
                            await this.sendMessage(openQuestion.questionId.question, messageBody.From, phoneNumber)
                            return
                        }

                        let selection = ""
                        if(messageBody.Body == "1"){
                            selection = "paypal"
                        }
                        else if(messageBody.Body == "2"){
                            selection = "stripe"
                        }

                        await this.askedQuestionService.updateOpenQuestionWithReply(openQuestion._id, selection, openOrder ? openOrder._id : null)
                        
                        let answer = await this.storeShippingRequest(openOrder, language, user[0])

                        if(answer == true){

                            let message = await this.successMessageService.findSuccessMessage(1,  language.order)
                            await this.sendMessage(message.message, messageBody.From, phoneNumber)
                        }else{



                        }
             
                        //await this.orderService.update(openOrder._id, "closed");

                        //let message = await this.successMessageService.findSuccessMessage(1,  language.order)
     
                        //

                    }

                    else if(openQuestion.questionId.order == 20){
                        
                        if(!await this.validateEmail(messageBody.Body)){

                            let message = await this.errorMessageService.findErrorMessage(8, language.order)
                            await this.sendMessage(message.message, messageBody.From, phoneNumber)
                            await this.sendMessage(openQuestion.questionId.question, messageBody.From, phoneNumber)
                            return

                        }

                        await this.askedQuestionService.updateOpenQuestionWithReply(openQuestion._id, messageBody.Body, null)
                        let ads = await this.getPackages(messageBody.Body)
                        if(ads.length == 0){

                            let message = await this.errorMessageService.findErrorMessage(11, language.order)
                            await this.sendMessage(message.message, messageBody.From, phoneNumber)
                            return

                        }

                    }

                    

                    

                }
                else{

                    await this.showQuestion(2, messageBody, phoneNumber)

                }

                

            }   


        } catch (e) {
            console.log(e)
        }
    }

    textTransformation(text){

        let splittedText = text.split("|")

        let finalText = "";

        for(let textIndex = 0; textIndex < splittedText.length; textIndex++){
            finalText += splittedText[textIndex]+"\n"

        }

        return finalText

    }

    async sendMessage(body, to, phoneNumber){
        
        if(phoneNumber.indexOf("whatsapp") > -1){

            try{
                await this.client.messages.create({
                    body: body, 
                    from: phoneNumber,       
                    to: to
                });
            }catch (e) {
                console.log(e)
            }


        }else{

            try{
                await this.client.messages.create({
                    body: body, 
                    from: phoneNumber,       
                    to: to
                });
            }catch (e) {
                console.log(e)
            }


        }

        

    }

    async setUserLanguage(userId, question, reply){

        if(question.questionId.order == 1){

            let language = await this.languageService.findByOrder(reply)
            return await this.userService.updateLanguage(userId, language._id)

        }


    }


    async askForLanguage(messageBody, language, phoneNumber){
        
        let storedUser = await this.userService.store(messageBody.From, language._id)
                
        let body = await this.questionService.findByOrderAndLanguage(1, language._id)
        await this.askedQuestionService.store(storedUser._id, body[0], null)
        
        await this.sendMessage(this.textTransformation(body[0].question), messageBody.From, phoneNumber)

    }

    async validateInteger(messageBody){
     
        if(Number.isInteger(parseInt(messageBody.Body))){
            return messageBody.Body
        }else{
            return false
        }
    }

    async validateFloat(messageBody){
     
        if(!isNaN(messageBody.Body)){
            return messageBody.Body
        }else{
            return false
        }
    }

    async updateUserLanguage(openQuestion, messageBody, user){

        await this.askedQuestionService.updateOpenQuestionWithReply(openQuestion._id, messageBody.Body, null)
        await this.setUserLanguage(user[0]._id, openQuestion, messageBody.Body)

    }

    async showQuestion(order, messageBody, phoneNumber){
        
        let user = await this.userService.findUserByPhone(messageBody.From)
        let body = await this.questionService.findByOrderAndLanguage(order, user[0].languageId._id)
        let openOrder = await this.orderService.findOpenOrder(user[0]._id)
        
        await this.askedQuestionService.store(user[0]._id, body[0], openOrder ? openOrder._id : null)
        
        await this.sendMessage(this.textTransformation(body[0].question), messageBody.From, phoneNumber)

    }

    async validateCity(city, userId, questionId, openOrderId){

        let askedQuestion = await this.askedQuestionService.getQuestionAsked(userId, questionId, openOrderId)
        let response = await this.httpService.get(process.env.API_URL+"getAiports").toPromise()
        let countries = response.data.contriesOrigin
        let found = false
        let foundAt = 0
        let cities = []

        for(let i = 0; i < countries.length; i++){

            if(countries[i].name == askedQuestion.reply){

                cities = countries[i].aiports
                for(let j = 0; j < cities.length; j++){

                    let index = j + 1

                    if(city == index){
                        found = true
                        foundAt = j
                    }

                }

            }

        }

        if(found == true){

            return {city: cities[foundAt].city, "success": true}

        }else{
            return {"success": false}
        }

    }

    async validateCountry(country){

        let response = await this.httpService.get(process.env.API_URL+"getAiports").toPromise()
        let countries = response.data.contriesOrigin
        let found = false
        let foundAt = 0
        
        for(let i = 0; i < countries.length; i++){

            let index = i + 1

            if(country == index){
                found = true
                foundAt = i
            }

        }
        
        if(found == true){

            return {country: countries[foundAt].name, "success": true}

        }else{
            return {"success": false}
        }

    }

    async countAvailableCountries(){

        let response = await this.httpService.get(process.env.API_URL+"getAiports").toPromise()
        let countries = response.data.contriesOrigin

        return countries.length

    }

    async countAvailableCity(userId, questionId, openOrderId){

        let askedQuestion = await this.askedQuestionService.getQuestionAsked(userId, questionId, openOrderId)
        let response = await this.httpService.get(process.env.API_URL+"getAiports").toPromise()
        let countries = response.data.contriesOrigin
        let cities = []

        for(let i = 0; i < countries.length; i++){

            if(countries[i].name == askedQuestion.reply){

                cities = countries[i].aiports
                

            }

        }

        return cities.length

    }

    async getAvailableCountries(){

        let response = await this.httpService.get(process.env.API_URL+"getAiports").toPromise()
        let countries = response.data.contriesOrigin
        let finalText = ""
        
        for(let i = 0; i < countries.length; i++){

            let index = i + 1

            finalText += index+"-"+countries[i].name+"\n"

        }

        return finalText
        

    }

    async getAvailableCities(userId, questionId, openOrderId){

        let askedQuestion = await this.askedQuestionService.getQuestionAsked(userId, questionId, openOrderId)
        let response = await this.httpService.get(process.env.API_URL+"getAiports").toPromise()
        let countries = response.data.contriesOrigin
        let finalText = ""
        let cities = []
        
        for(let i = 0; i < countries.length; i++){

            if(countries[i].name == askedQuestion.reply){

                cities = countries[i].aiports
                for(let j = 0; j < cities.length; j++){

                    let index = j + 1

                    finalText += index+"-"+cities[j].city + "\n"

                }

            }

        }

        return finalText

    }

    async validateDate(date){

        let today = new Date();
        let split = date.split(" ")

        if(split.length > 2 || split.length < 2){
    
            return {"success": false, "order": 5}
        }

        let dateArray = split[0].split("-")
        let timeArray = split[1].split(":")


        if(dateArray.length == 0){
            
            return {"success": false, "order": 5}
        }

        if(dateArray[0].length < 4 || dateArray[0].length > 4){
           
            return {"success": false, "order": 5}
        }

        if(dateArray[0] < today.getFullYear()){
    
            return {"success": false, "order": 6}
        }

        if(dateArray[1].length < 2 || dateArray[1].length > 2){
   
            return {"success": false, "order": 5}
        }

        if(dateArray[0] <= today.getFullYear() && dateArray[1] < today.getMonth() + 1){

            return {"success": false, "order": 6}
        }
        

        if(dateArray[1] > 12){
            return {"success": false, "order": 5}
        }

        if(dateArray[2].length < 2 || dateArray[2].length > 2){
   
            return {"success": false, "order": 5}
        }

        if(dateArray[0] <= today.getFullYear() && dateArray[1] <= today.getMonth() + 1 && dateArray[2] < today.getDate() - 1){
        
            return {"success": false, "order": 6}
        }

        var lastDayOfMonth = new Date(today.getFullYear(), today.getMonth()+1, 0);

        if(dateArray[2] > lastDayOfMonth.getDate()){
        
            return {"success": false, "order": 5}
        }

        if(timeArray[0].length < 2 || timeArray[0].length > 2){
   
            return {"success": false, "order": 5}
        }

        if(timeArray[0] < 0 || timeArray[0] > 23){
           
            return {"success": false, "order": 5}
        }

        if(timeArray[1].length < 2 || timeArray[1].length > 2){
   
            return {"success": false, "order": 5}
        }

        if(timeArray[1] < 0 || timeArray[1] > 59){
        
            return {"success": false, "order": 5}
        }

        //return {"success": false, "order": 5}
        return {"success": true}


    }

    async validateDateBothDates(departureDate, destinationDate){

        let today = new Date();
        let splitDeparture = departureDate.split(" ")
        let splitDestination = destinationDate.split(" ")

        let dateDepartureArray = splitDeparture[0].split("-")
        let timeDepartureArray = splitDeparture[1].split(":")

        let dateDestinationArray = splitDestination[0].split("-")
        let timeDestinationArray = splitDestination[1].split(":")

        if(dateDestinationArray[0] < dateDepartureArray[0]){
    
            return {"success": false, "order": 12}
        }

        if(dateDestinationArray[0] <= dateDepartureArray[0] && dateDestinationArray[1] < dateDepartureArray[1]){

            return {"success": false, "order": 12}
        }

        if(dateDestinationArray[0] <= dateDepartureArray[0] && dateDestinationArray[1] <= dateDepartureArray[1] && dateDestinationArray[2] < dateDepartureArray[2]){
        
            return {"success": false, "order": 12}
        }

        
        return {"success": true}


    }

    async validateEmail(email){

        if(/^[a-z0-9][a-z0-9-_\.]+@([a-z]|[a-z0-9]?[a-z0-9-]+[a-z0-9])\.[a-z0-9]{2,10}(?:\.[a-z]{2,10})?$/.test(email.toLowerCase())){
            return true
        }

        return false


    }

    async validatePhone(phone){

        let trimedPhone = phone.split(' ').join('')
        let isNumber = true
        for(let i = 0; i < trimedPhone.length; i++){
            
            if(!Number.isInteger(parseInt(trimedPhone.charAt(i)))){

                if(trimedPhone.charAt(i) == '+'){
                    isNumber = true
                }else{
                    isNumber = false
                }
                

            }

        }

        return isNumber

    }

    async getPackages(email){

        let response = await this.httpService.post(process.env.API_URL+"tw-mysAd", {
            "email": "twilio@twilio.com",
            "email_client": email
        }).toPromise()

        
        let ads = response.data.adsBD

        if(ads.length > 0){
            
        }else{

            return ads

        }
    }

    async storeShippingRequest(openOrder, language, user){

        let packageTitle = await this.getReply(openOrder._id, 3, language.order, user._id)
        let packageTitleReply = packageTitle.reply

        let departureCountry = await this.getReply(openOrder._id, 5, language.order, user._id)
        let departureCountryReply = departureCountry.reply

        let departureCity = await this.getReply(openOrder._id, 6, language.order, user._id)
        let departureCityReply = departureCity.reply

        let destinationCountry = await this.getReply(openOrder._id, 7, language.order, user._id)
        let destinationCountryReply = destinationCountry.reply

        let destinationCity = await this.getReply(openOrder._id, 8, language.order, user._id)
        let destinationCityReply = destinationCity.reply

        let departureDate = await this.getReply(openOrder._id, 9, language.order, user._id)
        let departureDateReply = departureDate.reply

        let destinationDate = await this.getReply(openOrder._id, 10, language.order, user._id)
        let destinationDateReply = destinationDate.reply

        let deliveryAddress = await this.getReply(openOrder._id, 12, language.order, user._id)
        let deliveryAddressReply = deliveryAddress.reply

        let packagePicture = await this.getReply(openOrder._id, 13, language.order, user._id)
        const packagePictureReply = packagePicture.reply

        let clientEmail = await this.getReply(openOrder._id, 14, language.order, user._id)
        let clientEmailReply = clientEmail.reply

        let clientPhoneNumber = await this.getReply(openOrder._id, 15, language.order, user._id)
        let clientPhoneNumberReply = clientPhoneNumber.reply

        let clientFullName = await this.getReply(openOrder._id, 16, language.order, user._id)
        let clientFullNameReply = clientFullName.reply

        let clientCountry = await this.getReply(openOrder._id, 17, language.order, user._id)
        let clientCountryReply = clientCountry.reply

        let clientCity = await this.getReply(openOrder._id, 18, language.order, user._id)
        let clientCityReply = clientCity.reply

        let paymentMethod = await this.getReply(openOrder._id, 19, language.order, user._id)
        let paymentMethodReply = paymentMethod.reply

        let dest = "./dist/images/"+uuidv4()+".png"

        const writer = fs.createWriteStream(dest);

        const response = await this.httpService.axiosRef({
            url: packagePictureReply,
            method: 'GET',
            responseType: 'stream',
        });

        await response.data.pipe(writer);
        
        let dest2 = dest.replace(".", "").replace(/\//g, '\\');
        let path = process.env.BASE_PATH+dest2

        const file = await fs.readFileSync(path);

        const form = new FormData();
        form.append("email", "twilio-test@twilio.com")
        form.append("title", packageTitleReply) 
        form.append("cityDeparture", departureCityReply) 
        form.append("cityDestination", destinationCityReply) 
        form.append("countryDeparture", departureCountryReply)
        form.append("countryDestination", destinationCountryReply) 
        form.append("departureDate", departureDateReply)
        form.append("arrivalDate", destinationDateReply)
        form.append("delivery", deliveryAddressReply)
        form.append("image", file, 'image.png')
        form.append("email_client", clientEmailReply)
        form.append("phone_client", clientPhoneNumberReply) 
        form.append("fullName_client", clientFullNameReply) 
        form.append("country_client", clientCountryReply) 
        form.append("city_client", clientCityReply)
        form.append("paymentMethod", paymentMethodReply)
        
        try{

            let responseStore = await this.httpService.post(process.env.API_URL+"tw-createAd-test", form, {
                headers: {
                    ...form.getHeaders(),
                }
            }).toPromise()

            if(responseStore.data.ok == true){
                return true
            }else{
                return false
            }
            
            

        }catch(err){
            
            return false
        }


    }

    async getReply(orderId, questionOrder, languageOrder, userId){

        let language = await this.languageService.findByOrder(languageOrder)
        let question = await this.questionService.findByOrderAndLanguage(questionOrder, language._id)

        let askedQuestion = await this.askedQuestionService.getQuestionAsked(userId, question[0]._id, orderId)

        return askedQuestion

    }

    async getAddress(openOrder, language, user){

        let deliveryAddress = await this.getReply(openOrder._id, 11, language, user._id)
        let address = deliveryAddress.reply

        let newAddress = address.toLowerCase().replace(/á/g, 'a')
        newAddress = newAddress.toLowerCase().replace(/é/g, 'e')
        newAddress = newAddress.toLowerCase().replace(/í/g, 'i')
        newAddress = newAddress.toLowerCase().replace(/ó/g, 'o')
        newAddress = newAddress.toLowerCase().replace(/ú/g, 'u')

        let response = await this.httpService.post(process.env.API_URL+"tw-searchAddressDelivery-test", {
            "email": "twilio-test@twilio.com",
            "address": newAddress
        }).toPromise()

        let addresses = response.data.resp.results

        let finalText = ""
        
        for(let i = 0; i < addresses.length; i++){

            let index = i + 1

            finalText += index+"-"+addresses[i].formatted_address+"\n"

        }

        return finalText

    }

    async countAddress(openOrder, language, user){

        let deliveryAddress = await this.getReply(openOrder._id, 11, language, user._id)
        let address = deliveryAddress.reply

        let newAddress = address.toLowerCase().replace(/á/g, 'a')
        newAddress = newAddress.toLowerCase().replace(/é/g, 'e')
        newAddress = newAddress.toLowerCase().replace(/í/g, 'i')
        newAddress = newAddress.toLowerCase().replace(/ó/g, 'o')
        newAddress = newAddress.toLowerCase().replace(/ú/g, 'u')

        let response = await this.httpService.post(process.env.API_URL+"tw-searchAddressDelivery-test", {
            "email": "twilio-test@twilio.com",
            "address": newAddress
        }).toPromise()

        let addresses = response.data.resp.results

        return addresses.length

    }

    async validateAddress(selectedAddress, openOrder, language, user){

        let deliveryAddress = await this.getReply(openOrder._id, 11, language, user._id)
        let address = deliveryAddress.reply

        let newAddress = address.toLowerCase().replace(/á/g, 'a')
        newAddress = newAddress.toLowerCase().replace(/é/g, 'e')
        newAddress = newAddress.toLowerCase().replace(/í/g, 'i')
        newAddress = newAddress.toLowerCase().replace(/ó/g, 'o')
        newAddress = newAddress.toLowerCase().replace(/ú/g, 'u')

        let response = await this.httpService.post(process.env.API_URL+"tw-searchAddressDelivery-test", {
            "email": "twilio-test@twilio.com",
            "address": newAddress
        }).toPromise()

        let addresses = response.data.resp.results
        let finalAddress = ""

        for(let i = 0; i < addresses.length; i++){

            let index = i + 1

            if(selectedAddress == index){

                finalAddress = addresses[i].formatted_address

            }

        }

        return finalAddress

    }

    async deleteAskedQuestion(orderId, questionOrder, languageOrder, userId){

        let language = await this.languageService.findByOrder(languageOrder)
        let question = await this.questionService.findByOrderAndLanguage(questionOrder, language._id)

        let askedQuestion = await this.askedQuestionService.deleteAskedQuestion(userId, question[0]._id, orderId)

        return askedQuestion

    }

    async downloadFile(url, dest){

        const writer = fs.createWriteStream(dest);

        const response = await this.httpService.axiosRef({
            url: url,
            method: 'GET',
            responseType: 'stream',
        });

        await response.data.pipe(writer);
        
        let path = ""
        let dest2 = ""
        if(process.env.SYS_OS == "windows"){
            dest2 = dest.replace(".", "").replace(/\//g, '\\');
            path = process.env.BASE_PATH+dest2
        }else{
            dest2 = dest.replace(".", "")
            path = process.env.BASE_PATH+dest2

        }
        
        

        const file = await fs.readFileSync(path);
       
        const form = new FormData();
        form.append("email", "twilio-test@twilio.com")
        form.append("title", "test") 
        form.append("cityDeparture", "Cartagena") 
        form.append("cityDestination", "Cartagena") 
        form.append("countryDeparture", "Colombia")
        form.append("countryDestination", "Colombia") 
        form.append("departureDate", "2021-11-30 12:00")
        form.append("arrivalDate", "2021-11-30 17:00")
        form.append("delivery", "test-address")
        form.append("image", file, 'image.png')
        form.append("email_client", "rodriguezwillian95@gmail.com")
        form.append("phone_client", "+584121081638") 
        form.append("fullName_client", "willian") 
        form.append("country_client", "Colombia") 
        form.append("city_client", "Cartagena")
        form.append("paymentMethod", "paypal")
        
        try{

            let responseStore = await this.httpService.post(process.env.API_URL+"tw-createAd-test", form, {
                headers: {
                    ...form.getHeaders(),
                }
            }).toPromise()

            console.log(responseStore.data.ok)

        }catch(err){
            console.log(err)
        }
        


        
        /*let payload = {
            
        }

        await this.storeShippingRequest(payload)*/

 

    }


}
