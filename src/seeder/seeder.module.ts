import { Module } from '@nestjs/common';
import { SeederService } from './seeder.service';
import { SeederController } from './seeder.controller';
import { LanguageModule } from '../language/language.module';
import { QuestionModule } from '../question/question.module';

@Module({
  controllers: [SeederController],
  providers: [SeederService],
  imports: [
    LanguageModule,
    QuestionModule
  ],
})
export class SeederModule {}
