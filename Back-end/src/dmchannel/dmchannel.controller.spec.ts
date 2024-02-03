import { Test, TestingModule } from '@nestjs/testing';
import { DmchannelController } from './dmchannel.controller';

describe('DmchannelController', () => {
  let controller: DmchannelController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DmchannelController],
    }).compile();

    controller = module.get<DmchannelController>(DmchannelController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
