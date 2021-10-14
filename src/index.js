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



/**
 * @function preInit
 * @async
 * 
 * @description Executes as a pre initialization function when the program
 * is executed using NodeJS.
 */
async function preInit() {

    /**
     * @function checkDeps
     * @async
     * 
     * @description Checks the {@link ../package-lock.json} file for required
     * dependencies. If any are missing they are installed using NPM and the
     * available command line.
     */
    async function checkDeps() {

        // Promise used to await the function
        await new Promise((resolve, reject) => {
            console.log('Checking dependencies...');

            // Get required dependencies
            let deps = require('../package-lock.json');
            deps = Object.keys(deps.packages[''].dependencies);

            // Store failed dependencies
            let failedInstalls = [];

            // Iterate over dependencies
            for (let dep of deps) {
                try {
                    // Check if the dependency exists
                    require.resolve(dep);
                    console.log(`Success: Dependency found '${dep}'`);
                } catch (e) {
                    console.warn(`Installing dependency ${dep}...`);

                    // Attempt to install the missing dependency
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

            // Exit process if dependencies are missing
            if (failedInstalls.length > 0) {
                console.error(`Error: Failed to install all dependencies '${failedInstalls.join(', ')}'`);
                process.exit();
            }

            resolve();
        });
    }

    await checkDeps();
}

/**
 * @function init
 * @async
 * 
 * @description Executes as an initialization function when the program
 * is executed using NodeJS. Runs after @function preInit
 */
async function init() {
    // Import dependencies
    const { resolve: pathResolve, join } = require('path');
    const { stat, createWriteStream, readFile, writeFile, readdirSync } = require('fs');
    const readline = require('readline');
    const DiscordBot = require('./bot');
    const { getDate, getTime } = require('./Utils');

    // Location of config file
    const CONFIG_LOCATION = pathResolve('src/data/config.json');

    /**
     * @function loadConfig
     * @async
     * 
     * @description Attempts to find a config file in the given directory
     * or location. If no file is found it will ask the user if they want to
     * create a new one using default data. If a file is found the data is returned.
     * 
     * @returns {Set<Object>} The config data
     */
    async function loadConfig() {
        
        // Promise used to await the function
        return await new Promise(resolve => {
            console.log('Loading config...');

            // Check if the file exists
            stat(CONFIG_LOCATION, async (err, stat) => {
                if (!err) {
                    console.log('Success: Config file found');
                    
                    // Read file contents and parse to JSON
                    readFile(CONFIG_LOCATION, 'utf8', (err, data) => {
                        if (err) {
                            console.error(err);
                            process.exit();
                        }
        
                        data = JSON.parse(data);
                        let write = false;
        
                        // Check if required elements exist
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
        
                        // Write to file with missing elements
                        if (write) {
                            writeFile(CONFIG_LOCATION, JSON.stringify(data), (err) => {
                                if (err) console.error(err);
                            });
                        }
    
                        // Return config data
                        resolve(data);
                    });
                }
        
                // If the file doesn't exist
                else if (err.code == 'ENOENT') {
                    console.error(`Error: No such file or directory '${CONFIG_LOCATION}'`);
        
                    // Ask the user if they want to create a default file
                    let rl = readline.Interface({ input: process.stdin, output: process.stdout });
                    let createNew = await new Promise(resolve => rl.question('Would you like to create a default config file (Y/N)\n', ans => {
                        rl.close();
                        resolve(ans);
                    }));
                    
                    // Check the response
                    switch (createNew.toLowerCase()) {
                        case 'y' || 'yes':
                            // Create a write stream to write the new file
                            let writeStream = createWriteStream(CONFIG_LOCATION, { flags: 'a' });

                            // Create default data object
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
                            
                            // Write default data to file
                            writeStream.write(JSON.stringify(defaultData), 'utf8', (e) => {
                                if (e) throw new Error(e);

                                console.log(`Success: New config file created '${CONFIG_LOCATION}'`);
                                console.log('IMPORTANT || SET THE CORRECT BOT TOKEN IN THE NEW CONFIG FILE || IMPORTANT');
                                process.exit();
                            });
                            break;
                        case 'n' || 'no':
                            // Exit process
                            console.error(`Error: Config file must be created`);
                            process.exit();
                        default:
                            // Exit process
                            console.error(`Error: Invalid input '${createNew}', must be Y or N`);
                            process.exit();
                    }
                }
            });
        });
    }

    /**
     * @function loadLogs
     * @async
     * 
     * @description Attempts to remove old log files if they exceed
     * the allowed files limit. Then gets the directory used to store
     * log files and creates a file where data will be stored for
     * the current process.
     * 
     * @param {String} dir The directory used to store log files
     * @param {Int} max The maximum amount of files allowed
     * @returns {String} The path for the file used for logging
     */
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

    // Get config data and log directory
    let data = await loadConfig();
    let currentFile = await loadLogs(data.logs?.directory, data.logs?.max);
    if (!currentFile) {
        data.logs.enabled = false;
    } else {
        data.logs.current = currentFile;
        data.logs.enabled = true;
    }

    // Create client
    let client = new DiscordBot(data);
    module.exports = client;
}

// Initialize
preInit();
init();