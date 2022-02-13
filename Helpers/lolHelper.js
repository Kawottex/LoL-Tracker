const enums = require('../enums');
const AxiosHelper = require('./axiosHelper');
const { tmpUserToTrack } = require('../config.json');

const getSummonerByName = (name) => 'https://euw1.api.riotgames.com/lol/summoner/v4/summoners/by-name/' + name;
const getLoLEntriesBySummoner = (summonerId) => 'https://euw1.api.riotgames.com/lol/league/v4/entries/by-summoner/' + summonerId;
const getTFTEntriesBySummoner = (summonerId) => 'https://euw1.api.riotgames.com/tft/league/v1/entries/by-summoner/' + summonerId;

async function getSummonersId() {
    let usersId = [];
    for (let i = 0; i < tmpUserToTrack.length; i++) {
        const riotAPIAddr = getSummonerByName(tmpUserToTrack[i]);
        const data = await AxiosHelper.riotAPIGet(riotAPIAddr);
        if (data != null) {
            usersId.push(data.id);
        }
        await AxiosHelper.delay(100);
    }
    return usersId;
}

function saveNewQueueDatas(savedQueue, currData) {
    savedQueue[enums.SAVED_INFOS_KEY.TIER] = enums.lolTierToNum[currData[enums.API_INFOS_KEY.TIER]];
    savedQueue[enums.SAVED_INFOS_KEY.RANK] = enums.lolRankToNum[currData[enums.API_INFOS_KEY.RANK]];
    savedQueue[enums.SAVED_INFOS_KEY.LP] = currData[enums.API_INFOS_KEY.LP];
    const wins = currData[enums.API_INFOS_KEY.WINS];
    const losses = currData[enums.API_INFOS_KEY.LOSSES];
    savedQueue[enums.SAVED_INFOS_KEY.WL_RATIO] = ((wins + losses) / wins) * 100;
}

function compareQueueDatas(summName, savedQueue, currData, queueType) {
    const savedTier = savedQueue[enums.SAVED_INFOS_KEY.TIER];
    const currTier = enums.lolTierToNum[currData[enums.API_INFOS_KEY.TIER]];
    const savedRank = savedQueue[enums.SAVED_INFOS_KEY.RANK];
    const currRank = enums.lolRankToNum[currData[enums.API_INFOS_KEY.RANK]];
    const savedLP = savedQueue[enums.SAVED_INFOS_KEY.LP];
    const currLP = currData[enums.API_INFOS_KEY.LP];

    let result = {
        [enums.COMPARISON_RESULT_KEY.HAS_CHANGED]: false,
        [enums.COMPARISON_RESULT_KEY.MAIN_TEXT]: '',
        [enums.COMPARISON_RESULT_KEY.RESUME_TEXT]: generateResumeText(savedQueue, currData, queueType),
        [enums.COMPARISON_RESULT_KEY.CHANGE_LEVEL]: 0,
    };

    result[enums.COMPARISON_RESULT_KEY.HAS_CHANGED] = (savedTier !== currTier) || (savedRank !== currRank) || (savedLP !== currLP);
    if (savedTier !== currTier) {
        result[enums.COMPARISON_RESULT_KEY.MAIN_TEXT] = generateTierDiffResult(summName, savedQueue, currData, queueType);
        result[enums.COMPARISON_RESULT_KEY.CHANGE_LEVEL] = 2;
    } else if (savedRank !== currRank) {
        result[enums.COMPARISON_RESULT_KEY.MAIN_TEXT] = generateRankDiffResult(summName, savedQueue, currData, queueType);
        result[enums.COMPARISON_RESULT_KEY.CHANGE_LEVEL] = 1;
    } else if (savedLP !== currLP) {
        result[enums.COMPARISON_RESULT_KEY.MAIN_TEXT] = generateLPDiffResult(summName, savedQueue, currData, queueType);
        result[enums.COMPARISON_RESULT_KEY.CHANGE_LEVEL] = 0;
    }

    return result;
}

function generateTierDiffResult(summName, savedQueue, currData, queueType) {
    const savedTierNum = savedQueue[enums.SAVED_INFOS_KEY.TIER];
    const currTierNum = enums.lolTierToNum[currData[enums.API_INFOS_KEY.TIER]];
    const savedRank = enums.lolNumToRank[savedQueue[enums.SAVED_INFOS_KEY.RANK]];
    const currRank = currData[enums.API_INFOS_KEY.RANK];
    const hasWon = savedTierNum < currTierNum;

    let mainText = hasWon ? '🥳' : '🤡';
    mainText += ` **${summName}** `;
    if (queueType.indexOf("TFT") !== -1) {
        mainText += hasWon ? 'MONTE DE LIGUE, ' : 'DESCEND DE LIGUE, ';
    } else {
        mainText += hasWon ? `A REMPORTÉ SON BO5 ET ARRIVE EN ${enums.lolNumToTier[currTierNum]}, ` 
        : `DIT AUREVOIR AU ${enums.lolNumToTier[savedTierNum]} ET DESCEND EN ${enums.lolNumToTier[currTierNum]}, `;
    }
    mainText += `IL PASSE DE ${enums.lolNumToTier[savedTierNum]} ${savedRank} À ${enums.lolNumToTier[currTierNum]} ${currRank}`;
    mainText += ` EN ${queueTypeKeyToStr(queueType)}`;
    return mainText;
}

function generateRankDiffResult(summName, savedQueue, currData, queueType) {
    const savedTier = enums.lolNumToTier[savedQueue[enums.SAVED_INFOS_KEY.TIER]];
    const currTier = currData[enums.API_INFOS_KEY.TIER];
    const savedRankNum = savedQueue[enums.SAVED_INFOS_KEY.RANK];
    const currRankNum = enums.lolRankToNum[currData[enums.API_INFOS_KEY.RANK]];
    const hasWon = savedRankNum < currRankNum;

    let mainText = hasWon ? '🔥' : '🥶';
    mainText += ` **${summName}** `;
    mainText += hasWon ? 'MONTE DE RANG, ' : 'A ÉTÉ DEMOTE, ';
    mainText += `IL PASSE DE ${savedTier} ${enums.lolNumToRank[savedRankNum]} À ${currTier} ${enums.lolNumToRank[currRankNum]}`;
    mainText += ` EN ${queueTypeKeyToStr(queueType)}`;
    return mainText;
}

function generateLPDiffResult(summName, savedQueue, currData, queueType) {
    const savedLP = savedQueue[enums.SAVED_INFOS_KEY.LP];
    const currLP = currData[enums.API_INFOS_KEY.LP];
    const hasWon = savedLP < currLP;

    let mainText = hasWon ? '📈' : '📉';
    mainText += ` **${summName}** `;
    mainText += hasWon ? `A GAGNÉ ${(currLP - savedLP).toString()}` : `A PERDU ${(savedLP - currLP).toString()}`;
    mainText += ` LPs EN ${queueTypeKeyToStr(queueType)}`;
    return mainText;
}

function generateResumeText(savedQueue, currData, queueType) {
    const savedTier = enums.lolNumToTier[savedQueue[enums.SAVED_INFOS_KEY.TIER]];
    const currTier= currData[enums.API_INFOS_KEY.TIER];
    const savedRank = enums.lolNumToRank[savedQueue[enums.SAVED_INFOS_KEY.RANK]];
    const currRank = currData[enums.API_INFOS_KEY.RANK];
    const savedLP = savedQueue[enums.SAVED_INFOS_KEY.LP];
    const currLP = currData[enums.API_INFOS_KEY.LP];

    return `\`[${queueTypeKeyToStr(queueType)}] ${savedTier} ${savedRank} - ${savedLP} LPs -> ${currTier} ${currRank} - ${currLP} LPs\``;
}

function queueTypeKeyToStr(queueType) {
    if (queueType.indexOf("RANKED_FLEX") !== -1) {
        return "RANKED FLEX";
    } else if (queueType.indexOf("RANKED_TFT") !== -1) {
        return "RANKED TFT";
    } else if (queueType.indexOf("RANKED_SOLO") !== -1) {
        return "RANKED SOLO/DUO";
    }
    return "RANKED";
}

module.exports = { getSummonerByName, getLoLEntriesBySummoner, getSummonersId,
    getTFTEntriesBySummoner, saveNewQueueDatas, compareQueueDatas }