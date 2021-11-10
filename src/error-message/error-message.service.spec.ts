import { Test, TestingModule } from '@nestjs/testing';
import { ErrorMessageService } from './error-message.service';

describe('ErrorMessageService', () => {
  let service: ErrorMessageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ErrorMessageService],
    }).compile();

    service = module.get<ErrorMessageService>(ErrorMessageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
