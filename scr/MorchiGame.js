const log = require('./utils/logger')

class MorchiGame {

    constructor() { 
    };

    async verifyNFTownership(wallet) { 
        try {
            const owner = await wallet.NFTContract.ownerOf(wallet.token_id);
            if (wallet.address === owner)
                return true;
            else 
                return false;
        } catch (err) {
            log.errorDB(wallet, "verifyNFTownership", err.message, err.stack);
            return null;
        };
    };

    async getStats(wallet) {
        try {
            const canDrink = await wallet.gameContract.morchiStates(wallet.token_id);
            return canDrink;
        } catch (err) {
            log.errorDB(wallet, "getStats", err.message, err.stack);
            return null;
        };
    };

    async canDrink(wallet) {
        try {
            const canDrink = await wallet.gameContract.canDrink(wallet.token_id);
            return canDrink;
        } catch (err) {
            log.errorDB(wallet, "canDrink", err.message, err.stack);
            return null;
        };
    };

    async canShower(wallet) {
        try {
            const canShower = await wallet.gameContract.canShower(wallet.token_id);
            return canShower;
        } catch (err) {
            log.errorDB(wallet, "canShower", err.message, err.stack);
            return null;
        };
    };

    async canWorkOut(wallet) {
        try {
            const canWorkOut = await wallet.gameContract.canWorkOut(wallet.token_id);
            return canWorkOut;
        } catch (err) {
            log.errorDB(wallet, "canWorkOut", err.message, err.stack);
            return null;
        };
    };

    async canLevelUp(wallet) {
        try {
            const canLevelUp = await wallet.gameContract.canLevelUp(wallet.token_id);
            return canLevelUp;
        } catch (err) {
            log.errorDB(wallet, "canLevelUp", err.message, err.stack);
            return null;
        };
    };

    async drink(wallet) {
        try {
            const tx = await wallet.gameContract.chugEnergyDrink(wallet.token_id);
            await tx.wait();
            return tx;
        } catch (err) {
            log.errorDB(wallet, "chugEnergyDrink", JSON.stringify(err), err.stack);
            return null;
        };
    };

    async shower(wallet) {
        try {
            const tx = await wallet.gameContract.haveAColdShower(wallet.token_id);
            await tx.wait();
            return tx;
        } catch (err) {
            log.errorDB(wallet, "haveAColdShower", JSON.stringify(err), err.stack);
            return null;
        };
    };

    async workOut(wallet) {
        try {
            const tx = await wallet.gameContract.grindAtTheGym(wallet.token_id);
            await tx.wait();
            return tx;
        } catch (err) {
            log.errorDB(wallet, "grindAtTheGym", JSON.stringify(err), err.stack);
            return null;
        };
    };

    async levelUp(wallet) {
        try {
            const tx = await wallet.gameContract.levelUp(wallet.token_id);
            await tx.wait();
            return tx;
        } catch (err) {
            log.errorDB(wallet, "levelUp", JSON.stringify(err), err.stack);
            return null;
        };
    };

    async withdrawPointsToSUT(wallet, points) {
        try {
            const tx = await wallet.gameContract.withdrawPointsToSUT(wallet.token_id, points);
            await tx.wait();
            return tx;
        } catch (err) {
            log.errorDB(wallet, "withdrawPointsToSUT", JSON.stringify(err), err.stack);
            return null;
        };
    };

};



module.exports = MorchiGame;