// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.0;

import "./MemeCoin.sol";


contract MemezFactory {
    address public formula;

    event MemeCoinDeployed(address addr);

    constructor(address formula_) {
        formula = formula_;
    }

    function deploy(string memory name, string memory symbol, uint256 cap) public payable {
        require((getAddress(name, symbol, cap)).code.length == 0, "The token with such parameters has been already deployed");
        bytes32 salt = keccak256(bytes(symbol));
        MemeCoin memecoin = new MemeCoin{
            salt: salt
        }(formula, name, symbol, cap);
        emit MemeCoinDeployed(address(memecoin));
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
}
