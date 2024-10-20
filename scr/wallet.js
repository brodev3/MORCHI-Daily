const utils = require('./utils/utils');
const log = require('./utils/logger')
const { ethers } = require('ethers');
const gameABI = require('../ABI/GAME.json');
const nftABI = require('../ABI/NFT-ERC-721.json');
const routerABI = require('../ABI/ROUTER.json');
const erc20ABI = require('../ABI/ERC-20.json');
const config = require("../input/config");

const provider = new ethers.JsonRpcProvider(config.POLYGON_RPC_URL);

class Wallet {

    constructor(data) {
        const parsedData = data.split(";");
        this.privateKey = parsedData[0];
        this.token_id = +parsedData[1];
        this.withdrawAddress = parsedData[2]; 

        this.polygon = new ethers.Wallet(this.privateKey, provider);
        this.address = this.polygon.address;
        this.gameContract = new ethers.Contract(config.contract, gameABI, this.polygon);
        this.NFTContract = new ethers.Contract(config.NFTCONTRACT, nftABI, this.polygon);
        this.routerContract = new ethers.Contract(config.ROUTERCONTRACT, routerABI, this.polygon);
        this.SUTContract = new ethers.Contract(config.SUTCONTRACT, erc20ABI, this.polygon);
        this.USDTContract = new ethers.Contract(config.USDTCONTRACT, erc20ABI, this.polygon);
    };
};



module.exports = Wallet;