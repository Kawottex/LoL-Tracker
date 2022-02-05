const API_INFOS_KEY = {
    QUEUE_TYPE: 'queueType',
    SUMMONER_NAME: 'summonerName',
    TIER: 'tier',
    RANK: 'rank',
    LP: 'leaguePoints',
    WINS: 'wins',
    LOSSES: 'losses',
}

const SAVED_INFOS_KEY = {
    SUMMONER_NAME: 'summonerName',
    TIER: 'tier',
    RANK: 'rank',
    LP: 'leaguePoints',
    WL_RATIO: 'wlRatio',
}

const COMPARISON_RESULT_KEY = {
    HAS_CHANGED: 0,     // bool
    MAIN_TEXT: 1,       // string 
    RESUME_TEXT: 2,     // string
    CHANGE_LEVEL: 3,    // int: 0 = LP, 1 = Rank, 2 = Tier
}

const lolTierToNum = {
    'IRON': 0,
    'BRONZE': 1,
    'SILVER': 2,
    'GOLD': 3,
    'PLATINUM': 4,
    'DIAMOND': 5,
    'MASTER': 6,
    'CHALLENGER': 7,
}

const lolNumToTier = {
    0: 'IRON',
    1: 'BRONZE',
    2: 'SILVER',
    3: 'GOLD',
    4: 'PLATINUM',
    5: 'DIAMOND',
    6: 'MASTER',
    7: 'CHALLENGER',
}

const lolRankToNum = {
    'IV': 0,
    'III': 1,
    'II': 2,
    'I': 3,
}

const lolNumToRank = {
    0: 'IV',
    1: 'III',
    2: 'II',
    3: 'I',
}

module.exports = { API_INFOS_KEY, SAVED_INFOS_KEY, COMPARISON_RESULT_KEY,
    lolTierToNum, lolNumToTier, lolRankToNum, lolNumToRank };