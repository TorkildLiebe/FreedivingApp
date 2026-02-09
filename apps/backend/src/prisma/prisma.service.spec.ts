import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have onModuleInit method', () => {
    expect(service.onModuleInit).toBeDefined();
  });

  it('should have onModuleDestroy method', () => {
    expect(service.onModuleDestroy).toBeDefined();
  });

  it('should call $connect on module init', async () => {
    const connectSpy = jest
      .spyOn(service, '$connect')
      .mockResolvedValue(undefined);

    await service.onModuleInit();

    expect(connectSpy).toHaveBeenCalled();
    connectSpy.mockRestore();
  });

  it('should call $disconnect on module destroy', async () => {
    const disconnectSpy = jest
      .spyOn(service, '$disconnect')
      .mockResolvedValue(undefined);

    await service.onModuleDestroy();

    expect(disconnectSpy).toHaveBeenCalled();
    disconnectSpy.mockRestore();
  });
});
