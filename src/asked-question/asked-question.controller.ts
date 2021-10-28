import { Controller } from '@nestjs/common';
import { AskedQuestionService } from './asked-question.service';

@Controller('asked-question')
export class AskedQuestionController {
  constructor(private readonly askedQuestionService: AskedQuestionService) {}
}
