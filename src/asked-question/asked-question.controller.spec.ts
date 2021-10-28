import { Test, TestingModule } from '@nestjs/testing';
import { AskedQuestionController } from './asked-question.controller';
import { AskedQuestionService } from './asked-question.service';

describe('AskedQuestionController', () => {
  let controller: AskedQuestionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AskedQuestionController],
      providers: [AskedQuestionService],
    }).compile();

    controller = module.get<AskedQuestionController>(AskedQuestionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
