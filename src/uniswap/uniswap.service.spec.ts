import { Test } from '@nestjs/testing';
import { UniswapService } from './uniswap.service';
import { ProviderService } from '../blockchain/provider/provider.service';
import { BigNumber, ethers } from 'ethers';
import { UNISWAP_V2_FACTORY, ZERO_ADDRESS } from './uniswap.abis';

// Mock ethers.Contract
jest.mock('ethers', () => {
  const actual = jest.requireActual('ethers');
  return {
    ...actual,
    ethers: {
      ...actual.ethers,
      Contract: jest.fn(),
    },
  };
});

describe('UniswapService', () => {
  let service: UniswapService;

  const providerMock = {
    getCode: jest.fn(),
  };

  const providerServiceMock = {
    provider: providerMock,
  } as unknown as ProviderService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        UniswapService,
        { provide: ProviderService, useValue: providerServiceMock },
      ],
    }).compile();

    service = moduleRef.get(UniswapService);
  });

  it('throws 400 if token address is not a contract', async () => {
    providerMock.getCode.mockResolvedValueOnce('0x'); // fromToken not contract
    providerMock.getCode.mockResolvedValueOnce('0x1234'); // toToken contract

    await expect(
      service.quoteExactIn({
        fromTokenAddress: '0x1111111111111111111111111111111111111111',
        toTokenAddress: '0x2222222222222222222222222222222222222222',
        amountIn: '1',
      }),
    ).rejects.toMatchObject({
      status: 400,
    });
  });

  it('throws 404 if pair does not exist', async () => {
    providerMock.getCode.mockResolvedValue('0x1234'); // both are contracts

    // contracts returned by ethers.Contract based on address
    (ethers.Contract as unknown as jest.Mock).mockImplementation(
      (address: string) => {
        // ERC20 token mocks
        if (address !== UNISWAP_V2_FACTORY) {
          return {
            decimals: () => Promise.resolve(18),
            symbol: () => Promise.resolve('TKN'),
          };
        }
        // Factory mock
        return {
          getPair: () => Promise.resolve(ZERO_ADDRESS),
        };
      },
    );

    await expect(
      service.quoteExactIn({
        fromTokenAddress: '0x1111111111111111111111111111111111111111',
        toTokenAddress: '0x2222222222222222222222222222222222222222',
        amountIn: '1',
      }),
    ).rejects.toMatchObject({
      status: 404,
    });
  });

  it('returns quote for happy path', async () => {
    providerMock.getCode.mockResolvedValue('0x1234'); // both are contracts

    const pairAddress = '0x3333333333333333333333333333333333333333';
    const tokenA = '0x1111111111111111111111111111111111111111';
    const tokenB = '0x2222222222222222222222222222222222222222';

    (ethers.Contract as unknown as jest.Mock).mockImplementation(
      (address: string) => {
        // Factory
        if (address === UNISWAP_V2_FACTORY) {
          return {
            getPair: () => Promise.resolve(pairAddress),
          };
        }

        // Pair
        if (address === pairAddress) {
          return {
            token0: () => Promise.resolve(tokenA),
            token1: () => Promise.resolve(tokenB),
            getReserves: () =>
              Promise.resolve({
                reserve0: BigNumber.from('100000000000000000000'),
                reserve1: BigNumber.from('200000000'),
                blockTimestampLast: 0,
              }),
          };
        }

        // ERC20 tokens
        if (address.toLowerCase() === tokenA.toLowerCase()) {
          return {
            decimals: () => Promise.resolve(18),
            symbol: () => Promise.resolve('WETH'),
          };
        }
        if (address.toLowerCase() === tokenB.toLowerCase()) {
          return {
            decimals: () => Promise.resolve(6),
            symbol: () => Promise.resolve('USDC'),
          };
        }

        return {};
      },
    );

    const out = await service.quoteExactIn({
      fromTokenAddress: tokenA,
      toTokenAddress: tokenB,
      amountIn: '1',
    });

    expect(out.pairAddress).toBe(pairAddress);
    expect(out.fromSymbol).toBe('WETH');
    expect(out.toSymbol).toBe('USDC');
    expect(Number(out.amountOut)).toBeGreaterThan(0);
  });
});
