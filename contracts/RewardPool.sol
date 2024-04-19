//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IMy {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
}

contract RewardPool {
    IMy my;
    address private owner;
    //奖池激活
    bool public isActived;
    //开奖状态
    bool public openRewardStatus;
    //确认是否已取回奖励
    mapping(address => bool) public withdrawSure;
    //中奖人员可获取的奖励
    mapping(address => uint256) public allPlayersRewords;
    event RewardPlayer(address[] indexed players, uint256[] indexed values);
    event WithdrawRecord(address from,address indexed to,uint256 indexed value,uint256 indexed time);  
    
    modifier ownerOnly() {
        require(msg.sender == owner,"Only owner can operate");
        _;
    }
     
    constructor(address _my) {
        my = IMy(_my);
        owner = msg.sender;
    }

    function setActived(bool _isActived) ownerOnly external {
        isActived = _isActived;
    }

    function setOpenRewardStatus(bool _openRewardStatus) ownerOnly external {
        openRewardStatus = _openRewardStatus;
    }

    //设置中奖人员奖励
    function setPlayersReward(address[] memory players,uint256[] memory values) ownerOnly external { 
        require(isActived && openRewardStatus,"Not drawn");
        for(uint256 j = 0; j< players.length;j++){
            allPlayersRewords[players[j]] = values[j];
        }
        emit RewardPlayer(players,values);
    }

    function clearPoolData(address[] memory players) ownerOnly external {
        require(isActived && openRewardStatus,"Not drawn");
        uint256 count;
        for(uint256 k = 0; k < players.length;k++){
            if(withdrawSure[players[k]]){
               count++;
               delete allPlayersRewords[players[k]];
               delete withdrawSure[players[k]];
            }
        }
        if(count == players.length){
            isActived = false;
            openRewardStatus = false;   
        }
    }

    function takeOut() ownerOnly external {
       require(isActived,"Pool is not active");
       if(getBalance() > 0){
            my.transfer(msg.sender,getBalance());
        }
    }

    function getBalance() public view returns(uint256 balance){
        balance = my.balanceOf(address(this));
    }

    function common(address player) internal {
            require(isActived,"Pool is not active");
            require(withdrawSure[player] == false,"Operated");
            withdrawSure[player] = true;
            my.transfer(player,allPlayersRewords[player]);
            emit WithdrawRecord(address(this),player,allPlayersRewords[player],block.timestamp);
    }

    function singleWithdraw() external {
            if(tx.origin == msg.sender){
                address player = msg.sender;
                common(player);
            }else {
                revert();
            }       
    }

    function BatchWithdraw(address[] memory recipients) external {           
            if(tx.origin == msg.sender){
                 for(uint256 i = 0 ; i < recipients.length; i++){
                    common(recipients[i]);
                }
            }else{
                revert();
            }
    }

}