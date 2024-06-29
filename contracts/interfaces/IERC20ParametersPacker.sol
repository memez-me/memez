// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.0;

interface IERC20ParametersPacker {
    struct ERC20Parameters {
        string name;
        string symbol;
    }

    function erc20Parameters() external view returns (ERC20Parameters memory);
}
