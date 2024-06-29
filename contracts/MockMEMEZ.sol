// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./interfaces/fraxswap/IFraxswapRouter.sol";

contract MockMEMEZ is ERC20 {
    address constant internal fraxswapRouter = 0x39cd4db6460d8B5961F73E997E86DdbB7Ca4D5F6;

    constructor() ERC20('MEMEZ Token', 'MEMEZ') { }

    function list(uint256 amount) external payable {
        _mint(address(this), amount);
        _approve(address(this), fraxswapRouter, amount);

        IFraxswapRouter(fraxswapRouter).addLiquidityETH{
                value: address(this).balance
            }(
            address(this),
            amount,
            amount,
            address(this).balance,
            address(0x0000000000000000000000000000000000000000),
            block.timestamp
        );
    }
}
