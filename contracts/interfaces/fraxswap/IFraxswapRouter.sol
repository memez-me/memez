// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.0;

import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";

interface IFraxswapRouter is IUniswapV2Router02 {
    function quote(uint256 amountA, uint256 reserveA, uint256 reserveB) external pure returns (uint256 amountB);
    function getAmountsOut(uint256 amountIn, address[] memory path) external view returns (uint256[] memory amounts);
    function getAmountsIn(uint256 amountOut, address[] memory path) external view returns (uint256[] memory amounts);
    function getAmountsOutWithTwamm(
        uint256 amountIn,
        address[] memory path
    ) external returns (uint256[] memory amounts);
    function getAmountsInWithTwamm(
        uint256 amountOut,
        address[] memory path
    ) external returns (uint256[] memory amounts);
}
