// Require the necessary discord.js classes
const { Client, Intents } = require('discord.js');
const { token, channelIdLPDiff, channelIdRankDiff, channelIdTierDiff } = require('./config.json');
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
            const channelLP = DiscordHelper.findCorrectChannel(discordClient, channelIdLPDiff);
            const channelRank = DiscordHelper.findCorrectChannel(discordClient, channelIdRankDiff);
            const channelTier = DiscordHelper.findCorrectChannel(discordClient, channelIdTierDiff);
            let channels = [ channelLP, channelRank, channelTier ];
            mainRequestLoop(channels);
        }
    });
    discordClient.login(token);
}

async function mainRequestLoop(channels) {
    const usersId = await LoLHelper.getSummonersId();
    while (true) {
        for (let i = 0; i < usersId.length; i++) {
            const currUserId = usersId[i];
            const lolEntriesAddr = LoLHelper.getLoLEntriesBySummoner(currUserId);
            const tftEntriesAddr = LoLHelper.getTFTEntriesBySummoner(currUserId);
            await updateRiotEntries(channels, currUserId, lolEntriesAddr);
            await updateRiotEntries(channels, currUserId, tftEntriesAddr);
        }
        await AxiosHelper.delay(60000);
    }
}

async function updateRiotEntries(channels, userId, entriesAddr) {
    const data = await AxiosHelper.riotAPIGet(entriesAddr);
    if (data != null) {
        updateDatas(channels, userId, data);
    }
    await AxiosHelper.delay(500);
}

function updateDatas(channels, summId, dataArr) {
    if (summData[summId] == null) {
        summData[summId] = {};
    }
    let savedData = summData[summId];
    for (let i = 0; i < dataArr.length; i++) {
        const currData = dataArr[i];
        const queueType = currData[Enums.API_INFOS_KEY.QUEUE_TYPE];

        if (queueType.indexOf("TFT") !== -1 && queueType !== "RANKED_TFT") {
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

        let result = LoLHelper.compareQueueDatas(summName, savedQueue, currData, queueType);
        if (result[Enums.COMPARISON_RESULT_KEY.HAS_CHANGED]) {
            console.log("New infos for " + summName + " queue " + queueType);
            let finalMsg = result[Enums.COMPARISON_RESULT_KEY.MAIN_TEXT] + '\n' + result[Enums.COMPARISON_RESULT_KEY.RESUME_TEXT];
            let channelToUse = channels[result[Enums.COMPARISON_RESULT_KEY.CHANGE_LEVEL]];
            if (channelToUse != null) {
                channelToUse.send(finalMsg);
            }
        }
        LoLHelper.saveNewQueueDatas(savedQueue, currData);
    }
}