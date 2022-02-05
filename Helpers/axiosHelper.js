const Axios = require('axios');
const { riotToken } = require('../config.json');

const delay = ms => new Promise(res => setTimeout(res, ms));

async function riotAPIGet(addr) {
    const response = await Axios.get(addr, {
        headers: {
            "X-Riot-Token" : riotToken
        },
    }).catch(error => {
        console.log("Error on Get: " + addr + " : " + error);
        return null;
    });
    return response.data;
}

module.exports = { delay, riotAPIGet };