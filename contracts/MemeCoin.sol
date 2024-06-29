// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.0;

import "./interfaces/IMemeCoinDeployer.sol";
import "./interfaces/IMemeCoinListingManager.sol";
import "./ERC20Plus.sol";
import "./Formula.sol";
import "hardhat/console.sol";

contract MemeCoin is ERC20Plus {
    uint256 constant internal DECIMALS = 1e18;
    address public immutable listingManager;
    uint96 public cap;
    address internal immutable formula;
    uint16 internal immutable powerN;
    uint16 internal immutable powerD;
    uint16 internal immutable factorN;
    uint16 internal immutable factorD;
    uint32 public immutable coinIndex;
    address public immutable owner;
    string public override description;
    string public override image;

    event Mint(
        address indexed by,
        uint256 amount,
        uint256 liquidity,
        uint256 newSupply,
        uint256 timestamp // debug only
    );

    event Retire(
        address indexed by,
        uint256 amount,
        uint256 liquidity,
        uint256 newSupply,
        uint256 timestamp // debug only
    );

    constructor() payable ERC20Plus(IMemeCoinDeployer(_msgSender()).erc20Parameters()) {
        IMemeCoinDeployer deployer = IMemeCoinDeployer(_msgSender());
        (
            listingManager,
            cap,
            formula,
            powerN,
            powerD,
            factorN,
            factorD,
            coinIndex,
            owner,
            description,
            image
        ) = deployer.parameters();

        require(cap > 0, 'Positive cap expected');

        if (msg.value > 0) _mintCoin(owner, 0);
    }

    modifier notListed() {
        require(cap > 0, 'Already listed');
        _;
    }

    function getCoefficients() external view returns (
        uint256 powerNumerator, uint256 powerDenominator, uint256 factorNumerator, uint256 factorDenominator
    ) {
        return (uint256(powerN), uint256(powerD), uint256(factorN), uint256(factorD));
    }

    function _listing() internal {
        IMemeCoinListingManager _listingManager = IMemeCoinListingManager(listingManager);
        (uint256 amountTokenForListing, uint256 amountTokenForMemez) = _listingManager.estimateMemeCoinListingWithTwamm(cap, price());
        unchecked { _mint(address(_listingManager), amountTokenForListing + amountTokenForMemez); }
        _listingManager.listMemeCoin{value: cap}(amountTokenForListing, amountTokenForMemez);

        if (address(this).balance > 0) {
            console.log(address(this).balance);
            (bool success, ) = _msgSender().call{value: address(this).balance}('');
            require(success, 'Leftover transfer failed');
        }

        delete cap;
    }

    /// @notice Returns reserve balance
    function reserveBalance() public view virtual returns (uint256) {
        return address(this).balance;
    }

    /// @notice Returns price at current supply
    function price() public view returns (uint256) {
        (uint256 result, uint8 precision) = Formula(formula).power(totalSupply(), DECIMALS, powerN, powerD);
        return (result >> precision) * factorN / factorD;
    }

    /// @notice Mints tokens to address pertaining to the deposited amount of reserve tokens
    function _mintCoin(address minter, uint256 minAmount) internal virtual {
        uint256 value = msg.value;
        uint256 _cap = cap;
        uint256 _reserveBalance = address(this).balance;
        if (_reserveBalance >= _cap) {
            unchecked{
                uint256 leftover = _reserveBalance - _cap;
                value = value - leftover;
            }
        }

        uint256 amount = calculatePurchaseReturn(value);
        require(amount >= minAmount, "Insufficient output token amount");
        _mint(minter, amount);
        emit Mint(minter, amount, value, totalSupply(), block.timestamp);

        if (address(this).balance >= _cap) _listing();
    }

    /// @notice Mints tokens pertaining to the deposited amount of reserve tokens
    /// @param minAmount The minimum amount of tokens that user expects to receive
    function mint(uint256 minAmount) external payable virtual notListed {
        return _mintCoin(_msgSender(), minAmount);
    }

    /// @notice Retires tokens of given amount, and transfers pertaining reserve tokens to account
    /// @param amount The amount of tokens being retired
    /// @param minValue The minimum ETH value that user expects to receive
    function retire(uint256 amount, uint256 minValue) external virtual notListed {
        uint256 _totalSupply = totalSupply();
        require(amount <= _totalSupply, "Retire Amount Exceeds Supply");
        uint256 liquidity = calculateSaleReturn(amount);
        require(liquidity >= minValue, "Insufficient output ETH amount");
        address msgSender = _msgSender();
        (bool success, ) = msgSender.call{value: liquidity}('');
        require(success, 'ETH transfer failed');
        _burn(msgSender, amount);
        emit Retire(msgSender, amount, liquidity, totalSupply(), block.timestamp);
    }

    function calculatePurchaseReturn(
        uint256 _depositAmount
    ) public view returns (uint256) {
        unchecked {
            uint32 powerNOfPowerPlus1 = powerN + powerD;
            uint256 baseN = (cap + _depositAmount) * powerNOfPowerPlus1 * factorD;
            uint256 baseD = factorN * powerD;
            (uint256 result, uint8 precision) = Formula(formula).power(baseN, baseD, powerD, powerNOfPowerPlus1);
            return (result >> precision) * DECIMALS - totalSupply();
        }
    }

    function calculateSaleReturn(
        uint256 _saleAmount
    ) public view returns (uint256) {
        unchecked {
            uint32 powerNOfPowerPlus1 = powerN + powerD;
            uint256 newSupply = totalSupply() - _saleAmount;
            if (newSupply == 0) return address(this).balance;
            (uint256 result, uint8 precision) = Formula(formula).power(newSupply, DECIMALS, powerNOfPowerPlus1, powerD);
            return address(this).balance - (((result >> precision) * factorN * powerD) / factorD / powerNOfPowerPlus1);
        }
    }
}
