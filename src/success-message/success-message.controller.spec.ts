import { Test, TestingModule } from '@nestjs/testing';
import { SuccessMessageController } from './success-message.controller';
import { SuccessMessageService } from './success-message.service';

describe('SuccessMessageController', () => {
  let controller: SuccessMessageController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SuccessMessageController],
      providers: [SuccessMessageService],
    }).compile();

    controller = module.get<SuccessMessageController>(SuccessMessageController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
