import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ethers, BigNumber } from 'ethers';
import { ProviderService } from 'src/blockchain/provider/provider.service';
import {
  UNISWAP_V2_FACTORY,
  UNISWAP_V2_FACTORY_ABI,
  UNISWAP_V2_PAIR_ABI,
  ERC20_ABI,
  ZERO_ADDRESS,
} from './uniswap.abis';
import { getAmountOutExactIn } from './uniswap.math';

interface ERC20Contract extends ethers.Contract {
  decimals(): Promise<number>;
  symbol(): Promise<string>;
}

interface UniswapFactoryContract extends ethers.Contract {
  getPair(tokenA: string, tokenB: string): Promise<string>;
}

type Reserves = {
  reserve0: BigNumber;
  reserve1: BigNumber;
  blockTimestampLast: number;
};

interface UniswapPairContract extends ethers.Contract {
  token0(): Promise<string>;
  token1(): Promise<string>;
  getReserves(): Promise<Reserves>;
}

@Injectable()
export class UniswapService {
  constructor(private readonly providerService: ProviderService) {}

  async quoteExactIn(params: {
    fromTokenAddress: string;
    toTokenAddress: string;
    amountIn: string;
  }) {
    const { fromTokenAddress, toTokenAddress, amountIn } = params;

    if (fromTokenAddress.toLowerCase() === toTokenAddress.toLowerCase()) {
      throw new BadRequestException(
        'fromTokenAddress and toTokenAddress must differ',
      );
    }

    const provider = this.providerService.provider;

    const fromToken = new ethers.Contract(
      fromTokenAddress,
      ERC20_ABI,
      provider,
    ) as ERC20Contract;

    const toToken = new ethers.Contract(
      toTokenAddress,
      ERC20_ABI,
      provider,
    ) as ERC20Contract;

    const fromMeta = await this.assertIsERC20(fromToken, 'fromTokenAddress');
    const toMeta = await this.assertIsERC20(toToken, 'toTokenAddress');

    const fromDecimals = fromMeta.decimals;
    const toDecimals = toMeta.decimals;
    const fromSymbol = fromMeta.symbol;
    const toSymbol = toMeta.symbol;

    const amountInRaw = ethers.utils.parseUnits(amountIn, fromDecimals);

    const factory = new ethers.Contract(
      UNISWAP_V2_FACTORY,
      UNISWAP_V2_FACTORY_ABI,
      provider,
    ) as UniswapFactoryContract;

    const pairAddress: string = await factory.getPair(
      fromTokenAddress,
      toTokenAddress,
    );

    if (!pairAddress || pairAddress === ZERO_ADDRESS) {
      throw new NotFoundException('No UniswapV2 pair for given tokens');
    }

    const pair = new ethers.Contract(
      pairAddress,
      UNISWAP_V2_PAIR_ABI,
      provider,
    ) as UniswapPairContract;

    const [token0, token1, reserves] = await Promise.all([
      pair.token0(),
      pair.token1(),
      pair.getReserves(),
    ]);

    const reserve0 = BigNumber.from(reserves.reserve0 ?? reserves[0]);
    const reserve1 = BigNumber.from(reserves.reserve1 ?? reserves[1]);

    let reserveIn: BigNumber;
    let reserveOut: BigNumber;

    if (
      fromTokenAddress.toLowerCase() === token0.toLowerCase() &&
      toTokenAddress.toLowerCase() === token1.toLowerCase()
    ) {
      reserveIn = reserve0;
      reserveOut = reserve1;
    } else if (
      fromTokenAddress.toLowerCase() === token1.toLowerCase() &&
      toTokenAddress.toLowerCase() === token0.toLowerCase()
    ) {
      reserveIn = reserve1;
      reserveOut = reserve0;
    } else {
      throw new BadRequestException('Pair tokens mismatch');
    }

    const amountOutRaw = getAmountOutExactIn({
      amountIn: amountInRaw,
      reserveIn,
      reserveOut,
    });

    const amountOut = ethers.utils.formatUnits(amountOutRaw, toDecimals);

    return {
      pairAddress,
      fromTokenAddress,
      toTokenAddress,
      amountIn,
      fromSymbol,
      toSymbol,
      amountInRaw: amountInRaw.toString(),
      amountOut,
      amountOutRaw: amountOutRaw.toString(),
      reserves: {
        reserveIn: reserveIn.toString(),
        reserveOut: reserveOut.toString(),
      },
    };
  }

  private async assertIsERC20(
    contract: ERC20Contract,
    label: string,
  ): Promise<{ decimals: number; symbol: string }> {
    try {
      const [decimals, symbol] = await Promise.all([
        contract.decimals(),
        contract.symbol(),
      ]);

      if (typeof decimals !== 'number') {
        throw new Error();
      }

      return { decimals, symbol };
    } catch {
      throw new BadRequestException(`${label} is not a valid ERC20 token`);
    }
  }
}
