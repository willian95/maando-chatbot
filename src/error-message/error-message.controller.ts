import { Controller } from '@nestjs/common';
import { ErrorMessageService } from './error-message.service';

@Controller('error-message')
export class ErrorMessageController {
  constructor(private readonly errorMessageService: ErrorMessageService) {}
}
