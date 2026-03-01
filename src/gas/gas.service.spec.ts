import { Test } from '@nestjs/testing';
import { GasService } from './gas.service';
import { ProviderService } from '../blockchain/provider/provider.service';
import { ConfigService } from '@nestjs/config';
import { BigNumber } from 'ethers';

describe('GasService', () => {
  let gasService: GasService;

  const mockProvider = {
    getGasPrice: jest.fn(),
  };

  const providerServiceMock = {
    provider: mockProvider,
  } as unknown as ProviderService;

  const configServiceMock = {
    get: jest.fn((key: string) => {
      if (key === 'GAS_REFRESH_INTERVAL_MS') return '3000';
      return undefined;
    }),
  } as unknown as ConfigService;

  beforeEach(async () => {
    jest.useFakeTimers();
    mockProvider.getGasPrice.mockReset();

    const moduleRef = await Test.createTestingModule({
      providers: [
        GasService,
        { provide: ProviderService, useValue: providerServiceMock },
        { provide: ConfigService, useValue: configServiceMock },
      ],
    }).compile();

    gasService = moduleRef.get(GasService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('warms cache on module init', async () => {
    mockProvider.getGasPrice.mockResolvedValue(BigNumber.from('100'));

    await gasService.onModuleInit();

    const snapshot = gasService.getCachedGasPrice();
    expect(snapshot.gasPriceWei).toBe('100');
    expect(typeof snapshot.updatedAt).toBe('number');
  });

  it('refreshes cache in background', async () => {
    mockProvider.getGasPrice
      .mockResolvedValueOnce(BigNumber.from('100'))
      .mockResolvedValueOnce(BigNumber.from('200'));

    await gasService.onModuleInit();
    await jest.advanceTimersByTimeAsync(3000);

    const snapshot = gasService.getCachedGasPrice();
    expect(snapshot.gasPriceWei).toBe('200');
  });
});
