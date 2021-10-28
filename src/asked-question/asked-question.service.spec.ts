import { Test, TestingModule } from '@nestjs/testing';
import { AskedQuestionService } from './asked-question.service';

describe('AskedQuestionService', () => {
  let service: AskedQuestionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AskedQuestionService],
    }).compile();

    service = module.get<AskedQuestionService>(AskedQuestionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
