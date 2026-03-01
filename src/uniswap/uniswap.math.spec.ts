import { BigNumber } from 'ethers';
import { getAmountOutExactIn } from './uniswap.math';

describe('getAmountOutExactIn', () => {
  it('throws if amountIn is 0', () => {
    expect(() =>
      getAmountOutExactIn({
        amountIn: BigNumber.from(0),
        reserveIn: BigNumber.from(1000),
        reserveOut: BigNumber.from(1000),
      }),
    ).toThrow('amountIn must be > 0');
  });

  it('throws if reserves are 0', () => {
    expect(() =>
      getAmountOutExactIn({
        amountIn: BigNumber.from(1),
        reserveIn: BigNumber.from(0),
        reserveOut: BigNumber.from(1000),
      }),
    ).toThrow('insufficient liquidity');
  });

  it('computes amountOut using Uniswap V2 formula', () => {
    // amountIn=10, reserveIn=1000, reserveOut=1000
    // out = floor((10*997*1000) / (1000*1000 + 10*997)) = 9
    const out = getAmountOutExactIn({
      amountIn: BigNumber.from(10),
      reserveIn: BigNumber.from(1000),
      reserveOut: BigNumber.from(1000),
    });

    expect(out.toString()).toBe('9');
  });
});
