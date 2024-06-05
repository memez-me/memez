// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.0;

import { IUniswapV2Factory } from "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";
import { IUniswapV2Router02 } from "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./Formula.sol";
import "hardhat/console.sol";

interface IFraxswapFactory is IUniswapV2Factory {
    function createPair(address tokenA, address tokenB, uint256 fee) external returns (address pair);
    function globalPause() external view returns (bool);
    function toggleGlobalPause() external;
}

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

contract MemeCoin is ERC20 {
    address constant public fraxswapFactory = 0xE30521fe7f3bEB6Ad556887b50739d6C7CA667E6;
    address constant public fraxswapRouter = 0x39cd4db6460d8B5961F73E997E86DdbB7Ca4D5F6;
    address internal immutable formula;
    uint256 public cap;

    event Mint(
        address indexed by,
        uint256 amount
    );

    event Retire(
        address indexed by,
        uint256 amount,
        uint256 liquidity
    );

    constructor(address formula_, string memory name, string memory symbol, uint256 cap_) payable ERC20(name, symbol) {
        formula = formula_;
        cap = cap_;
    }

    function _listing() public  {
        uint amountToken = reserveBalance() / price();

        console.log(IFraxswapRouter(fraxswapRouter).quote(1, amountToken, address(this).balance));
        console.log(price());

        _mint(address(this), amountToken);
        _approve(address(this), fraxswapRouter, amountToken);

        IFraxswapRouter(fraxswapRouter).addLiquidityETH{
            value: address(this).balance
        }(
            address(this),
            amountToken,
            amountToken,
            address(this).balance,
            address(0x0000000000000000000000000000000000000000),
            block.timestamp
        );

        
        
    }

    /// @notice Returns reserve balance
    function reserveBalance() public view virtual returns (uint256) {
        return address(this).balance;
    }

    /// @notice Returns price at current supply
    function price() public view returns (uint256) {
        uint256 _totalSupply = totalSupply();
        return _totalSupply * _totalSupply / 3000;
    }

    /// @notice Mints tokens pertaining to the deposited amount of reserve tokens
    /// @dev Calls mint on token contract, purchaseTargetAmount on formula contract
    function mint() public payable virtual {
        uint256 amount = calculatePurchaseReturn(msg.value);
        _mint(_msgSender(), amount);
        if (reserveBalance() >= cap) {
            _listing();
        }
        emit Mint(_msgSender(), amount);
    }

    /// @notice Retires tokens of given amount, and transfers pertaining reserve tokens to account
    /// @param amount The amount of tokens being retired
    function retire(uint256 amount) external virtual {
        require(totalSupply() - amount >= 0, "Requested Retire Amount Exceeds Supply");
        require(amount <= balanceOf(_msgSender()), "Requested Retire Amount Exceeds Owned");
        uint256 liquidity = calculateSaleReturn(amount);
        payable(_msgSender()).transfer(liquidity);
        _burn(_msgSender(), amount);
        emit Retire(_msgSender(), amount, liquidity);
    }

    function calculatePurchaseReturn(
        uint256 _depositAmount
    ) public view returns (uint256) {
        uint256 _totalSupply = totalSupply();
        uint256 temp = 1000 * _depositAmount + _totalSupply * _totalSupply * _totalSupply;
        (uint256 result, uint8 precision) = Formula(formula).power(temp, 1, 1, 3);
        temp = (result - 1) >> precision;
        return temp - _totalSupply;
    }

    function calculateSaleReturn(
        uint256 _saleAmount
    ) public view returns (uint256) {
        uint256 _totalSupply = totalSupply();
        return (3 * _totalSupply * _totalSupply * _saleAmount - 3 * _totalSupply * _saleAmount * _saleAmount + _saleAmount * _saleAmount * _saleAmount) / 1000;
    }
}
