/**
 * @file Main process execution file 
 * 
 * @implements {file:Utils:checkDeps}
 * @implements {file:Main:init}
 */


async function start() {
    const Discord = require('discord.js');
    const { join } = require('path');
    const { readFile, writeFile, createWriteStream, readdirSync, rmSync, statSync } = require('fs');
    const utils = require('./Utils');

    class DiscordBot extends Discord.Client {
        constructor (options) {
            super(options);

            this.config = require('./data/config.json');
            this.owner = this.config.owner;
            this.utils = utils;
            this.loadLogs();
            this.loadEvents();
            this.loadCommands();
            this.loadDatabase();
            this.login('ODk3OTg3Mzc0Njc0NDg1MzA5.YWdp6Q.GAo7_RkUky9SdxtbL43H_Ehync0');
        }

        loadEvents() {

        }

        loadCommands() {

        }

        loadDatabase() {

        }

        loadLogs() {
            // Get file name
            let date = this.utils.getDate();
            let time = this.utils.getTime('-');
            let logDir = join(__dirname, this.config.logs?.directory);
            this.logFile = join(logDir + date + '-' + time + '.log');

            // Array of files
            let files = readdirSync(join(__dirname, './data/logs/'))
                        .filter(file => file.endsWith('.log') && !file.startsWith('example'));

            // Old file removal vars
            let oldestFile, index;
            let birthTime = Infinity;
            let iterate = files.length - 1;

            // Iterate and remove oldest
            for (let i = 0; i < iterate; i++) {
                for (let fileI in files) {
                    let file = files[fileI];
                    try {
                        let stats = statSync(logs + file);
                        if (stats.birthtimeMs < birthTime) {
                            birthTime = stats.birthtimeMs;
                            oldestFile = file;
                            index = fileI;
                        }
                    } catch(e) {
                        console.log(`Couldn't grab stats for ${file}!\n` + e);
                        continue;
                    }
                }
                    
                try {
                    rmSync(logs + oldestFile);
                    birthTime = Infinity;
                    index = undefined;
                    oldestFile = undefined;
                } catch(e) {
                    console.log(`Couldn't delete ${oldestFile}!\n` + e);
                    continue;
                }
            }

            // Log function
            this.log = (data = '') => {
                if (data.length < 1) return;

                let time = this.utils.getTime();

                let msg = time + ' >> ' + data;
                let writeStream = createWriteStream(this.logFile, { flags: 'a' });

                writeStream.on('error', (e) => { console.log(time + ' >> Failed to log "' + data + '"!\n' + e); });

                writeStream.write(msg + '\n');
                console.log(msg);
            }

            this.log('Logs loaded!');
        }
    }

    // Load client config
    async function loadConfig() {
        return await new Promise((resolve, reject) => {
            let configPath = join(__dirname, './data/config.json');

            // Read config file
            return readFile(configPath, 'utf8', (err, data) => {
                if (err) console.log(err);
                data = JSON.parse(data);

                let writeable = false;
                
                if (data.intents?.length < 1) {
                    data.intents = ['GUILDS', 'GUILD_MEMBERS', 'GUILD_BANS', 'GUILD_MESSAGES', 'DIRECT_MESSAGES'];
                    writeable = true;
                }

                if (!data.logs || !data.logs?.directory || !data.logs?.max) {
                    data.logs = { 'directory': join(__dirname, './data/logs/'), 'max': 20 }
                    writeable = true;
                }

                // Write data to file
                if (writeable) writeFile(configPath, JSON.stringify(data), (err) => {
                    if (err) console.log(err);
                });
                
                let options = { shards: 'auto', intents: data.intents };
                resolve(options);
            });
        });
    }

    // Check required dependencies are installed
    async function checkDeps() {
        await new Promise((resolve, reject) => {
            console.log('Checking dependencies...');
            let deps = require('../package-lock.json');
            deps = Object.keys(deps.packages[''].dependencies);

            let failedInstalls = [];

            // Iterate dependencies and install
            for (let dep of deps) {
                try {
                    require.resolve(dep);
                    console.log(`Dependency ${dep} found!`);
                } catch (e) {
                    console.warn(`Installing dependency ${dep}...`);

                    exec(`npm install ${dep}`, (error, stdout, stderr) => {
                        if (error) {
                            console.error(`Failed to install ${dep}!`);
                            failedInstalls.push(dep);
                        } else {
                            console.log(`Installed ${dep}!`);
                        }
        
                        if (stderr) {
                            console.error(stderr);
                        }
                    });
                }
            }

            // Exit if dependencies are missing
            if (failedInstalls.length > 0) {
                console.error(`Failed to install dependencies: ${failedInstalls.join(', ')}`);
                process.exit();
            }

            resolve();
        });
    }

    await checkDeps();

    let options = await loadConfig();
    const client = new DiscordBot(options);
    module.exports = client;

    // Error handling
    process.on('uncaughtException', errorHandling);
    process.on('unhandledRejection', errorHandling);

    async function errorHandling(err) {
        // Error handling
    }
}

start();