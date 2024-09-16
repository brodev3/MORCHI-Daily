const Wallet = require('./scr/wallet');
const MorchiGame = require('./scr/MorchiGame');
const utils = require('./scr/utils/utils');

const gameContract = new MorchiGame();

async function main() {
    const data = await utils.readDecryptCSVToArray();
    const wallets = [];
    for (let index =  0; index < data.length; index++) {
        const row = data[index];
        const wallet = new Wallet(row);
        const stats = await gameContract.getStats(wallet);
        const level = stats.level;
        console.log(wallet.address + ";" + level.toString());
    };
};

main();
