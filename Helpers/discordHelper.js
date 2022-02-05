const { guildId, channelId } = require('../config.json');

function findCorrectChannel(discordClient) {
    const guild = discordClient.guilds.cache.find(guild => guild.id === guildId);
    return guild.channels.cache.find(channel => channel.id === channelId);
}

function displayServersInfos(discordClient) {
    console.log(discordClient);
    discordClient.guilds.cache.map(guild => {
        console.log('Server Name: ' + guild.name + '\nId: ' + guild.id + '\n')
        guild.channels.cache.map(channel => {
            console.log('\tChannel Name: ' + channel.name + '\n\tId: ' + channel.id + '\n');
        });
        console.log('\n');
    });
    discordClient.destroy();
}

module.exports = { displayServersInfos, findCorrectChannel };