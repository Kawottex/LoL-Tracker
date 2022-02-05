// Require the necessary discord.js classes
const { Client, Intents } = require('discord.js');
const { token } = require('./config.json');
const DiscordHelper = require('./Helpers/discordHelper');
const LoLHelper = require('./Helpers/lolHelper');
const Enums = require('./enums');
const AxiosHelper = require('./Helpers/axiosHelper');

/*
{
    string (summonerId): {
        name: string,
        string (queueType): {
            tier: int,
            rank: int,
            leaguePoints: int,
            win/loss perc: int
        }
    }
}
*/
let summData = {};
const discordClient = new Client({ intents: [Intents.FLAGS.GUILDS] });

initDiscordClient();

function initDiscordClient() {    
    discordClient.once('ready', () => {
        if (process.argv.length >= 3 && process.argv[2] === '--discordInfos') {
            DiscordHelper.displayServersInfos(discordClient);
        } else {
            const channel = DiscordHelper.findCorrectChannel(discordClient);
            mainRequestLoop(channel);
        }
    });
    discordClient.login(token);
}

async function mainRequestLoop(channel) {
    const usersId = await LoLHelper.getSummonersId();
    while (true) {
        for (let i = 0; i < usersId.length; i++) {
            const riotAPIAddr = LoLHelper.getEntriesBySummoner(usersId[i]);
            const data = await AxiosHelper.riotAPIGet(riotAPIAddr);
            if (data != null) {
                updateDatas(channel, usersId[i], data);
            }
            await AxiosHelper.delay(500);
        }
        await AxiosHelper.delay(30000);
    }
}

function updateDatas(channel, summId, dataArr) {
    if (summData[summId] == null) {
        summData[summId] = {};
    }
    let savedData = summData[summId];
    for (let i = 0; i < dataArr.length; i++) {
        const currData = dataArr[i];
        const queueType = currData[Enums.API_INFOS_KEY.QUEUE_TYPE];

        if (queueType.indexOf("_TFT_") !== -1) {
            continue;
        }
        const summName = currData[Enums.API_INFOS_KEY.SUMMONER_NAME];
        savedData[Enums.SAVED_INFOS_KEY.SUMMONER_NAME] = summName;
        let savedQueue = savedData[queueType];
        if (savedQueue == null) {
            savedData[queueType] = {};
            console.log("New queue " + queueType + " for summoner " + summName);
            LoLHelper.saveNewQueueDatas(savedData[queueType], currData);
            continue;
        }

        let result = LoLHelper.compareQueueDatas(summName, savedQueue, currData);
        if (result[Enums.COMPARISON_RESULT_KEY.HAS_CHANGED]) {
            console.log("New infos for " + summName + " queue " + queueType);
            let finalMsg = result[Enums.COMPARISON_RESULT_KEY.MAIN_TEXT] + '\n' + result[COMPARISON_RESULT_KEY.RESUME_TEXT];
            channel.send(finalMsg);
        }
        LoLHelper.saveNewQueueDatas(savedQueue, currData);
    }
}