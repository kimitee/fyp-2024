const express = require('express');
const { spawn } = require('child_process');
const path = require('path');

const gobusterCommandRouter = express.Router();

gobusterCommandRouter.post('/gobuster', (req, res) => {
    const { url, wordlist } = req.body;

    // Validate inputs to prevent security issues.

    // Use the absolute path to gobuster
    const gobusterPath = '/home/kimi/go/bin/gobuster'; // Specific path

    // Extract the filename from the wordlist path
    const wordname = path.basename(wordlist);
    console.log("wordlist name:",wordname);

    const command = `${gobusterPath} dir -u ${url} -w ${wordlist}`;

    const commandArgs = command.split(' ');

    
    console.log('Executing Gobuster command:');
    console.log(command);

    const childProcess = spawn(commandArgs[0], commandArgs.slice(1));

    let output = '';

    childProcess.stdout.on('data', (data) => {
        output += data.toString();
    });

    childProcess.stderr.on('data', (data) => {
        output += data.toString();
    });

    childProcess.on('close', (code) => {
        console.log(`Child process exited with code ${code}`);
        console.log('Gobuster command output:');
        console.log(output);
        res.send(output);
    });
});

module.exports = gobusterCommandRouter;
