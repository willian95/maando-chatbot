import { Controller } from '@nestjs/common';
import { SuccessMessageService } from './success-message.service';

@Controller('success-message')
export class SuccessMessageController {
  constructor(private readonly successMessageService: SuccessMessageService) {}
}
