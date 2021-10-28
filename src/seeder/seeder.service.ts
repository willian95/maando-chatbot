import { Injectable } from '@nestjs/common';
import { Language, LanguageDocument } from '../schemas/languages.schema';

import { LanguageService } from '../language/language.service';
import { QuestionService } from '../question/question.service';

@Injectable()
export class SeederService {

    constructor(private readonly languageService:LanguageService, private readonly questionService:QuestionService) {}

    async seedLanguage() {

        let languages = [
            {
                "language": "English",
                "order": 1
            },
            {
                "language": "Español",
                "order": 2
            }
        ]

        for(let i = 0; i < languages.length; i++){


            if(!await this.languageService.findByLanguage(languages[i])){
                await this.languageService.store(languages[i])
            }
            

        }
       
    }

    async seedQuestion() {

        let questions = [
            {
                "question": "Choose a language. Press 1 for English, 2 for Español",
                "language": await this.languageService.findByLanguageSeeder("Español"),
                "order":1,
                "needReply":true
            },
            {
                "question": "¿Que deseas enviar?",
                "language": await this.languageService.findByLanguageSeeder("Español"),
                "order":2,
                "needReply":true
            },
            {
                "question": "What do you want to send?",
                "language": await this.languageService.findByLanguageSeeder("English"),
                "order":2,
                "needReply":true
            },
            {
                "question": "¿A donde enviarás?",
                "language": await this.languageService.findByLanguageSeeder("Español"),
                "order":3,
                "needReply":true
            },
            {
                "question": "Where will you send?",
                "language": await this.languageService.findByLanguageSeeder("English"),
                "order":3,
                "needReply":true
            },
            {
                "question": "Gracias por confiar en nosotros",
                "language": await this.languageService.findByLanguageSeeder("Español"),
                "order":4,
                "needReply":false
            },
            {
                "question": "Thank you for trusting us",
                "language": await this.languageService.findByLanguageSeeder("English"),
                "order":4,
                "needReply":false
            },
        ]

        for(let i = 0; i < questions.length; i++){
            console.log(questions[i])
            await this.questionService.store(questions[i])

        }
       
       
    }


}
