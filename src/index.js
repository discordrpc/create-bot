/**
 * @file index file for NodeJS execution
 * 
 * @requires node:path:join
 * @requires node:path:resolve
 * @requires node:fs:stat
 * @requires node:fs:createWriteStream
 * @requires node:fs:readFile
 * @requires node:fs:writeFile
 * @requires node:readline
 * @requires file:Utils:getDate
 * @requires file:Utils:getTime
 */



async function preInit() {
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
                    console.log(`Success: Dependency found '${dep}'`);
                } catch (e) {
                    console.warn(`Installing dependency ${dep}...`);

                    exec(`npm install ${dep}`, (error, stdout, stderr) => {
                        if (error) {
                            console.error(`Error: Failed to install dependency '${dep}'`);
                            failedInstalls.push(dep);
                        } else {
                            console.log(`Success: Installed dependency '${dep}'`);
                        }
        
                        if (stderr) {
                            console.error(stderr);
                        }
                    });
                }
            }

            // Exit if dependencies are missing
            if (failedInstalls.length > 0) {
                console.error(`Error: Failed to install all dependencies '${failedInstalls.join(', ')}'`);
                process.exit();
            }

            resolve();
        });
    }

    await checkDeps();
}

async function init() {
    const { resolve: pathResolve, join } = require('path');
    const { stat, createWriteStream, readFile, writeFile, readdirSync } = require('fs');
    const readline = require('readline');
    const DiscordBot = require('./bot');
    const { getDate, getTime } = require('./Utils');

    const CONFIG_LOCATION = pathResolve('src/data/config.json'); // Location of config file

    async function loadConfig() {
        return await new Promise(resolve => {
            console.log('Loading config...');

            stat(CONFIG_LOCATION, async (err, stat) => {
                if (!err) {
                    console.log('Success: Config file found');
                    readFile(CONFIG_LOCATION, 'utf8', (err, data) => {
                        if (err) {
                            console.error(err);
                            process.exit();
                        }
        
                        data = JSON.parse(data);
                        let write = false;
        
                        if (data.owner == undefined) {
                            data.owner = 'unknown';
                            write = true;
                        } if (data.options == undefined){
                            data.options = { intents: ['GUILDS'] };
                            write = true;
                        } if (data.logs == undefined){
                            data.logs = { max: 20, directory: pathResolve('src/data/logs/') };
                            write = true;
                        }
        
                        if (write) {
                            writeFile(CONFIG_LOCATION, JSON.stringify(data), (err) => {
                                if (err) console.error(err);
                            });
                        }
    
                        resolve(data);
                    });
                }
        
                else if (err.code == 'ENOENT') {
                    console.error(`Error: No such file or directory '${CONFIG_LOCATION}'`);
        
                    let rl = readline.Interface({ input: process.stdin, output: process.stdout });
                    let createNew = await new Promise(resolve => rl.question('Would you like to create a default config file (Y/N)\n', ans => {
                        rl.close();
                        resolve(ans);
                    }));
                    
                    switch (createNew.toLowerCase()) {
                        case 'y' || 'yes':
                            let writeStream = createWriteStream(CONFIG_LOCATION, { flags: 'a' });
                            let defaultData = { 
                                token: 'unknown',
                                owner: 'unknown',
                                options: {
                                    shards: 'auto',
                                    intents: [
                                        'GUILDS',
                                        'GUILD_MEMBERS',
                                        'GUILD_BANS',
                                        'GUILD_MESSAGES',
                                        'GUILD_MESSAGE_REACTIONS',
                                        'DIRECT_MESSAGES',
                                        'DIRECT_MESSAGE_REACTIONS'
                                    ]
                                },
                                logs: {
                                    max: 20,
                                    directory: pathResolve('src/data/logs/')
                                }
                            };
                            
                            writeStream.write(JSON.stringify(defaultData), 'utf8', (e) => {
                                if (e) throw new Error(e);

                                console.log(`Success: New config file created '${CONFIG_LOCATION}'`);
                                console.log('IMPORTANT || SET THE CORRECT BOT TOKEN IN THE NEW CONFIG FILE || IMPORTANT');
                                process.exit();
                            });
                            break;
                        case 'n' || 'no':
                            console.error(`Error: Config file must be created`);
                            process.exit();
                        default:
                            console.error(`Error: Invalid input '${createNew}', must be Y or N`);
                            process.exit();
                    }
                }
            });
        });
    }

    async function loadLogs(dir, max) {
        return await new Promise(resolve => {
            console.log(`Creating new log file...`);
            if (!dir) {
                console.error(`Error: Invalid directory '${dir}'`);
                return false;
            }

            let logFile = join(dir + '\\' + getDate() + '-' + getTime('-') + '.log');

            if (max > 0) {
                let files = readdirSync(dir)
                            .filter(file => file.endsWith('.log') && !file.startsWith('example'));

                let oldestFile, index;
                let birthTime = Infinity;
                let iterate = files.length - 1;

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
                            console.error(`Error: Couldn't grab stats '${file}'\n${e}`);
                            continue;
                        }
                    }
                        
                    try {
                        rmSync(logs + oldestFile);
                        birthTime = Infinity;
                        index = undefined;
                        oldestFile = undefined;
                        console.log(`Success: Removed log file '${oldestFile}'`);
                    } catch(e) {
                        console.error(`Error: Couldn't delete file '${oldestFile}'\n${e}`);
                        continue;
                    }
                }
            }

            resolve(logFile);
        });
    }

    let data = await loadConfig();
    let currentFile = await loadLogs(data.logs?.directory, data.logs?.max);
    if (!currentFile) {
        data.logs.enabled = false;
    } else {
        data.logs.current = currentFile;
        data.logs.enabled = true;
    }

    let client = new DiscordBot(data);
    module.exports = client;
}

preInit();
init();