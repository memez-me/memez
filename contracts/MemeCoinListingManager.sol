// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/fraxswap/IFraxswapFactory.sol";
import "./interfaces/fraxswap/IFraxswapRouter.sol";
import "./interfaces/fraxswap/IFraxswapPairReserves.sol";
import "./interfaces/IMemeCoinListingManager.sol";
import "hardhat/console.sol";

contract MemeCoinListingManager is IMemeCoinListingManager {
    address constant public fraxswapFactory = 0xE30521fe7f3bEB6Ad556887b50739d6C7CA667E6;
    address constant public fraxswapRouter = 0x39cd4db6460d8B5961F73E997E86DdbB7Ca4D5F6;
    uint256 constant internal DECIMALS = 1e18;
    address internal immutable treasury;
    address internal immutable memez;
    address internal immutable WETH;

    event MemeCoinListed(address indexed memecoin);

    constructor(address memez_, address treasury_) {
        memez = memez_;
        treasury = treasury_;
        WETH = IFraxswapRouter(fraxswapRouter).WETH();
    }

    function estimateMemeCoinListingWithTwamm(uint256 cap, uint256 price) external returns (uint256 amountTokenForListing, uint256 amountTokenForMemez) {
        unchecked {
            uint256 poolCap = cap;
            uint256 percentCap = poolCap / 100;

            // 3% to treasury
            uint256 treasuryValue = 3 * percentCap;
            poolCap -= treasuryValue;

            // 2% to buy MEMEZ and create memecoin-MEMEZ pair
            uint256 memezValue = 2 * percentCap;

            address[] memory wethMemezPath = new address[](2);
            wethMemezPath[0] = WETH;
            wethMemezPath[1] = memez;

            uint256[] memory swapAmounts = IFraxswapRouter(fraxswapRouter).getAmountsOutWithTwamm(memezValue, wethMemezPath);
            poolCap -= memezValue;

            uint256 boughtMemezAmount = swapAmounts[swapAmounts.length - 1];
            if (boughtMemezAmount > 0) {
                IFraxswapPairReserves wethMemezPair = IFraxswapPairReserves(IFraxswapFactory(fraxswapFactory).getPair(wethMemezPath[0], wethMemezPath[1]));

                (uint112 _reserve0, uint112 _reserve1,) = wethMemezPair.getReserves();
                (uint112 wethReserve, uint112 memezReserve) = wethMemezPath[0] == wethMemezPair.token0() ? (_reserve0, _reserve1) : (_reserve1, _reserve0);

                amountTokenForMemez = DECIMALS * boughtMemezAmount * wethReserve / memezReserve / price;
            } else {
                amountTokenForMemez = 0;
            }

            // 95% to list memecoin
            amountTokenForListing = DECIMALS * poolCap / price;

            console.log(IFraxswapRouter(fraxswapRouter).quote(DECIMALS, amountTokenForListing, poolCap)); // debug only
            console.log(price); // debug only
        }
    }

    function listMemeCoin(uint256 amountTokenForListing, uint256 amountTokenForMemez) external payable {
        unchecked {
            uint256 percentCap = msg.value / 100;

            // 3% to treasury
            uint256 treasuryValue = 3 * percentCap;
            (bool treasurySuccess,) = treasury.call{value: treasuryValue}('');
            require(treasurySuccess, 'Treasury transfer failed');

            IERC20(msg.sender).approve(fraxswapRouter, amountTokenForListing + amountTokenForMemez);

            // 2% to buy MEMEZ and create memecoin-MEMEZ pair
            uint256 memezValue = 2 * percentCap;

            address[] memory wethMemezPath = new address[](2);
            wethMemezPath[0] = WETH;
            wethMemezPath[1] = memez;

            uint256[] memory swapAmounts = IFraxswapRouter(fraxswapRouter).swapExactETHForTokens{value: memezValue}(0, wethMemezPath, address(this), block.timestamp);
            uint256 boughtMemezAmount = swapAmounts[swapAmounts.length - 1];

            if (amountTokenForMemez > 0) {
                IERC20(wethMemezPath[1]).approve(fraxswapRouter, boughtMemezAmount);

                IFraxswapRouter(fraxswapRouter).addLiquidity(
                    msg.sender,
                    wethMemezPath[1],
                    amountTokenForMemez,
                    boughtMemezAmount,
                    amountTokenForMemez,
                    boughtMemezAmount,
                    address(0x0000000000000000000000000000000000000000),
                    block.timestamp
                ); //TODO: check what happens if the pair is already created
            }

            // 95% to list memecoin
            uint256 poolCap = address(this).balance;
            IFraxswapRouter(fraxswapRouter).addLiquidityETH{value: poolCap}(
                msg.sender,
                amountTokenForListing,
                amountTokenForListing,
                poolCap,
                address(0x0000000000000000000000000000000000000000),
                block.timestamp
            ); //TODO: check what happens if the pair is already created

            emit MemeCoinListed(msg.sender);
        }
    }
}
