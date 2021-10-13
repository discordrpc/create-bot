/**
 * @file Utilities that can be used within program code
 * 
 * @implements {node:child_process:exec}
 */
 const { exec } = require('child_process');


/**
 * Checks {@link ../package-lock.json} for required dependencies and installs them
 * using the command line if they're missing.
 */
 function checkDeps() {
    console.log('Checking dependencies...');

    // Get dependency data
    let deps = require('../package-lock.json');
    deps = Object.keys(deps.packages[''].dependencies);

    // List of dependencies that failed to install
    let failedInstalls = [];

    // Iterate data and install missing dependencies
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
                    failedInstalls.push(dep);
                } else {
                    console.log(`Installed ${dep}!`);
                }

                if (stderr) {
                    console.error(stderr);
                }
            })
        }
    }

    // Exit process if dependencies are missing
    if (failedInstalls.length > 0) {
        console.error(`Failed to install dependencies: ${failedInstalls.join(', ')}`);
        console.error(`Advised to install them manually!`);
        process.exit();
    }
}

// Export util functions
module.exports = {
    checkDeps
}