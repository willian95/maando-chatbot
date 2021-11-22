import { Injectable, HttpService } from '@nestjs/common';
import { InjectTwilio, TwilioClient } from 'nestjs-twilio';
import { AskedQuestionService } from '../asked-question/asked-question.service'
import { QuestionService } from '../question/question.service'
import { LanguageService } from '../language/language.service'
import { UserService } from '../user/user.service'
import { OrderService } from '../order/order.service'
import { ErrorMessageService } from '../error-message/error-message.service';
import { SuccessMessageService } from '../success-message/success-message.service';

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
                        
                        let message = await this.getAvailableCountries()
                        await this.sendMessage(message, messageBody.From, phoneNumber)
                        
                        await this.showQuestion(5, messageBody, phoneNumber)

                    }

                    //precio
                    /*else if(openQuestion.questionId.order == 4){

                        let isNumber = await this.validateFloat(messageBody)
                  
                        if(!isNumber){
                            
                            let message = await this.errorMessageService.findErrorMessage(1, language.order)
                            await this.sendMessage(message.message, messageBody.From)
                            await this.sendMessage(openQuestion.questionId.question, messageBody.From)
                            return
                        }
                        else if(isNumber < 30){

                            let message = await this.errorMessageService.findErrorMessage(3, language.order)
                            await this.sendMessage(message.message, messageBody.From)
                            await this.sendMessage(openQuestion.questionId.question, messageBody.From)
                            return

                        }
                        
                        let openOrder = await this.orderService.findOpenOrder(user[0]._id)
                        await this.askedQuestionService.updateOpenQuestionWithReply(openQuestion._id, messageBody.Body, openOrder ? openOrder._id : null)
                        await this.showQuestion(5, messageBody)

                    }*/

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
                        
                        let message = await this.getAvailableCities(user[0]._id, question[0]._id, openOrder._id)
                        await this.sendMessage(message, messageBody.From, phoneNumber)
                        
                        
                        await this.showQuestion(6, messageBody, phoneNumber)

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

                        let message = await this.getAvailableCountries()
                        await this.sendMessage(message, messageBody.From, phoneNumber)

                        await this.showQuestion(7, messageBody, phoneNumber)

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


                        let question = await this.questionService.findByOrderAndLanguage(7, language._id)
                        let openOrderCountry = await this.orderService.findOpenOrder(user[0]._id)
                        let message = await this.getAvailableCities(user[0]._id, question[0]._id, openOrderCountry._id)
                        await this.sendMessage(message, messageBody.From, phoneNumber)

                        await this.showQuestion(8, messageBody, phoneNumber)

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

                        let cityValidation = await this.validateDate(messageBody.Body)
                        if(!cityValidation.success){

                            let message = await this.errorMessageService.findErrorMessage(cityValidation.order, language.order)
                            await this.sendMessage(message.message, messageBody.From, phoneNumber)
                            await this.sendMessage(openQuestion.questionId.question, messageBody.From, phoneNumber)
                            return

                        }

                        let openOrder = await this.orderService.findOpenOrder(user[0]._id)
                        await this.askedQuestionService.updateOpenQuestionWithReply(openQuestion._id, messageBody.Body, openOrder ? openOrder._id : null)
                        await this.showQuestion(11, messageBody, phoneNumber)

                    }

                    else if(openQuestion.questionId.order == 11){ 

                        let openOrder = await this.orderService.findOpenOrder(user[0]._id)
                        await this.askedQuestionService.updateOpenQuestionWithReply(openQuestion._id, messageBody.Body, openOrder ? openOrder._id : null)
                        await this.showQuestion(12, messageBody, phoneNumber)

                    }

                    else if(openQuestion.questionId.order == 12){

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
                        await this.showQuestion(13, messageBody, phoneNumber)

                    }

                    else if(openQuestion.questionId.order == 13){
                        
                        if(!await this.validateEmail(messageBody.Body)){

                            let message = await this.errorMessageService.findErrorMessage(8, language.order)
                            await this.sendMessage(message.message, messageBody.From, phoneNumber)
                            await this.sendMessage(openQuestion.questionId.question, messageBody.From, phoneNumber)
                            return

                        }

                        let openOrder = await this.orderService.findOpenOrder(user[0]._id)
                        await this.askedQuestionService.updateOpenQuestionWithReply(openQuestion._id, messageBody.Body.toLowerCase(), openOrder ? openOrder._id : null)
                        await this.showQuestion(14, messageBody, phoneNumber)

                    }

                    else if(openQuestion.questionId.order == 14){
                        
                        if(!await this.validatePhone(messageBody.Body)){

                            let message = await this.errorMessageService.findErrorMessage(9, language.order)
                            await this.sendMessage(message.message, messageBody.From, phoneNumber)
                            await this.sendMessage(openQuestion.questionId.question, messageBody.From, phoneNumber)
                            return

                        }

                        let openOrder = await this.orderService.findOpenOrder(user[0]._id)
                        await this.askedQuestionService.updateOpenQuestionWithReply(openQuestion._id, messageBody.Body.split(' ').join(''), openOrder ? openOrder._id : null)
                        await this.showQuestion(15, messageBody, phoneNumber)

                    }

                    else if(openQuestion.questionId.order == 15){
                        

                        let openOrder = await this.orderService.findOpenOrder(user[0]._id)
                        await this.askedQuestionService.updateOpenQuestionWithReply(openQuestion._id, messageBody.Body, openOrder ? openOrder._id : null)

                        let message = await this.getAvailableCountries()
                        await this.sendMessage(message, messageBody.From, phoneNumber)

                        await this.showQuestion(16, messageBody, phoneNumber)

                    }

                    else if(openQuestion.questionId.order == 16){

                        
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

                        let question = await this.questionService.findByOrderAndLanguage(16, language._id)
                        let openOrderCountry = await this.orderService.findOpenOrder(user[0]._id)

                        let message = await this.getAvailableCities(user[0]._id, question[0]._id, openOrderCountry._id)
                        await this.sendMessage(message, messageBody.From, phoneNumber)

                        await this.showQuestion(17, messageBody, phoneNumber)

                    }

                    else if(openQuestion.questionId.order == 17){

                        
                        let question = await this.questionService.findByOrderAndLanguage(16, language._id)
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
                        
                
                        let payload = await this.createPayload(openOrder, language, user[0])
                        console.log(payload)
                        //await this.storeShippingRequest(payload)
                        await this.orderService.update(openOrder._id, "closed");

                        let message = await this.successMessageService.findSuccessMessage(1,  language.order)
     
                        await this.sendMessage(message.message, messageBody.From, phoneNumber)
                        

                    }

                    else if(openQuestion.questionId.order == 18){
                        
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

            //const MessagingResponse = require('twillio').twiml.MessagingResponse;
            //const twiml = new MessagingResponse()

            //twiml.message(body)
            console.log(phoneNumber)
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

        if(dateArray[0] < 2021){
    
            return {"success": false, "order": 6}
        }

        if(dateArray[1].length < 2 || dateArray[1].length > 2){
   
            return {"success": false, "order": 5}
        }

        if(dateArray[1] < today.getMonth() + 1){

            return {"success": false, "order": 6}
        }
        

        if(dateArray[1] > 12){
            return {"success": false, "order": 5}
        }

        if(dateArray[2].length < 2 || dateArray[2].length > 2){
   
            return {"success": false, "order": 5}
        }

        if(dateArray[2] < today.getDate() - 1){
        
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

    async createPayload(openOrder, language, user){

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

        let deliveryAddress = await this.getReply(openOrder._id, 11, language.order, user._id)
        let deliveryAddressReply = deliveryAddress.reply

        let packagePicture = await this.getReply(openOrder._id, 12, language.order, user._id)
        let packagePictureReply = packagePicture.reply

        let clientEmail = await this.getReply(openOrder._id, 13, language.order, user._id)
        let clientEmailReply = clientEmail.reply

        let clientPhoneNumber = await this.getReply(openOrder._id, 14, language.order, user._id)
        let clientPhoneNumberReply = clientPhoneNumber.reply

        let clientFullName = await this.getReply(openOrder._id, 15, language.order, user._id)
        let clientFullNameReply = clientFullName.reply

        let clientCountry = await this.getReply(openOrder._id, 16, language.order, user._id)
        let clientCountryReply = clientCountry.reply

        let clientCity = await this.getReply(openOrder._id, 17, language.order, user._id)
        let clientCityReply = clientCity.reply

        let payload = {
            "email": "twilio@twilio.com",
            "title": packageTitleReply, // Máximo 12 caracteres
            "price": "100", // Una cadena con un valor mínimo de 30
            "cityDeparture": departureCityReply, // Ciudad de salida, debe coincidir con “city” del listado de ciudades,
            "cityDestination": destinationCityReply, // Ciudad de entrega, debe coincidir con “city” del listado de ciudades,
            "countryDeparture": destinationCountryReply, // País de entrega, debe coincidir con “name” del listado de paises,
            "countryDestination": destinationCountryReply, // País de entrega, debe coincidir con “name” del listado de paises,
            "departureDate": departureDateReply, // fecha de salida del paquete
            "arrivalDate": destinationDateReply, // fecha de llegada del paquete
            "delivery": deliveryAddressReply, // Dirección del Lugar de entrega
            "image": packagePictureReply, // Imagen en formato File
            "email_client": clientEmailReply, // email del cliente
            "phone_client": clientPhoneNumberReply, // teléfono celular del cliente
            "fullName_client": clientFullNameReply, // Nombre completo del cliente
            "country_client": clientCountryReply, // debe coincidir con “name” del listado de paises,
            "city_client": clientCityReply
        }

        return payload

    }

    async getReply(orderId, questionOrder, languageOrder, userId){

        let language = await this.languageService.findByOrder(languageOrder)
        let question = await this.questionService.findByOrderAndLanguage(questionOrder, language._id)

        let askedQuestion = await this.askedQuestionService.getQuestionAsked(userId, question[0]._id, orderId)

        return askedQuestion

    }

    async storeShippingRequest(payload){

        let response = await this.httpService.post(process.env.API_URL+"tw-createAd", payload).toPromise()
        console.log(response)
    }


}
