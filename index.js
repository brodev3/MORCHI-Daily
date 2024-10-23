require('./scr/utils/errorHandler');
const Wallet = require('./scr/wallet');
const MorchiGame = require('./scr/MorchiGame');
const utils = require('./scr/utils/utils');
const log = require('./scr/utils/logger');
const levelsTab = require('./scr/levels.json');
const { ethers, formatUnits, parseUnits } = require('ethers');
const config = require('./input/config');
const db = require('./scr/db/db');

const gameContract = new MorchiGame();
const MAX_UINT256 = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");

function randomDelay(min, max) {
    return new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min));
};

function randomValueDelay(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

const transferUSDT = async (wallet) => {
    let attempts = 0;
    let maxAttempts = 5;
    let delay = 10_000; 
    
    while (attempts < maxAttempts) {
        try {
            const balance = await wallet.USDTContract.balanceOf(wallet.address);
            
            if (!wallet.withdrawAddress) return;

            const transferTx = await wallet.USDTContract.transfer(wallet.withdrawAddress, balance);
            await transferTx.wait();

            const wei = parseUnits(balance.toString(), "szabo");
            log.successDB(wallet, "transferUSDT", `Transfered ${formatUnits(wei)} USDT to ${wallet.withdrawAddress}!`);
            return true;
        } catch (error) {
            attempts++;
            await log.errorDB(wallet, "transferUSDT", `Attempts ${attempts}: ` + error.message, error.stack);

            if (attempts >= maxAttempts) return null;

            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2; 
        };
    };
};

const sellSUT = async (wallet) => {
    let attempts = 0;
    let maxAttempts = 5;
    let delay = 1000; 
    
    while (attempts < maxAttempts) {
        try {
            const balance = await wallet.SUTContract.balanceOf(wallet.address);
            const allowance = await wallet.SUTContract.allowance(wallet.address, config.ROUTERCONTRACT);

            if (allowance.toString() !== MAX_UINT256.toString()) {
                const approveTx = await wallet.SUTContract.approve(config.ROUTERCONTRACT, MAX_UINT256);
                await approveTx.wait();
            };

            const path = [config.SUTCONTRACT, config.GMTCONTRACT, config.USDTCONTRACT];
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
            log.successDB(wallet, "sellSUT", `Swapped ${formatUnits(balance)} SUT to USDT!`);
            return true;
        } catch (error) {
            attempts++;
            await log.errorDB(wallet, "sellSUT", `Attempts ${attempts}: ` + error.message, error.stack);

            if (attempts >= maxAttempts) return null;

            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2; 
        };
    };
};

const withdrawSUT = async (wallet) => {
    const stats = await gameContract.getStats(wallet);
    const pointsBalance = formatUnits(stats.pointsBalance);
    let res = await gameContract.withdrawPointsToSUT(wallet, stats.pointsBalance);
    if (res !== null){
        log.successDB(wallet, "withdrawSUT", `Withdrawed ${pointsBalance.toString()} SUT!`);
        return true;
    }
    else 
        return false
};


const collect = async (wallet) => {
    try {
        const checkNFT = await gameContract.verifyNFTownership(wallet);
        if (checkNFT === false) {
            log.infoDB(wallet, "verifyNFTownership", ` Doesn't own NFT. token_id: ${wallet.token_id}`);
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
            log.successDB(wallet, "drink", `It's drunk!`);
            await randomDelay(5000, 7500); 
        };

        if (result.shower) {
            let res = await gameContract.shower(wallet);
            log.successDB(wallet, "shower", `Washed in the shower!`);
            await randomDelay(5000, 7500); 
        };

        if (result.workOut) {
            let res = await gameContract.workOut(wallet);
            log.successDB(wallet, "workOut", `WorkOut completed!`);
            await randomDelay(5000, 7500); 
        };

        result.levelUp = await gameContract.canLevelUp(wallet);
        if (result.levelUp) {
            const stats = await gameContract.getStats(wallet);
            const level = stats.level.toString();
            const pointsBalance = formatUnits(stats.pointsBalance);
            if (+level < 20){
                const levelUpPrice = levelsTab[+level + 1];
    
                if (levelUpPrice <= Number(pointsBalance)){
                    let res = await gameContract.levelUp(wallet);
                    log.successDB(wallet, "levelUp", `Level up!`);
                    await randomDelay(5000, 7500); 
                }
                else 
                    log.infoDB(wallet, "levelUp", `Don't enough points`);
            }
            else {
                log.infoDB(wallet, "levelUp", `20 level is reached`);
                if (Number(pointsBalance) > 0){
                    let res = await withdrawSUT(wallet);
                    if (!res)
                        throw new Error("Withdraw SUT failed");
                    res = await sellSUT(wallet);
                    if (!res)
                        throw new Error("Sell SUT failed");
                    res = await transferUSDT(wallet);
                    if (!res)
                        throw new Error("Transfer USDT failed");
                }
                else 
                    log.infoDB(wallet, "collectSUT", `Don't enough points`);
            };
        };

        const stats = await gameContract.getStats(wallet);
        const level = stats.level;
        const pointsBalance = formatUnits(stats.pointsBalance);
        await db.updateMetric(wallet, 'level', `${level}`);
        await db.updateMetric(wallet, 'points', `${pointsBalance}`);

        log.successDB(wallet, "collect", `Daily collected! Total points: ${pointsBalance.toString()}. Level: ${level.toString()}`);
        await randomDelay(2000, 6000);
        let timeout;
        if (config.scheduler.everyday) {
            const timeToNextDay = utils.fixedTimeToNextDay(config.scheduler.fixed_time, config.scheduler.utc_offset);
            const maxTime = config.scheduler.max_time_in_ms;
            timeout = randomValueDelay(timeToNextDay, timeToNextDay + maxTime);
        } else timeout = utils.timeToNextDay();
        setTimeout(collect, timeout, wallet);
    }
    catch (err){
        log.errorDB(wallet, "collect", err.message, err.stack);
    };
};

async function main() {
    await db.startApp();
    const data = config.decryption.decrypt ? await utils.readDecryptCSVToArray() : await utils.readCSVToArray();    const wallets = [];
    for (let index =  0; index < data.length; index++) {
        const row = data[index];
        const wallet = new Wallet(row);
        await db.ensureByAddress(wallet);
        await db.addProjectToWallet(wallet, config.mongoDB.project_name);
        const startDate = config.scheduler.start_date ? utils.parseDateToTimestamp(config.scheduler.start_date, config.scheduler.utc_offset) : Date.now() + 2000;
        const maxTime = config.scheduler.max_time_in_ms;
        const timeToStart = startDate - Date.now();
        const delay = randomValueDelay(timeToStart <= 0 ? 0:timeToStart, timeToStart + maxTime);
        setTimeout(collect, delay, wallet);
        wallets.push(wallet);
    };
};

main();
