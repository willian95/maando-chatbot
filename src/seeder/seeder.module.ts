import { Module } from '@nestjs/common';
import { SeederService } from './seeder.service';
import { SeederController } from './seeder.controller';
import { LanguageModule } from '../language/language.module';
import { QuestionModule } from '../question/question.module';
import { ErrorMessageModule } from '../error-message/error-message.module';
import { SuccessMessageModule } from '../success-message/success-message.module';

@Module({
  controllers: [SeederController],
  providers: [SeederService],
  imports: [
    LanguageModule,
    QuestionModule,
    ErrorMessageModule,
    SuccessMessageModule
  ],
})
export class SeederModule {}
