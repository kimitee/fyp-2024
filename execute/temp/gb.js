const express = require('express');
const { spawn } = require('child_process');
const path = require('path');

const gobusterCommandRouter = express.Router();

gobusterCommandRouter.post('/gobuster', (req, res) => {
    const { url, wordlist } = req.body;

    // Validate inputs to prevent security issues.

    // Use the absolute path to gobuster
    const gobusterPath = '/home/kimi/go/bin/gobuster'; // Specific path

    // Construct regular Gobuster command
    const regularCommand = `${gobusterPath} dir -u ${url} -w ${wordlist}`;

    // Construct Gobuster command with -q flag
    const quietCommand = `${gobusterPath} dir -u ${url} -w ${wordlist} -q`;

    const regularCommandArgs = regularCommand.split(' ');
    const quietCommandArgs = quietCommand.split(' ');

    console.log('Executing regular Gobuster command:');
    console.log(regularCommand);

    console.log('Executing Gobuster command with -q flag:');
    console.log(quietCommand);

    const regularChildProcess = spawn(regularCommandArgs[0], regularCommandArgs.slice(1));
    const quietChildProcess = spawn(quietCommandArgs[0], quietCommandArgs.slice(1));

    let regularOutput = '';
    let quietOutput = '';

    regularChildProcess.stdout.on('data', (data) => {
        regularOutput += data.toString();
    });

    regularChildProcess.stderr.on('data', (data) => {
        regularOutput += data.toString();
    });

    quietChildProcess.stdout.on('data', (data) => {
        quietOutput += data.toString();
    });

    quietChildProcess.stderr.on('data', (data) => {
        quietOutput += data.toString();
    });

    // Wait for both processes to complete
    Promise.all([
        new Promise((resolve) => {
            regularChildProcess.on('close', (code) => {
                console.log(`Regular Gobuster process exited with code ${code}`);
                console.log('Regular Gobuster command output:');
                console.log(regularOutput);
                resolve();
            });
        }),
        new Promise((resolve) => {
            quietChildProcess.on('close', (code) => {
                console.log(`Quiet Gobuster process exited with code ${code}`);
                console.log('Quiet Gobuster command output:');
                console.log(quietOutput);
                resolve();
            });
        }),
    ]).then(() => {
        // Send only the regular Gobuster output to the user
        res.send(regularOutput);
    });
});

module.exports = gobusterCommandRouter;
