const utils = require('./utils/utils');
const log = require('./utils/logger')
const { ethers } = require('ethers');
const contractABI = require('./ABI.json');
require('dotenv').config();

const provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL);
const contractAddress = process.env.CONTRACT;


class Wallet {

    constructor(data) {
        const parsedData = data.split(":");
        this.privateKey = parsedData[0];
        this.token_id = +parsedData[1]; 
        this.polygon = new ethers.Wallet(this.privateKey, provider);
        this.address = this.polygon.address;
        this.gameContract = new ethers.Contract(contractAddress, contractABI, this.polygon);
    };

};



module.exports = Wallet;