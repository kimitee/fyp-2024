// gobuster.js
const authController = require('../controllers/auth');
const express = require('express');
const { spawnSync } = require('child_process');
const path = require('path');
const mysql = require('mysql2/promise');

const gobusterRouter = express.Router();

gobusterRouter.post('/gobuster', authController.isLoggedIn, async (req, res) => {
    try {
        const { url, wordlist } = req.body;
        const gobusterPath = '/home/kimi/go/bin/gobuster';
        const wordname = path.basename(wordlist);

        const command = `${gobusterPath} dir -u ${url} -w ${wordlist}`;
        const commandArgs = command.split(' ');

        console.log('Executing Gobuster command:');
        console.log(command);

        const { stdout, stderr } = spawnSync(commandArgs[0], commandArgs.slice(1));

        console.log('Gobuster command output:');
        console.log(stdout);

        if (stderr) {
            console.error('Gobuster command error:');
            console.error(stderr);
        }

        // Extract user information from the JWT token
        const { user_id } = req.user; // Assuming you have a middleware that sets req.user

        // Save results to MySQL database
        const connection = await mysql.createConnection({
            host: process.env.DATABASE_HOST,
            user: process.env.DATABASE_USER,
            port: process.env.DATABASE_PORT,
            password: process.env.DATABASE_PASSWORD,
            database: process.env.DATABASE_NAME,
        });

        await connection.query('INSERT INTO gobusterResult (url, wordlist, results, user_id) VALUES (?, ?, ?, ?)', [url, wordname, stdout, user_id]);

        connection.end();

        res.send(stdout);
    } catch (error) {
        console.error('An error occurred:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = gobusterRouter;
