const Discord = require('discord.js');
const { getTime } = require('./Utils');
const { createWriteStream, readdirSync } = require('fs');
const { resolve } = require('path');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

class DiscordBot extends Discord.Client {
    constructor(data) {
        super(data.options);

        this.config = data;
        this.commands = new Discord.Collection();
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
        this.log('Registering events...');

        let loaded = 0;
        let path = resolve(__dirname, './events/');
        let files = readdirSync(path).filter(file => file.endsWith('.js'));

        for (let file of files) {
            const event = require(path + '\\' + file);
            let name = file.replace('.js', '');

            if (event.once)
                this.once(name, (...args) => event(...args));
            else
                this.on(name, (...args) => event(...args));

            this.log(`Success: Loaded event '${name}'`);
            loaded++;
        }

        this.log(`Success: Loaded ${loaded} events`);
    }

    loadCommands() {
        this.log('Loading commands...');
        this.commands.clear();

        let loaded = 0;
        let path = resolve(__dirname, './commands/');
        let files = readdirSync(path).filter(file => file.endsWith('.js'));

        for (let file of files) {
            const command = require(path + '\\' + file);

            if (!command.data?.name) {
                this.log(`Error: Missing command data, name '${file}'`);
                continue;
            } if (!command.execute) {
                this.log(`Error: Missing command data, execute '${file}'`);
                continue;
            }

            this.commands.set(command.data.name, command);
            this.log(`Success: Loaded command '${command.data.name}'`);
            loaded++;
        }

        this.log(`Success: Loaded ${loaded} commands`);
    }

    deployCommands(type = 'local') {
        let cmdsData = [];
        this.commands.forEach(command => {
            cmdsData.push(command.data.toJSON());
        });

        switch (type) {
            case 'global':
                break;
            default:
                const rest = new REST({ version: '9' }).setToken(this.config.token);

                rest.put(
                    Routes.applicationGuildCommands(this.user.id, this.config.guildId),
                    { body: cmdsData },
                )
                .then(() => this.log('Success: Deployed commands to development environment'))
                .catch(e => this.log(`Error: Couldn't deploy commands to development environment\n${e}`));
                break;
        }
    }

    loadDatabase() {

    }
}

module.exports = DiscordBot;