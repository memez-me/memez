// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.0;

import "./MemeCoin.sol";


contract MemezFactory {
    address public formula;

    event MemeCoinDeployed(address indexed creator, address indexed memecoin);

    constructor(address formula_) {
        formula = formula_;
    }

    function deploy(string memory name, string memory symbol, uint256 cap) public payable {
        require((getAddress(name, symbol, cap)).code.length == 0, "The token with such parameters has been already deployed");
        bytes32 salt = keccak256(bytes(symbol));
        MemeCoin memecoin = new MemeCoin{
            salt: salt
        }(formula, name, symbol, cap);
        emit MemeCoinDeployed(msg.sender, address(memecoin));
    }

    function getAddress(string memory name, string memory symbol, uint256 cap) public view returns (address token) {
        bytes32 salt = keccak256(bytes(symbol));
        return address(uint160(uint(keccak256(abi.encodePacked(
            bytes1(0xff),
            address(this),
            salt,
            keccak256(abi.encodePacked(
                type(MemeCoin).creationCode,
                abi.encode(formula, name, symbol, cap)
            ))
        )))));
    }

    function isMemeCoinLegit(MemeCoin memecoin) public view returns (bool) {
        try memecoin.name() returns (string memory name) {
            try memecoin.symbol() returns (string memory symbol) {
                try memecoin.cap() returns (uint256 cap) {
                    return getAddress(name, symbol, cap) == address(memecoin);
                } catch {
                    return false;
                }
            } catch {
                return false;
            }
        } catch {
            return false;
        }
    }
}
