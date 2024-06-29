// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.0;

import "./interfaces/IMemeCoinDeployer.sol";
import "./MemeCoin.sol";

// inspired by UniswapV3PoolDeployer

contract MemeCoinDeployer is IMemeCoinDeployer {
    struct MemeCoinParameters {
        address listingManager;
        uint96 cap;
        address formula;
        uint16 powerN;
        uint16 powerD;
        uint16 factorN;
        uint16 factorD;
        uint32 coinIndex;
        address owner;
        string description;
        string image;
    }

    uint32 public override allMemecoinsCount;
    address public immutable formula;
    address public immutable listingManager;
    ERC20Parameters internal _erc20Parameters;
    MemeCoinParameters public override parameters;
    address[] public allMemecoins;

    event MemeCoinDeployed(address indexed creator, address indexed memecoin);

    constructor(address formula_, address listingManager_) {
        formula = formula_;
        listingManager = listingManager_;
    }

    function erc20Parameters() external view returns (ERC20Parameters memory) {
        return _erc20Parameters;
    }

    function deploy(
        uint96 cap,
        uint16 powerN,
        uint16 powerD,
        uint16 factorN,
        uint16 factorD,
        string memory name,
        string memory symbol,
        string memory description,
        string memory image
    ) public payable virtual returns (address memecoin) {
        parameters = MemeCoinParameters({
            listingManager: listingManager,
            cap: cap,
            formula: formula,
            powerN: powerN,
            powerD: powerD,
            factorN: factorN,
            factorD: factorD,
            coinIndex: allMemecoinsCount,
            owner: msg.sender,
            description: description,
            image: image
        });

        _erc20Parameters = ERC20Parameters({
            name: name,
            symbol: symbol
        });

        memecoin = address(new MemeCoin{salt: keccak256(bytes(symbol)), value: msg.value}());

        delete parameters;
        delete _erc20Parameters;

        emit MemeCoinDeployed(msg.sender, memecoin);

        allMemecoins.push(memecoin);
        unchecked { allMemecoinsCount++; }
    }

    function getAddress(string memory symbol) public view returns (address memecoin) {
        bytes32 salt = keccak256(bytes(symbol));
        return address(uint160(uint256(keccak256(abi.encodePacked(
            bytes1(0xff),
            address(this),
            salt,
            keccak256(abi.encodePacked(type(MemeCoin).creationCode))
        )))));
    }

    function isMemeCoinLegit(address memecoin) public override view returns (bool) {
        try MemeCoin(memecoin).coinIndex() returns (uint32 coinIndex) {
            return allMemecoins[coinIndex] == memecoin;
        } catch {
            return false;
        }
    }
}
