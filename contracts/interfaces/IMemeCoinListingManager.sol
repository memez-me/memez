// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.0;

interface IMemeCoinListingManager {
    function estimateMemeCoinListingWithTwamm(uint256 cap, uint256 price) external returns (uint256 amountTokenForListing, uint256 amountTokenForMemez);

    function listMemeCoin(uint256 amountTokenForListing, uint256 amountTokenForMemez) external payable;
}
