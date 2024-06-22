// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.0;

import "./MemeCoin.sol";

abstract contract MemezChat { // only for demo
    mapping(MemeCoin => Message[]) public threads;
    mapping(MemeCoin => mapping(uint256 => mapping(address => bool))) public isThreadMessageLikedByUser;

    struct Message {
        string text;
        address sender;
        uint48 timestamp;
        uint48 likes;
    }

    event MessageCreated(MemeCoin indexed memecoinThread, address indexed sender, uint256 messageIndex);

    event MessageLiked(MemeCoin indexed memecoinThread, address indexed sender, uint256 messageIndex);

    function isMemeCoinLegit(MemeCoin memecoin) public virtual view returns (bool);

    function getThreadLength(MemeCoin memecoin) public view returns (uint256) {
        return threads[memecoin].length;
    }

    function addMessage(MemeCoin memecoinThread, string memory text) external returns (uint256 messageIndex) {
        require(isMemeCoinLegit(memecoinThread), "Memecoin is not legit");

        Message memory message;
        message.text = text;
        message.sender = msg.sender;
        message.timestamp = uint48(block.timestamp);

        messageIndex = threads[memecoinThread].length;
        threads[memecoinThread].push(message);

        emit MessageCreated(memecoinThread, msg.sender, messageIndex);
    }

    function likeMessage(MemeCoin memecoinThread, uint256 messageIndex) external returns (uint48 likes) {
        require(threads[memecoinThread][messageIndex].timestamp > 0, "Message does not exist");

        require(!isThreadMessageLikedByUser[memecoinThread][messageIndex][msg.sender], "Message is already liked");

        isThreadMessageLikedByUser[memecoinThread][messageIndex][msg.sender] = true;
        likes = uint48(threads[memecoinThread][messageIndex].likes + 1);
        threads[memecoinThread][messageIndex].likes = likes;

        emit MessageLiked(memecoinThread, msg.sender, messageIndex);
    }
}
