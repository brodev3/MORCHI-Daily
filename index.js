const Wallet = require('./scr/wallet');
const MorchiGame = require('./scr/MorchiGame');
const utils = require('./scr/utils/utils');
const log = require('./scr/utils/logger');
const levelsTab = require('./scr/levels.json');
const { ethers, formatUnits } = require('ethers');

const gameContract = new MorchiGame();

function randomDelay(min, max) {
    return new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min));
};

const collect = async (wallet) => {
    try {
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
            const pointsBalance = formatUnits(stats.pointsBalance);
            const levelUpPrice = levelsTab[+level + 1];

            if (levelUpPrice < Number(pointsBalance)){
                let res = await gameContract.levelUp(wallet);
                log.success(`Wallet: ${wallet.address}. Level up!`);
                await randomDelay(5000, 7500); 
            }
            else 
                log.error(`Wallet: ${wallet.address}. Don't enough points`);
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
    const data = await utils.readDecryptCSVToArray();
    const wallets = [];
    for (let index =  0; index < data.length; index++) {
        const row = data[index];
        const wallet = new Wallet(row);
        const delay = Math.floor(Math.random() * (10_000 - 0 + 1)) + 0;
        setTimeout(collect, delay, wallet);
        wallets.push(wallet);
    };
};

main();
