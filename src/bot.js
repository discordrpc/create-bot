const Discord = require('discord.js');
const { getTime } = require('./Utils');
const { createWriteStream } = require('fs');

class DiscordBot extends Discord.Client {
    constructor(data) {
        super(data.options);

        this.config = data;
        this.log('Success: Log system started');
        this.loadEvents();
        this.loadCommands();
        this.loadDatabase();
        this.login(this.config.token);
    }

    log(data = '') {
        if (data.length < 1) return;

        if (this.config.logs?.enabled) {
            let msg = getTime() + ' >> ' + data + '\n';

            let writeStream = createWriteStream(this.config.logs?.current, { flags: 'a' });
            writeStream.on('error', (e) => { console.log(`Error: Couldn't log data '${data}'\n${e}`) });
            writeStream.write(msg);
        }

        console.log(data);
    }

    loadEvents() {
        
    }

    loadCommands() {

    }

    loadDatabase() {

    }
}

module.exports = DiscordBot;