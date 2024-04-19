const { expect } = require("chai");
const { ethers } = require("hardhat");


/** ***********************************单元测试*************************************************** */

//hardhat本地默认网络 执行命令 npx hardhat test 或 npx hardhat test test/game-test.js
//单元测试包括以下所有
//事件测试
//区块测试  //当合约涉及时间戳,高度时必备的测试
//重置测试
//覆盖率测试
//测试console.log
//运行测试

describe("Game", function () {

  let game, game2;
  let owner, addr1, addr2, addr3, addr4, addr5, addr6, addr7, addr8, addr9, addr10;

  before(async function () { })

  beforeEach(async function () {
    [owner, addr1, addr2, addr3, addr4, addr5, addr6, addr7, addr8, addr9, addr10] = await ethers.getSigners();
    console.log("owner:  ", owner.address)
    const Game = await ethers.getContractFactory("Game");
    game = await Game.deploy();
    console.log("contract address:  ", game.address);
    await game.deployed();

  })

  describe("Deployment", function () {
    it("View some required parameters", async function () {
      expect(await game.RATE()).to.equal(200);
      expect(ethers.BigNumber.from(await game.MAX_TIME())).to.equal(ethers.BigNumber.from(1296000));
      expect(await game.EXTEND_TIME()).to.equal(60);
      const time = (await ethers.provider.getBlock()).timestamp;
      expect(ethers.BigNumber.from(await game.EXDECAY_TIME())).to.equal(ethers.BigNumber.from(time).add(ethers.BigNumber.from(await game.MAX_TIME())));
    });
  });

  // describe("Active", function () {
  //   it("Check if the project status is active", async function () {

  //     const setGameTx = await game.setActivated(true);
  //     //wait until the transaction is mined
  //     await setGameTx.wait();

  //     expect(await game.activated()).to.equal(true);
  //   });
  // });


  describe("Play", function () {
    it("Players start participating in the game", async function () {

      const setGameTx = await game.connect(owner).setActivated(true);
      await setGameTx.wait();
      expect(await game.activated()).to.equal(true);
      const setGameTx1 = await game.connect(addr1).play(10);
      await setGameTx1.wait();
      const setGameTx2 = await game.connect(addr2).play(1);
      await setGameTx2.wait();
      expect(await game.getAllPlayers()).to.equal(2);
      const setGameTx3 = await game.connect(addr3).play(6);
      await setGameTx3.wait();
      const setGameTx4 = await game.connect(addr4).play(5);
      await setGameTx4.wait();
      let activeTime = (await game.getActualEndTime())[3];
      console.log("活动:  ", await game.getActualEndTime());
      console.log("是否活动还在进行: ", activeTime);

      if (!activeTime) {
        const setGameTx6 = await game.connect(addr6).play(300000);
        await setGameTx6.wait();
        const setGameTx5 = await game.connect(addr5).play(3);
        await setGameTx5.wait();
        expect(await game.ended()).to.equal(false);

      }

      const setTx2 = await game.connect(owner).setEnded(true);
      await setTx2.wait();
      const setTx3 = await game.connect(owner).distributeRewards();
      await setTx3.wait();
      expect(await game.getWinner()).to.equal(addr5.address);
      console.log("赢家地址:  ", await game.getWinner());
      expect(await game.getPlayerWard()).to.equal(await game.playersReward(await game.getWinner()));
      console.log("赢家奖励:  ", await game.getPlayerWard());
      console.log("addr2的奖励: ", await game.playersReward(addr2.address));
      console.log("addr1的奖励: ", await game.playersReward(addr1.address));
      console.log("addr3的奖励: ", await game.playersReward(addr3.address));
      console.log("addr4的奖励: ", await game.playersReward(addr4.address));
      console.log("addr5的奖励: ", await game.playersReward(addr5.address));
      console.log("owner的奖励: ", await game.playersReward(owner.address));


    })

  })

  describe("Project status", function () {

    before(async function () { })

    beforeEach(async function () {
      const Game2 = await ethers.getContractFactory("Game");
      game2 = await Game2.deploy();
      console.log("contract address2:  ", game2.address);
      await game2.deployed();
    })

    describe("end", function () {

      it("Project has ended", async function () {

        const setGameTx = await game2.setActivated(true);
        await setGameTx.wait();
        expect(await game2.activated()).to.equal(true);
        const setGameTx1 = await game2.connect(addr8).play(7);
        await setGameTx1.wait();
        const setGameTx2 = await game2.connect(addr9).play(8);
        await setGameTx2.wait();
        const setGameTx3 = await game2.connect(addr10).play(8);
        await setGameTx3.wait();
        expect(await game2.getAllPlayers()).to.equal(3);


        if ((await game2.getActualEndTime())[3]) {
          const setTx2 = await game2.setEnded(true);
          await setTx2.wait();
          const setTx3 = await game2.distributeRewards();
          await setTx3.wait();
          expect(await game2.getWinner()).to.equal(addr10.address);
          console.log("赢家地址2:  ", await game2.getWinner());
          expect(await game2.getPlayerWard()).to.equal(await game2.playersReward(await game2.getWinner()));
          console.log("赢家奖励2:  ", await game2.getPlayerWard());
        }

      })

    })




  })

  // describe("Event", function () {
  //   it("owner emit test", async () => {
  //     await expect(greeter.eventTest())
  //       .to.be.emit(greeter, "CallerEmit")
  //       .withArgs(owner.address, 500);
  //   });
  //   it("user1 emit test", async () => {
  //     await expect(greeter.connect(user1).eventTest())
  //       .to.be.emit(greeter, "CallerEmit")
  //       .withArgs(user1.address, 500);
  //   });
  //   it("Get emit params test", async () => {
  //     const tx = await greeter.connect(users[0]).eventTest();
  //     await tx.wait();
  //     const receipt = await ethers.provider.getTransactionReceipt(tx.hash);
  //     const hash = ethers.utils.solidityKeccak256(
  //       ["string"],
  //       ["CallerEmit(address,uint256)"]
  //     );
  //     const infos = receipt.logs[0];
  //     assert.equal(infos.topics[0], hash);
  //     const sender = ethers.utils.getAddress(
  //       "0x" + infos.topics[1].substring(26)
  //     );
  //     assert.equal(sender, users[0].address);
  //     const value = ethers.BigNumber.from(infos.data);
  //     expect(value).to.be.equal(500);
  //   });
  // });

  //区块测试
  // describe("Block test", () => {
  //   let block;
  //   let timestamp;

  //   // 用来去除16进制的左边自动补零
  //   function convertNum(num) {
  //       let big = ethers.BigNumber.from("" + num)
  //       let str = big.toHexString()
  //       let index = 0
  //       for(let i=2;i<str.length;i++) {
  //           if(str[i] !== "0") {
  //               index = i;
  //               break;
  //           }
  //       }
  //       if(index === 0) {
  //           return str;
  //       }else {
  //           return str.substring(0,2) + str.substring(index)
  //       }
  //   }

  //   beforeEach(async () => {
  //     block = await ethers.provider.getBlockNumber();
  //     timestamp = (await ethers.provider.getBlock()).timestamp;
  //   });
  //   // 注意，这里hardhat network 默认是一秒一个区块
  // 	it("Call before timestamp 1651631915 should be failed", async () => {
  //     assert.ok(timestamp < 1651631915);
  //     await expect(greeter.blockTimeTest()).to.be.revertedWith(
  //       "not matched block time"
  //     );
  //   });

  //   it("Call at timestamp 1651631915 should be successfult", async () => {
  //     await ethers.provider.send("evm_mine", [1651631915 - 1]);
  //     await greeter.blockTimeTest();
  //   });
  //   it("Call before block 10000 should  be failed", async () => {
  //     assert.ok(block < 10000);
  //     await expect(greeter.blockNumberTest()).to.be.revertedWith(
  //       "not matched block number"
  //     );
  //   });

  //   it("Call at block 10000 should be successful", async () => {
  //     let value = 10000 - block - 1;
  //     //快速推进到100000区块前一个
  //     await ethers.provider.send("hardhat_mine", [convertNum(value]);
  //     await greeter.blockNumberTest();
  //   });
  // });

});



