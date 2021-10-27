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
                "language": "English"
            },
            {
                "language": "Español"
            }
        ]

        for(let i = 0; i < languages.length; i++){

            if(!await this.languageService.findByLanguage(languages[i].language)){
                await this.languageService.store(languages[i].language)
            }
            

        }
       
    }

    async seedQuestion() {

        let questions = [
            {
                "question": "Elige un idioma (choose a language) <br> 1- English<br> 2- Español",
                "language": await this.languageService.findByLanguage("Español")
            },
            {
                "question": "¿Que deseas enviar?",
                "language": await this.languageService.findByLanguage("Español")
            },
            {
                "question": "¿What do you want to send?",
                "language": await this.languageService.findByLanguage("English")
            },
        ]

        for(let i = 0; i < questions.length; i++){

            await this.questionService.store(questions[i])

        }
       
       
    }


}
