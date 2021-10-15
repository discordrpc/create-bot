module.exports = (client) => {
    client.log('Client online and ready, deploying commands!');
    client.deployCommands();
}