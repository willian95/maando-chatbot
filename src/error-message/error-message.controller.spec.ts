import { Test, TestingModule } from '@nestjs/testing';
import { ErrorMessageController } from './error-message.controller';
import { ErrorMessageService } from './error-message.service';

describe('ErrorMessageController', () => {
  let controller: ErrorMessageController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ErrorMessageController],
      providers: [ErrorMessageService],
    }).compile();

    controller = module.get<ErrorMessageController>(ErrorMessageController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
