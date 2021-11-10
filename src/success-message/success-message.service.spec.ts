import { Test, TestingModule } from '@nestjs/testing';
import { SuccessMessageService } from './success-message.service';

describe('SuccessMessageService', () => {
  let service: SuccessMessageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SuccessMessageService],
    }).compile();

    service = module.get<SuccessMessageService>(SuccessMessageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
