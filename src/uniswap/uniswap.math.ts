import { BigNumber } from 'ethers';

const FEE_NUM = BigNumber.from(997);
const FEE_DEN = BigNumber.from(1000);

export function getAmountOutExactIn(params: {
  amountIn: BigNumber;
  reserveIn: BigNumber;
  reserveOut: BigNumber;
}): BigNumber {
  const { amountIn, reserveIn, reserveOut } = params;

  if (amountIn.lte(0)) throw new Error('amountIn must be > 0');
  if (reserveIn.lte(0) || reserveOut.lte(0))
    throw new Error('insufficient liquidity');

  const amountInWithFee = amountIn.mul(FEE_NUM);
  const numerator = amountInWithFee.mul(reserveOut);
  const denominator = reserveIn.mul(FEE_DEN).add(amountInWithFee);

  return numerator.div(denominator);
}
