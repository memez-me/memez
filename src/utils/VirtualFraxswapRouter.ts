import { Address } from 'viem';

class VirtualFraxswapRouter {
  // Given an output amount of an asset and pair reserves and fee, returns a required input amount of the other asset
  getAmountIn(
    reserve0: bigint,
    reserve1: bigint,
    token0: Address,
    fee: bigint,
    amountOut: bigint,
    tokenOut: Address,
  ) {
    const [reserveIn, reserveOut] =
      tokenOut === token0 ? [reserve1, reserve0] : [reserve0, reserve1];
    const numerator = reserveIn * amountOut * 10000n;
    const denominator = (reserveOut - amountOut) * fee;
    return numerator / denominator + 1n;
  }

  getAmountOut(
    reserve0: bigint,
    reserve1: bigint,
    token0: Address,
    fee: bigint,
    amountIn: bigint,
    tokenIn: Address,
  ) {
    const [reserveIn, reserveOut] =
      tokenIn === token0 ? [reserve0, reserve1] : [reserve1, reserve0];
    const amountInWithFee = amountIn * fee;
    const numerator = amountInWithFee * reserveOut;
    const denominator = reserveIn * 10000n + amountInWithFee;
    return numerator / denominator;
  }
}

const virtualFraxswapRouter = new VirtualFraxswapRouter();

export default virtualFraxswapRouter;
