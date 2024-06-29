// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.0;

import "./IERC20ParametersPacker.sol";

interface IMemeCoinDeployer is IERC20ParametersPacker {
    function allMemecoinsCount() external view returns (uint32);

    function parameters() external view returns (
        address listingManager,
        uint96 cap,
        address formula,
        uint16 powerN,
        uint16 powerD,
        uint16 factorN,
        uint16 factorD,
        uint32 coinIndex,
        address owner,
        string memory description,
        string memory image
    );

    function isMemeCoinLegit(address memecoin) external view returns (bool);
}
