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

    async message(messageBody) {
      
        try {

            let user = await this.userService.findUserByPhone(messageBody.From)
            let language = await this.languageService.findByLanguageSeeder("English")
            
            if(user.length == 0){
  
                this.askForLanguage(messageBody, language);

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
                            await this.sendMessage(message.message, messageBody.From)
                            await this.sendMessage(openQuestion.questionId.question, messageBody.From)
                            return
                        }
                        else if(isInteger == 0 || isInteger > countLanguages){
                            let message = await this.errorMessageService.findErrorMessage(2, language.order)
                            await this.sendMessage(message.message, messageBody.From)
                            await this.sendMessage(openQuestion.questionId.question, messageBody.From)
                            return
                        }
                        else{

                            await this.updateUserLanguage(openQuestion, messageBody, user)
                            await this.showQuestion(2, messageBody)

                        }

                    }

                    //menu
                    else if(openQuestion.questionId.order == 2){

                        let isInteger = await this.validateInteger(messageBody)
                        if(!isInteger){
                            
                            let message = await this.errorMessageService.findErrorMessage(1, language.order)
                            await this.sendMessage(message.message, messageBody.From)
                            await this.sendMessage(openQuestion.questionId.question, messageBody.From)
                            return
                        }
                        else if(isInteger == 0 || isInteger > 3){ //cambiar en caso de añadir otra opción al menu
                            let message = await this.errorMessageService.findErrorMessage(2, language.order)
                            await this.sendMessage(message.message, messageBody.From)
                            await this.sendMessage(openQuestion.questionId.question, messageBody.From)
                            return
                        }else{

                            await this.askedQuestionService.updateOpenQuestionWithReply(openQuestion._id, messageBody.Body, null)
                            if(messageBody.Body == "1"){

                                await this.orderService.store(user[0]._id)
                                await this.showQuestion(3, messageBody)

                            }else if(messageBody.Body == "2"){



                            }else if(messageBody.Body == "3"){



                            }

                        }

                    }

                    //titulo del paquete
                    else if(openQuestion.questionId.order == 3){

                        let openOrder = await this.orderService.findOpenOrder(user[0]._id)
                        await this.askedQuestionService.updateOpenQuestionWithReply(openQuestion._id, messageBody.Body, openOrder ? openOrder._id : null)
                        await this.showQuestion(5, messageBody)

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
                        
                        if(messageBody.Body.toUpperCase() == "X"){

                            let message = await this.getAvailableCountries()
                            await this.sendMessage(message, messageBody.From)
                            return

                        }
                        
                        let validation = await this.validateCountry(messageBody.Body)
                        if(validation.success == false){

                            let message = await this.errorMessageService.findErrorMessage(10, language.order)
                            await this.sendMessage(message.message, messageBody.From)
                            await this.sendMessage(openQuestion.questionId.question, messageBody.From)
                            return

                        }

                        let openOrder = await this.orderService.findOpenOrder(user[0]._id)
                        await this.askedQuestionService.updateOpenQuestionWithReply(openQuestion._id, validation.country, openOrder ? openOrder._id : null)
                        await this.showQuestion(6, messageBody)

                    }

                    else if(openQuestion.questionId.order == 6){                        
                 
                        let question = await this.questionService.findByOrderAndLanguage(5, language._id)
                        let openOrder = await this.orderService.findOpenOrder(user[0]._id)

                        if(messageBody.Body.toUpperCase() == "X"){

                            let message = await this.getAvailableCities(user[0]._id, question[0]._id, openOrder._id)
                            await this.sendMessage(message, messageBody.From)
                            return

                        }


                        let validation = await this.validateCity(messageBody.Body, user[0]._id, question[0]._id, openOrder._id)

                        if(validation.success == false){

                            let message = await this.errorMessageService.findErrorMessage(4, language.order)
                            await this.sendMessage(message.message, messageBody.From)
                            await this.sendMessage(openQuestion.questionId.question, messageBody.From)
                            return

                        }
                        
                        await this.askedQuestionService.updateOpenQuestionWithReply(openQuestion._id, validation.city, openOrder ? openOrder._id : null)
                        await this.showQuestion(7, messageBody)

                    }

                    else if(openQuestion.questionId.order == 7){       
                        
                        if(messageBody.Body.toUpperCase() == "X"){

                            let message = await this.getAvailableCountries()
                            await this.sendMessage(message, messageBody.From)
                            return

                        }
                        
                        let validation = await this.validateCountry(messageBody.Body)
                        if(validation.success == false){

                            let message = await this.errorMessageService.findErrorMessage(4, language.order)
                            await this.sendMessage(message.message, messageBody.From)
                            await this.sendMessage(openQuestion.questionId.question, messageBody.From)
                            return

                        }

                        let openOrder = await this.orderService.findOpenOrder(user[0]._id)
                        await this.askedQuestionService.updateOpenQuestionWithReply(openQuestion._id, validation.country, openOrder ? openOrder._id : null)
                        await this.showQuestion(8, messageBody)

                    }

                    else if(openQuestion.questionId.order == 8){                        
                        
                        let question = await this.questionService.findByOrderAndLanguage(7, language._id)
                        let openOrder = await this.orderService.findOpenOrder(user[0]._id)

                        if(messageBody.Body.toUpperCase() == "X"){

                            let message = await this.getAvailableCities(user[0]._id, question[0]._id, openOrder._id)
                            await this.sendMessage(message, messageBody.From)
                            return

                        }

                        let validation = await this.validateCity(messageBody.Body, user[0]._id, question[0]._id, openOrder._id)

                        if(validation.success == false){

                            let message = await this.errorMessageService.findErrorMessage(4, language.order)
                            await this.sendMessage(message.message, messageBody.From)
                            await this.sendMessage(openQuestion.questionId.question, messageBody.From)
                            return

                        }

                        await this.askedQuestionService.updateOpenQuestionWithReply(openQuestion._id, validation.city, openOrder ? openOrder._id : null)
                        await this.showQuestion(9, messageBody)

                    }

                    else if(openQuestion.questionId.order == 9){ 

                        let cityValidation = await this.validateDate(messageBody.Body)
                        if(!cityValidation.success){

                            let message = await this.errorMessageService.findErrorMessage(cityValidation.order, language.order)
                            await this.sendMessage(message.message, messageBody.From)
                            await this.sendMessage(openQuestion.questionId.question, messageBody.From)
                            return

                        }

                        let openOrder = await this.orderService.findOpenOrder(user[0]._id)
                        await this.askedQuestionService.updateOpenQuestionWithReply(openQuestion._id, messageBody.Body, openOrder ? openOrder._id : null)
                        await this.showQuestion(10, messageBody)

                    }
                    else if(openQuestion.questionId.order == 10){ 

                        let cityValidation = await this.validateDate(messageBody.Body)
                        if(!cityValidation.success){

                            let message = await this.errorMessageService.findErrorMessage(cityValidation.order, language.order)
                            await this.sendMessage(message.message, messageBody.From)
                            await this.sendMessage(openQuestion.questionId.question, messageBody.From)
                            return

                        }

                        let openOrder = await this.orderService.findOpenOrder(user[0]._id)
                        await this.askedQuestionService.updateOpenQuestionWithReply(openQuestion._id, messageBody.Body, openOrder ? openOrder._id : null)
                        await this.showQuestion(11, messageBody)

                    }

                    else if(openQuestion.questionId.order == 11){ 

                        let openOrder = await this.orderService.findOpenOrder(user[0]._id)
                        await this.askedQuestionService.updateOpenQuestionWithReply(openQuestion._id, messageBody.Body, openOrder ? openOrder._id : null)
                        await this.showQuestion(12, messageBody)

                    }

                    else if(openQuestion.questionId.order == 12){

                        if(messageBody.MediaContentType0.indexOf("image") <= -1){

                            let message = await this.errorMessageService.findErrorMessage(7, language.order)
                            await this.sendMessage(message.message, messageBody.From)
                            await this.sendMessage(openQuestion.questionId.question, messageBody.From)
                            return

                        }

                        let openOrder = await this.orderService.findOpenOrder(user[0]._id)
                        await this.askedQuestionService.updateOpenQuestionWithReply(openQuestion._id, messageBody.MediaUrl0, openOrder ? openOrder._id : null)
                        await this.showQuestion(13, messageBody)

                    }

                    else if(openQuestion.questionId.order == 13){
                        
                        if(!await this.validateEmail(messageBody.Body)){

                            let message = await this.errorMessageService.findErrorMessage(8, language.order)
                            await this.sendMessage(message.message, messageBody.From)
                            await this.sendMessage(openQuestion.questionId.question, messageBody.From)
                            return

                        }

                        let openOrder = await this.orderService.findOpenOrder(user[0]._id)
                        await this.askedQuestionService.updateOpenQuestionWithReply(openQuestion._id, messageBody.Body, openOrder ? openOrder._id : null)
                        await this.showQuestion(14, messageBody)

                    }

                    else if(openQuestion.questionId.order == 14){
                        
                        if(!await this.validatePhone(messageBody.Body)){

                            let message = await this.errorMessageService.findErrorMessage(9, language.order)
                            await this.sendMessage(message.message, messageBody.From)
                            await this.sendMessage(openQuestion.questionId.question, messageBody.From)
                            return

                        }

                        let openOrder = await this.orderService.findOpenOrder(user[0]._id)
                        await this.askedQuestionService.updateOpenQuestionWithReply(openQuestion._id, messageBody.Body.split(' ').join(''), openOrder ? openOrder._id : null)
                        await this.showQuestion(15, messageBody)

                    }

                    else if(openQuestion.questionId.order == 15){
                        

                        let openOrder = await this.orderService.findOpenOrder(user[0]._id)
                        await this.askedQuestionService.updateOpenQuestionWithReply(openQuestion._id, messageBody.Body, openOrder ? openOrder._id : null)
                        await this.showQuestion(16, messageBody)

                    }

                    else if(openQuestion.questionId.order == 16){

                        if(messageBody.Body.toUpperCase() == "X"){

                            let message = await this.getAvailableCountries()
                            await this.sendMessage(message, messageBody.From)
                            return

                        }
                        
                        let validation = await this.validateCountry(messageBody.Body)
                        if(!validation.success){

                            let message = await this.errorMessageService.findErrorMessage(4, language.order)
                            await this.sendMessage(message.message, messageBody.From)
                            await this.sendMessage(openQuestion.questionId.question, messageBody.From)
                            return

                        }

                        await this.askedQuestionService.updateOpenQuestionWithReply(openQuestion._id, validation.country, openOrder ? openOrder._id : null)
                        await this.showQuestion(17, messageBody)

                    }

                    else if(openQuestion.questionId.order == 17){
                        
                        let question = await this.questionService.findByOrderAndLanguage(16, language._id)
                        let openOrder = await this.orderService.findOpenOrder(user[0]._id)

                        if(messageBody.Body.toUpperCase() == "X"){

                            let message = await this.getAvailableCities(user[0]._id, question[0]._id, openOrder._id)
                            await this.sendMessage(message, messageBody.From)
                            return

                        }

                        let validation = await this.validateCity(messageBody.Body, user[0]._id, question[0]._id, openOrder._id)

                        if(validation.success == false){

                            let message = await this.errorMessageService.findErrorMessage(4, language.order)
                            await this.sendMessage(message.message, messageBody.From)
                            await this.sendMessage(openQuestion.questionId.question, messageBody.From)
                            return

                        }

                        await this.askedQuestionService.updateOpenQuestionWithReply(openQuestion._id, messageBody.Body, openOrder ? openOrder._id : null)
                        await this.orderService.update(openOrder._id, "closed");
                        let message = await this.successMessageService.findSuccessMessage(1,  language.order)
     
                        await this.sendMessage(message.message, messageBody.From)
                        


                    }

                    /*else{
                        await this.showQuestion(2, messageBody)
                    }*/

                    

                }
                else{

                    await this.showQuestion(2, messageBody)

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


    async askForLanguage(messageBody, language){
        
        let storedUser = await this.userService.store(messageBody.From, language._id)
                
        let body = await this.questionService.findByOrderAndLanguage(1, language._id)
        
        await this.askedQuestionService.store(storedUser._id, body[0], null)
        
        await this.sendMessage(this.textTransformation(body[0].question), messageBody.From)

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

    async showQuestion(order, messageBody){
        
        let user = await this.userService.findUserByPhone(messageBody.From)
 
        let body = await this.questionService.findByOrderAndLanguage(order, user[0].languageId._id)

        let openOrder = await this.orderService.findOpenOrder(user[0]._id)
        
        await this.askedQuestionService.store(user[0]._id, body[0], openOrder ? openOrder._id : null)
        
        await this.sendMessage(this.textTransformation(body[0].question), messageBody.From)

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

                    if(cities[j].city.toUpperCase().replace("Á", "A").replace("É", "E").replace("Í", "I").replace("Ó", "O").replace("Ú", "U") == city.toUpperCase().replace("Á", "A").replace("É", "E").replace("Í", "I").replace("Ó", "O").replace("Ú", "U")){

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

            if(countries[i].name.toUpperCase().replace("Á", "A").replace("É", "E").replace("Í", "I").replace("Ó", "O").replace("Ú", "U") == country.toUpperCase().replace("Á", "A").replace("É", "E").replace("Í", "I").replace("Ó", "O").replace("Ú", "U")){

                foundAt = i
                found = true
            }

        }

        
        if(found == true){

            return {country: countries[foundAt].name, "success": true}

        }else{
            return {"success": false}
        }

    }

    async getAvailableCountries(){

        let response = await this.httpService.get(process.env.API_URL+"getAiports").toPromise()
        let countries = response.data.contriesOrigin
        let finalText = ""
        
        for(let i = 0; i < countries.length; i++){

            finalText += countries[i].name+"\n"

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

                    finalText += cities[j].city + "\n"

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

        if(/^[a-z0-9][a-z0-9-_\.]+@([a-z]|[a-z0-9]?[a-z0-9-]+[a-z0-9])\.[a-z0-9]{2,10}(?:\.[a-z]{2,10})?$/.test(email)){
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



}
