const Wallet = require('./scr/wallet');
const MorchiGame = require('./scr/MorchiGame');
const utils = require('./scr/utils/utils');
const log = require('./scr/utils/logger');
const levelsTab = require('./scr/levels.json');
const { ethers, formatUnits, parseUnits } = require('ethers');

const gameContract = new MorchiGame();
const MAX_UINT256 = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");

function randomDelay(min, max) {
    return new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min));
};

const transferUSDT = async (wallet) => {
    try {
        const balance = await wallet.USDTContract.balanceOf(wallet.address);

        if (!wallet.withdrawAddress)
            return;
    
        const transferTx = await wallet.USDTContract.transfer(wallet.withdrawAddress, balance);
        await transferTx.wait();

        const wei = parseUnits(balance.toString(), "szabo");
        log.success(`Wallet: ${wallet.address}. Transfered ${formatUnits(wei)} USDT to ${wallet.withdrawAddress}!`);
        return true;
    } catch (error) {
        log.error(`Wallet: ${wallet.address}. transferUSDT. Error message: ${err.message}\nStack: ${err.stack}`);
        return null;
    };
};

const sellSUT = async (wallet) => {
    try {
        const balance = await wallet.SUTContract.balanceOf(wallet.address);
        const allowance = await wallet.SUTContract.allowance(wallet.address, process.env.ROUTERCONTRACT);

        if (allowance.toString() !== MAX_UINT256.toString()) {
            const approveTx = await wallet.SUTContract.approve(process.env.ROUTERCONTRACT, MAX_UINT256);
            await approveTx.wait();
        };
    
        const path = [process.env.SUTCONTRACT, process.env.GMTCONTRACT, process.env.USDTCONTRACT];
    
        const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
        const amountsOut = await wallet.routerContract.getAmountsOut(balance, path);
        const amountOutEstimated = amountsOut[2];
    
        const amountOutMin = amountOutEstimated / 100n * 93n;
    
        const swapTx = await wallet.routerContract.swapExactTokensForTokens(
            balance,
            amountOutMin,
            path,
            wallet.address,
            deadline
        );
    
        await swapTx.wait();
        log.success(`Wallet: ${wallet.address}. Swaped ${formatUnits(balance)} SUT to USDT!`);
        return true;
    } catch (error) {
        log.error(`Wallet: ${wallet.address}. sellSUT. Error message: ${err.message}\nStack: ${err.stack}`);
        return null;
    };
};

const withdrawSUT = async (wallet) => {
    const stats = await gameContract.getStats(wallet);
    const pointsBalance = formatUnits(stats.pointsBalance);
    let res = await gameContract.withdrawPointsToSUT(wallet, stats.pointsBalance);
    if (res !== null){
        log.success(`Wallet: ${wallet.address}. Withdrawed ${pointsBalance.toString()} SUT!`);
        return true;
    }
    else 
        return false
};


const collect = async (wallet) => {
    try {
        const checkNFT = await gameContract.verifyNFTownership(wallet);
        if (checkNFT === false) {
            log.info(`Wallet: ${wallet.address}. Doesn't own NFT. token_id: ${wallet.token_id}`);
            const timeout = utils.timeToNextDay();
            setTimeout(collect, timeout, wallet);
            return;
        };

        const result = {};
        result.drink = await gameContract.canDrink(wallet);
        result.shower = await gameContract.canShower(wallet);
        result.workOut = await gameContract.canWorkOut(wallet);

        if (result.drink) {
            let res = await gameContract.drink(wallet);
            log.success(`Wallet: ${wallet.address}. It's drunk!`);
            await randomDelay(5000, 7500); 
        };

        if (result.shower) {
            let res = await gameContract.shower(wallet);
            log.success(`Wallet: ${wallet.address}. Washed in the shower!`);
            await randomDelay(5000, 7500); 
        };

        if (result.workOut) {
            let res = await gameContract.workOut(wallet);
            log.success(`Wallet: ${wallet.address}. WorkOut completed!`);
            await randomDelay(5000, 7500); 
        };

        result.levelUp = await gameContract.canLevelUp(wallet);
        if (result.levelUp) {
            const stats = await gameContract.getStats(wallet);
            const level = stats.level.toString();
            if (+level < 20){
                const pointsBalance = formatUnits(stats.pointsBalance);
                const levelUpPrice = levelsTab[+level + 1];
    
                if (levelUpPrice <= Number(pointsBalance)){
                    let res = await gameContract.levelUp(wallet);
                    log.success(`Wallet: ${wallet.address}. Level up!`);
                    await randomDelay(5000, 7500); 
                }
                else 
                    log.debug(`Wallet: ${wallet.address}. Don't enough points`);
            }
            else {
                log.info(`Wallet: ${wallet.address}. 20 level is reached`);
                let res = await withdrawSUT(wallet);
                if (!res)
                    throw new Error("Withdraw SUT failed");
                res = await sellSUT(wallet);
                if (!res)
                    throw new Error("Sell SUT failed");
                res = await transferUSDT(wallet);
                if (!res)
                    throw new Error("Transfer USDT failed");
            };
        };

        const stats = await gameContract.getStats(wallet);
        const level = stats.level;
        const pointsBalance = formatUnits(stats.pointsBalance);

        log.success(`Wallet: ${wallet.address}. Daily collected! Total points: ${pointsBalance.toString()}. Level: ${level.toString()}`);
        await randomDelay(2000, 6000);
        const timeout = utils.timeToNextDay();
        setTimeout(collect, timeout, wallet);
    }
    catch (err){
        log.error(`Wallet: ${wallet.address}. Error message: ${err.message}\nStack: ${err.stack}`);
    };
};

async function main() {
    const data = process.env.DECRYPT ? await utils.readDecryptCSVToArray() : await utils.readCSVToArray();
    const wallets = [];
    for (let index =  0; index < data.length; index++) {
        const row = data[index];
        const wallet = new Wallet(row);
        const delay = Math.floor(Math.random() * (process.env.MAXTIME - 1_000 + 1)) + 1_000;
        setTimeout(collect, delay, wallet);
        wallets.push(wallet);
    };
};

main();
