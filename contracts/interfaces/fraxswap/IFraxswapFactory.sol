// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.0;

import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";

interface IFraxswapFactory is IUniswapV2Factory {
    function createPair(address tokenA, address tokenB, uint256 fee) external returns (address pair);
    function globalPause() external view returns (bool);
    function toggleGlobalPause() external;
}

