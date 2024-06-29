// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import '@openzeppelin/contracts/interfaces/IERC5313.sol';
import "./interfaces/IERC20ParametersPacker.sol";

abstract contract ERC20Plus is ERC20, IERC5313 {
    constructor(IERC20ParametersPacker.ERC20Parameters memory parameters) ERC20(parameters.name, parameters.symbol) { }

    function description() external view virtual returns (string memory);

    function image() external view virtual returns (string memory);
}
