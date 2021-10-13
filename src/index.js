/**
 * @file Main execution file for the bot
 * 
 * @implements {node:child_process}
 */


/**
 * Check and install all required dependencies listed
 * in {@link ../package-lock.json}
 */

// Get command line executor
const { exec } = require("child_process");

// Get required dependencies from package-lock.json
let deps = require("../package-lock.json");
deps = Object.keys(deps.packages[""].dependencies);

// Iterate through dependencies and check if they're installed
console.log("Checking dependencies...");
for (let dep of deps) {
    try {
        require.resolve(dep);
        console.log(`Dependency ${dep} found!`);
    } catch (e) {
        console.warn(`Installing dependency ${dep}...`);
        
        // Execute shell command to install dependency
        exec(`npm install ${dep}`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Failed to install ${dep}!`);
            }
            if (stderr) {
                console.error(stderr);
            }

            console.log(`Installed ${dep}!`)
        })
    }
}

