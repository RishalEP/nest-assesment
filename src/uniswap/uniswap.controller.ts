import { Controller, Get, Param, BadRequestException } from '@nestjs/common';
import { UniswapService } from './uniswap.service';
import { ethers } from 'ethers';

@Controller()
export class UniswapController {
  constructor(private readonly uniswapService: UniswapService) {}

  @Get('return/:fromTokenAddress/:toTokenAddress/:amountIn')
  async getReturn(
    @Param('fromTokenAddress') fromTokenAddress: string,
    @Param('toTokenAddress') toTokenAddress: string,
    @Param('amountIn') amountIn: string,
  ) {
    if (!ethers.utils.isAddress(fromTokenAddress)) {
      throw new BadRequestException('Invalid fromTokenAddress');
    }
    if (!ethers.utils.isAddress(toTokenAddress)) {
      throw new BadRequestException('Invalid toTokenAddress');
    }

    if (!amountIn || Number.isNaN(Number(amountIn)) || Number(amountIn) <= 0) {
      throw new BadRequestException('Invalid amountIn');
    }

    const result = await this.uniswapService.quoteExactIn({
      fromTokenAddress,
      toTokenAddress,
      amountIn,
    });

    return {
      pairAddress: result.pairAddress,
      fromTokenAddress,
      toTokenAddress,
      amountIn: `${amountIn} ${result.fromSymbol}`,
      amountOut: `${Number(result.amountOut).toFixed(6)} ${result.toSymbol}`,
    };
  }
}
