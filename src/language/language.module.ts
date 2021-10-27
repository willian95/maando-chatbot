import { Module } from '@nestjs/common';
import { LanguageService } from './language.service';
import { LanguageController } from './language.controller';
import { Language, LanguageSchema } from '../schemas/languages.schema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  controllers: [LanguageController],
  providers: [LanguageService],
  imports: [
    MongooseModule.forFeature([{ name: Language.name, schema: LanguageSchema }]),
  ],
  exports:[LanguageService]
})
export class LanguageModule {}
