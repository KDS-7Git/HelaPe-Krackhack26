// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract PayStream is Ownable, ReentrancyGuard {
    struct Stream {
        address sender;
        address recipient;
        uint256 deposit;
        uint256 startTime;
        uint256 stopTime;
        uint256 ratePerSecond;
        uint256 withdrawn;
        bool active;
        bool paused;
        uint256 pausedTime;
        uint256 totalPausedDuration;
    }

    IERC20 public paymentToken;
    address public taxVault;
    uint256 public constant TAX_RATE = 1000; // 10% (Basis points: 1000/10000)
    uint256 public constant BASIS_POINTS = 10000;
    
    mapping(uint256 => Stream) public streams;
    mapping(uint256 => bool) public streamExists;
    mapping(address => uint256[]) private senderStreams;
    uint256 public nextStreamId;

    event StreamCreated(uint256 indexed streamId, address indexed sender, address indexed recipient, uint256 ratePerSecond, uint256 deposit, uint256 startTime);
    event Withdrawn(uint256 indexed streamId, address indexed recipient, uint256 amount, uint256 tax);
    event StreamCancelled(uint256 indexed streamId, address indexed sender, address indexed recipient, uint256 refundAmount);
    event StreamPaused(uint256 indexed streamId, address indexed sender);
    event StreamResumed(uint256 indexed streamId, address indexed sender);

    constructor(address _paymentToken, address _taxVault) Ownable(msg.sender) {
        paymentToken = IERC20(_paymentToken);
        taxVault = _taxVault;
    }

    function createStream(
        uint256 streamId,
        address recipient,
        uint256 ratePerSecond,
        uint256 deposit,
        uint256 startTime
    ) external nonReentrant returns (uint256) {
        require(recipient != address(0), "Invalid recipient");
        require(deposit > 0, "Deposit must be > 0");
        require(ratePerSecond > 0, "Rate must be > 0");
        require(!streamExists[streamId], "Stream ID already exists");
        require(startTime >= block.timestamp, "Start time must be in future or now");
        
        uint256 duration = deposit / ratePerSecond;
        require(duration > 0, "Deposit too small for rate");

        // Transfer tokens to contract
        require(paymentToken.transferFrom(msg.sender, address(this), deposit), "Transfer failed");
        
        streams[streamId] = Stream({
            sender: msg.sender,
            recipient: recipient,
            deposit: deposit,
            startTime: startTime,
            stopTime: startTime + duration,
            ratePerSecond: ratePerSecond,
            withdrawn: 0,
            active: true,
            paused: false,
            pausedTime: 0,
            totalPausedDuration: 0
        });

        streamExists[streamId] = true;
        senderStreams[msg.sender].push(streamId);

        // Update nextStreamId if custom ID is >= current nextStreamId
        if (streamId >= nextStreamId) {
            nextStreamId = streamId + 1;
        }

        emit StreamCreated(streamId, msg.sender, recipient, ratePerSecond, deposit, startTime);
        return streamId;
    }

    function getVestedAmount(uint256 streamId) public view returns (uint256) {
        Stream memory stream = streams[streamId];
        if (!stream.active && stream.stopTime <= block.timestamp) {
             // Fully vested or cancelled and settled? Handle cancellation logic carefully.
             // If cancelled, stopTime is updated.
        }

        uint256 currentTime = block.timestamp;
        if (currentTime > stream.stopTime) {
            currentTime = stream.stopTime;
        }

        uint256 elapsedTime = currentTime - stream.startTime;
        uint256 vested = elapsedTime * stream.ratePerSecond;
        
        if (vested > stream.deposit) {
            vested = stream.deposit;
        }
        
        return vested;
    }

    function getStream(uint256 streamId) external view returns (Stream memory) {
        return streams[streamId];
    }

    function withdraw(uint256 streamId, uint256 amount) external nonReentrant {
        Stream storage stream = streams[streamId];
        require(msg.sender == stream.recipient || msg.sender == stream.sender, "Unauthorized");
        require(stream.active, "Stream not active");
        require(!stream.paused, "Stream is paused");
        require(amount > 0, "Amount must be > 0");

        uint256 vested = getVestedAmount(streamId);
        uint256 withdrawable = vested - stream.withdrawn;
        require(withdrawable >= amount, "Amount exceeds available funds");

        stream.withdrawn += amount;

        // Apply Tax
        uint256 taxAmount = (amount * TAX_RATE) / BASIS_POINTS;
        uint256 netAmount = amount - taxAmount;

        require(paymentToken.transfer(taxVault, taxAmount), "Tax transfer failed");
        require(paymentToken.transfer(stream.recipient, netAmount), "Recipient transfer failed");

        emit Withdrawn(streamId, stream.recipient, netAmount, taxAmount);

        // If fully withdrawn and time passed, deactivate? 
        // Logic: if withdrawn == deposit, it's done.
        if (stream.withdrawn >= stream.deposit) {
            stream.active = false;
        }
    }

    function cancelStream(uint256 streamId) external nonReentrant {
        Stream storage stream = streams[streamId];
        require(msg.sender == stream.sender || msg.sender == stream.recipient, "Unauthorized");
        require(stream.active, "Stream not active");

        uint256 vested = getVestedAmount(streamId);
        uint256 unvested = stream.deposit - vested;

        stream.active = false;
        stream.stopTime = block.timestamp; // Mark as stopped now for history

        // Refund unvested to sender
        if (unvested > 0) {
            require(paymentToken.transfer(stream.sender, unvested), "Refund failed");
        }
        
        // Allow withdrawal of remaining vested funds later or push now?
        // Let's push vested funds immediately to recipient just to be clean, or let them withdraw.
        // If we don't push, they stay in contract. But access control says active is false.
        // We should allow withdrawing even if inactive if vested > withdrawn.
        // But for simplicity, let's settle everything now.
        
        uint256 withdrawable = vested - stream.withdrawn;
        if (withdrawable > 0) {
            // Apply Tax
            uint256 taxAmount = (withdrawable * TAX_RATE) / BASIS_POINTS;
            uint256 netAmount = withdrawable - taxAmount;
            
            require(paymentToken.transfer(taxVault, taxAmount), "Tax transfer failed");
            require(paymentToken.transfer(stream.recipient, netAmount), "Recipient transfer failed");
            
             emit Withdrawn(streamId, stream.recipient, netAmount, taxAmount);
             stream.withdrawn += withdrawable;
        }

        emit StreamCancelled(streamId, stream.sender, stream.recipient, unvested);
    }

    function pauseStream(uint256 streamId) external nonReentrant {
        Stream storage stream = streams[streamId];
        require(msg.sender == stream.sender, "Only sender can pause");
        require(stream.active, "Stream not active");
        require(!stream.paused, "Stream already paused");
        require(block.timestamp >= stream.startTime, "Stream hasn't started yet");
        
        stream.paused = true;
        stream.pausedTime = block.timestamp;
        
        emit StreamPaused(streamId, msg.sender);
    }

    function resumeStream(uint256 streamId) external nonReentrant {
        Stream storage stream = streams[streamId];
        require(msg.sender == stream.sender, "Only sender can resume");
        require(stream.active, "Stream not active");
        require(stream.paused, "Stream not paused");
        
        stream.totalPausedDuration += block.timestamp - stream.pausedTime;
        stream.paused = false;
        stream.pausedTime = 0;
        
        emit StreamResumed(streamId, msg.sender);
    }

    function getSenderStreams(address sender) external view returns (uint256[] memory) {
        return senderStreams[sender];
    }
}

