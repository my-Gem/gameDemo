//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract Game {
    bool public activated;
    bool public ended;
    address private immutable manager;
    address private winner;
    address[] public players;
    uint256 private unlocked = 1;
    //赢家的奖励
    uint256 public winnerReward;
    //游戏的总key
    uint256 public poolKey;
    //游戏的总奖励
    uint256 public poolReward;
    //分红的池子的奖励
    uint256 public otherPoolReward;
    //动态延长的时间
    uint256 private decayTime;
    //特殊时间
    uint256 public immutable EXDECAY_TIME;
    //每次存入key就延长60s,key不是token,是一个数量而已
    uint256 public immutable EXTEND_TIME;
    //最大延长时间
    uint128 public immutable MAX_TIME;
    //key与MY Token兑换比例
    uint128 public immutable RATE;
    mapping(address => bool) private playersSwitch;
    //玩家投入的key
    mapping(address => uint256) public playerenterKey;
    //玩家奖励
    mapping(address => uint256) public playersReward;
    modifier ownerOnly() {
        require(msg.sender == manager, "Only manager can operate");
        _;
    }
    modifier lock() {
        require(unlocked == 1, "LOCKED");
        unlocked = 0;
        _;
        unlocked = 1;
    }
    modifier callerIsUser() {
        require(tx.origin == msg.sender, "The caller is another contract");
        _;
    }
    event TimeDecay(address indexed _from, uint256 indexed _nowTime);
    event EveryPlayerReward(
        address indexed _playerWard,
        uint256 indexed _reward
    );
    event Reward(uint256 indexed _pollward);
    error LenInfo(string _lenInfo);

    constructor() payable {
        manager = msg.sender;
        MAX_TIME = 1296000 seconds;
        EXDECAY_TIME = 1296000 seconds + block.timestamp;
        EXTEND_TIME = 60 seconds;
        RATE = 200;
    }

    function setActivated(bool _activated) external ownerOnly {
        activated = _activated;
    }

    function setEnded(bool _ended) external ownerOnly {
        ended = _ended;
    }

    function getAllPlayers() external view returns (uint256) {
        return players.length == 0 ? 0 : players.length;
    }

    //赢家
    function getWinner() external view returns (address) {
        return players.length > 0 && ended ? winner : address(0);
    }

    //玩家奖励
    function getPlayerWard() external view returns (uint256) {
        return players.length > 0 && ended ? playersReward[winner] : 0;
    }

    
    //结束时间是算出来的,block.timestamp 是固定递增，每个块增加 3s, 但 decayTime 是不固定递增的
    function getActualEndTime() public view returns (uint256 nowTime,uint256 endTime,uint256 leftTime,bool isEnded) {
        endTime = EXDECAY_TIME + decayTime;
        nowTime = block.timestamp;
        if (endTime > nowTime) {
            leftTime = endTime - nowTime;
            isEnded = false;
        } else {
            leftTime = nowTime;
            isEnded = true;
        }
    }

    //分配奖励
    function distributeRewards() external ownerOnly {
        if (players.length > 0 && ended) {
            uint256 halfPoolWard = otherPoolReward / 2;
            uint256 len = players.length;
            for (uint256 i = 0; i < len; ) {
                if (players[i] != winner) {
                    playersReward[players[i]] = halfPoolWard / len;
                    emit EveryPlayerReward(players[i],playersReward[players[i]]);
                } else {
                    playersReward[winner] = halfPoolWard;
                    emit EveryPlayerReward(winner, halfPoolWard);
                }
                unchecked {i++;}
            }
        } else {
            revert LenInfo("Not enough players");
        }
    }

    //计算池子的奖励
    function calculate(uint256 _key) internal {
        poolReward = _key * RATE * 10**18;
        otherPoolReward = poolReward / 2;
        poolReward = poolReward - otherPoolReward;
        emit Reward(poolReward);
    }

    //玩游戏
    function play(uint256 _key) external callerIsUser lock {
        require(activated, "The contract is not activated");
        require(_key > 0, "Invalid number of keys");
        (, , , bool findEnd) = getActualEndTime();
        require(!findEnd && !ended, "The event is over");
        console.log("caller:  ", msg.sender);
        console.log("tx origin:  ", tx.origin);
        address _player = msg.sender;
        decayTime = EXTEND_TIME * _key;
        if (_key >= 21600) {
            decayTime = MAX_TIME;
            _key = 21600;
            console.log("decayTime: ", decayTime);
            emit TimeDecay(_player, decayTime);
        } else {
            console.log("decayTime: ", decayTime);
            emit TimeDecay(_player, decayTime);
        }
        if (!playersSwitch[_player]) {
            players.push(_player);
            playersSwitch[_player] = true;
        }
        poolKey += _key;
        playerenterKey[_player] += _key;
        winner = _player;
        calculate(poolKey);
    }
}
