// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.0;

import "./MemeCoin.sol";
import "./MemezChat.sol";

contract MemezFactory is MemezChat {
    address public immutable formula;
    mapping(address => AccountInfo) public accounts;
    mapping(string => address) public nicknamesToAccounts;
    mapping(address => address[]) public memecoinsByCreators;
    address[] public allMemecoins;
    uint256 public allMemecoinsCount;

    struct AccountInfo {
        string nickname;
        string profilePicture;
        uint256 createdMemecoinsCount;
    }

    event AccountInfoUpdated(address indexed account, string indexed nickname, string profilePicture);

    event MemeCoinDeployed(address indexed creator, address indexed memecoin);

    constructor(address formula_) {
        formula = formula_;
    }

    function updateAccountInfo(string memory nickname, string memory profilePicture) external virtual {
        require(nicknamesToAccounts[nickname] == address(0) || nicknamesToAccounts[nickname] == msg.sender, "Nickname exists");
        accounts[msg.sender].nickname = nickname;
        accounts[msg.sender].profilePicture = profilePicture;
        nicknamesToAccounts[nickname] = msg.sender;
        emit AccountInfoUpdated(msg.sender, nickname, profilePicture);
    }

    function deploy(string memory name, string memory symbol, uint256 cap) public payable {
        require((getAddress(name, symbol, cap, msg.sender)).code.length == 0, "The token with such parameters has been already deployed");
        bytes32 salt = keccak256(bytes(symbol));
        MemeCoin memecoin = new MemeCoin{
            salt: salt
        }(formula, name, symbol, cap, msg.sender);
        emit MemeCoinDeployed(msg.sender, address(memecoin));

        accounts[msg.sender].createdMemecoinsCount++;
        memecoinsByCreators[msg.sender].push(address(memecoin));
        allMemecoins.push(address(memecoin));
        unchecked { allMemecoinsCount++; }
    }

    function getAddress(string memory name, string memory symbol, uint256 cap, address owner) public view returns (address token) {
        bytes32 salt = keccak256(bytes(symbol));
        return address(uint160(uint(keccak256(abi.encodePacked(
            bytes1(0xff),
            address(this),
            salt,
            keccak256(abi.encodePacked(
                type(MemeCoin).creationCode,
                abi.encode(formula, name, symbol, cap, owner)
            ))
        )))));
    }

    function isMemeCoinLegit(MemeCoin memecoin) public override view returns (bool) {
        try memecoin.name() returns (string memory name) {
            try memecoin.symbol() returns (string memory symbol) {
                try memecoin.cap() returns (uint256 cap) {
                    try memecoin.owner() returns (address owner) {
                        return getAddress(name, symbol, cap, owner) == address(memecoin);
                    } catch {
                        return false;
                    }
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
