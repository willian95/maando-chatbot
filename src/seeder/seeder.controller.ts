import { Controller, Get } from '@nestjs/common';
import { SeederService } from './seeder.service';

@Controller('seeder')
export class SeederController {
  constructor(private readonly seederService: SeederService) {}

  @Get("languages")
  async languageSeed(){

    await this.seederService.seedLanguage()

  }

  @Get("questions")
  async questionSeed(){

    await this.seederService.seedQuestion()

  }

  @Get("error-message")
  async errorMessageSeed(){

    await this.seederService.seedErrorMessages()

  }

  @Get("success-message")
  async successMessageSeed(){

    await this.seederService.seedSuccessMessages()

  }

  

}
