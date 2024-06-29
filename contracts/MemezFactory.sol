// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.0;

import "./MemeCoin.sol";
import "./MemezChat.sol";
import "./MemeCoinDeployer.sol";

contract MemezFactory is MemeCoinDeployer {
    mapping(address => AccountInfo) public accounts;
    mapping(string => address) public nicknamesToAccounts;
    mapping(address => address[]) public memecoinsByCreators;

    struct AccountInfo {
        string nickname;
        string profilePicture;
        uint256 createdMemecoinsCount;
    }

    event AccountInfoUpdated(address indexed account, string indexed nickname, string profilePicture);

    constructor(address formula_, address listingManager_) MemeCoinDeployer(formula_, listingManager_) { }

    function updateAccountInfo(string memory nickname, string memory profilePicture) external virtual {
        require(nicknamesToAccounts[nickname] == address(0) || nicknamesToAccounts[nickname] == msg.sender, "Nickname exists");
        accounts[msg.sender].nickname = nickname;
        accounts[msg.sender].profilePicture = profilePicture;
        nicknamesToAccounts[nickname] = msg.sender;
        emit AccountInfoUpdated(msg.sender, nickname, profilePicture);
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
    ) public payable override returns (address memecoin) {
        require((getAddress(symbol)).code.length == 0, "Symbol is already used");

        memecoin = super.deploy(
            cap,
            powerN,
            powerD,
            factorN,
            factorD,
            name,
            symbol,
            description,
            image
        );

        unchecked { accounts[msg.sender].createdMemecoinsCount++; }
        memecoinsByCreators[msg.sender].push(memecoin);
    }
}
