require("dotenv").config({ path: '.env.example' });
const hre = require("hardhat");
const Web3 = require("web3");
const { createAlchemyWeb3 } = require("@alch/alchemy-web3");
const request = require('request');
const BigNumber = require("bignumber.js");
const PROVIDER = process.env.BSCTEST_URL;
const PRIKEY = process.env.PRIVATE_KEY;
const MANAGER = process.env.ACCOUNT_ADDRESS;
const ETHERSCANAPI = process.env.ETHERSCAN_API_KEY;
const BSCSCANAPI = process.env.BSCSCAN_API_KEY;
//几个rinkeby 钱包
const accounts = [
    { from: "0x9556BFedC6D0768205155A646C15d6A5288A3652", prk: "dd64c81b6a881f221a0b8949c0554af281e90295a413c0293431443ec7180e3e" },
    { from: "0xBf4Dc80315186aFA2979399816d85C51B086D15b", prk: "867dcf57ac5ae2454168ba6b3dab70b1aa63d09e8a99e3cfe8a3616aa2b819d7" },
    { from: "0x1A667Fb332D9e32956F052d490c13f8Cdecc4c0A", prk: "2a3e259766ed730f355e84b0ee5d4b6093e239abfb09a19c29f8d9becaf3d09c" }
]
const mainnetUrl = `https://api-cn.etherscan.com/api?module=gastracker&action=gasoracle&apikey=${ETHERSCANAPI}`;
const rinkebyUrl = `${PROVIDER}`;
const bscMainnetUrl = `https://api.bscscan.com/api?module=proxy&action=eth_gasPrice&apikey=${BSCSCANAPI}`;
const bscTestUrl = `https://api-testnet.bscscan.com/api?module=proxy&action=eth_gasPrice&apikey=${BSCSCANAPI}`;
var web3, abiData, gameAddr, game;
var switchStatus = false;

if (PROVIDER && PRIKEY) {

    if(PROVIDER.indexOf("rinkeby") != -1){
        web3 = createAlchemyWeb3(PROVIDER);
        abiData = require("../artifacts/contracts/Game.sol/Game.json")
        gameAddr = "0xba3bee4f4cD88799fa146473a40315F6e660AE8B"
        game = new web3.eth.Contract(abiData.abi, gameAddr)
    }else if(PROVIDER.indexOf("ropsten") != -1 || PROVIDER.indexOf("mainnet") != -1 || PROVIDER.indexOf("bsc-dataseed1") != -1 || PROVIDER.indexOf("8545") != -1){
        web3 = new Web3(PROVIDER);
        abiData = require("../artifacts/contracts/Game.sol/Game.json")
        gameAddr = "0x49fE1d9216D335C995acb1571A8c0402037c2D38"   //bscTest
        game = new web3.eth.Contract(abiData.abi, gameAddr)
    } 

}else {
    process.exit();
}

function getGasPrice(chainId) {
    return new Promise((resolve, reject) => {
        try {
            if (chainId == 1) {
                request({
                    url: mainnetUrl,
                    method: "GET",
                    json: true,
                    headers: {
                        "content-type": "application/json"
                    },
                }, function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        return resolve(body);
                    } else {
                        console.error(error);
                        return reject(error);
                    }
                })
            } else if(chainId == 4) {
                request({
                    url: rinkebyUrl,
                    method: "POST",
                    json: true,
                    headers: {
                        "content-type": "application/json"
                    },
                    body: {
                        "jsonrpc":"2.0",
                        "method":"eth_gasPrice",
                        "params":[],
                        "id":0
                    }
                }, function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        return resolve(body);
                    } else {
                        console.error(error);
                        return reject(error);
                    }
                })
            }else if(chainId == 56) {
                request({
                    url: bscMainnetUrl,
                    method: "GET",
                    json: true,
                    headers: {
                        "content-type": "application/json"
                    },
                }, function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        return resolve(body);
                    } else {
                        console.error(error);
                        return reject(error);
                    }
                })
            }else if(chainId == 97){
                request({
                    url: bscTestUrl,
                    method: "GET",
                    json: true,
                    headers: {
                        "content-type": "application/json"
                    },
                }, function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        return resolve(body);
                    } else {
                        console.error(error);
                        return reject(error);
                    }
                })
            }
        } catch (err) {
            console.log("gas price err:  ",err)
        }
    })
}

async function getGasLimit(from, amount,ended = false) {
    return new Promise(async (resolve, reject) => {
        //激活合约状态
        // game.methods.setActivated(true).estimateGas({from},function(error, gasAmount){
        //     if(!error){
        //         console.log("gasAmount: ",gasAmount)
        //         resolve(gasAmount)
        //     }else{
        //         console.log("gasAmount error: ",error);
        //         reject(error);
        //     }
        // })
        if(ended){
            if(!switchStatus){
                //设置合约结束
                game.methods.setEnded(true).estimateGas({ from }, function (error, gasAmount) {
                    if (!error) {
                        console.log("gasAmount: ", gasAmount)
                        resolve(gasAmount)
                    } else {
                        console.log("gasAmount error: ", error);
                        reject(error);
                    }
                })
            }else{
                //分配奖励
                game.methods.distributeRewards().estimateGas({ from }, function (error, gasAmount) {
                    if (!error) {
                        console.log("gasAmount: ", gasAmount)
                        resolve(gasAmount)
                    } else {
                        console.log("gasAmount error: ", error);
                        reject(error);
                    }
                })
            }
        }else{
            //play
            game.methods.play(amount).estimateGas({ from }, function (error, gasAmount) {
                if (!error) {
                    console.log("gasAmount: ", gasAmount)
                    resolve(gasAmount)
                } else {
                    console.log("gasAmount error: ", error);
                    reject(error);
                }
            })
        }
    })
}

async function transaction(abi, from, prikey, gas) {
    try {
        var gasPriceResult;
        const nonce = await web3.eth.getTransactionCount(from, "latest")
        web3.eth.getChainId().then(async (chainId) => {
            gasPriceResult = await getGasPrice(chainId);
            if (chainId == 1) {
                gasPriceResult = parseInt(gasPriceResult.result.FastGasPrice)
            } else {
                gasPriceResult = parseInt(web3.utils.hexToNumber(gasPriceResult.result))
            }
            const tx = {
                from,
                to: gameAddr,
                nonce: web3.utils.toHex(nonce),
                gasPrice: web3.utils.toHex(parseInt(gasPriceResult)),
                gas: web3.utils.toHex(gas),
                data: abi
            }
            const signPromise = web3.eth.accounts.signTransaction(tx, prikey)
            signPromise.then((signedTx) => {
                web3.eth.sendSignedTransaction(
                    signedTx.rawTransaction,
                    function (err, hash) {
                        if (!err) {
                            console.log(
                                "The hash of your transaction is: ",
                                hash,
                                "\nCheck Alchemy's Mempool to view the status of your transaction!"
                            )
                        } else {
                            console.log(
                                "Something went wrong when submitting your transaction:",
                                err
                            )
                        }
                    }
                )
            })
            .catch((err) => {
                console.log(" Promise failed:", err)
            })
        })
    } catch (err) {
        console.log("ERR:  ", err)
    }
}

//rinkeby网络  执行命令  npx hardhat run scripts/game_deploy.js  --network rinkeby
async function main() {

    /**
     * ************************************************************************************************************************************************
    */
    //第一步部署合约
    // const Game = await hre.ethers.getContractFactory("Game");
    // const game = await Game.deploy();
    // await game.deployed();
    // console.log("Game deployed to:", game.address);
    // //第二步激活合约
    // const Tx1 = await game.setActivated(true);
    // await Tx1.wait();

   /**
     * ***********************************************************************************************************************************************
   */

    //合约验证并开源  npx hardhat verify --network rinkeby 合约地址   此步报错由于https://api-rinkeby.etherscan.io接口超时导致



    //第三步调用合约
    // const gas1 = await getGasLimit(accounts[0].from, new BigNumber(1000));
    // console.log("gas1: ", gas1)
    // const abi1 = game.methods.play(1000).encodeABI();
    // awiat transaction(abi1, accounts[0].from, accounts[0].prk, gas1);

    // const gas2 = await getGasLimit(accounts[1].from, 100);
    // console.log("gas2: ", gas2)
    // const abi2 = game.methods.play(100).encodeABI();
    // await transaction(abi2, accounts[1].from, accounts[1].prk, gas2);

    // const gas3 = await getGasLimit(accounts[2].from, 1);
    // console.log("gas3: ", gas3)
    // const abi3 = game.methods.play(1).encodeABI();
    // await transaction(abi3, accounts[2].from, accounts[2].prk, gas3);

     //每隔3秒调用合约
     let parm = setInterval(async ()=>{
         const vv = await game.getActualEndTime();
         ended = vv[3];
         if(ended){
                clearInterval(parm);
                const gas4 = await getGasLimit(MANAGER,0,ended);
                console.log("gas4: ", gas4)
                const abi4 = game.methods.setEnded(true).encodeABI();
                await transaction(abi4, MANAGER, PRIKEY, gas4);
                //等待上一步完成
                switchStatus = true;
                const gas5 = await getGasLimit(MANAGER,0,ended);
                console.log("gas5: ", gas5)
                const abi5 = game.methods.distributeRewards().encodeABI();
                await transaction(abi5, MANAGER, PRIKEY, gas5);
         }
     },3000)
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});


