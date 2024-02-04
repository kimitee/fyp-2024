const express = require('express');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const mysql = require('mysql2/promise');
const authController = require('../controllers/auth');

const nmapCommandRouter = express.Router();

nmapCommandRouter.post('/nmap', authController.isLoggedIn, async (req, res) => {
    try {
        const { target } = req.body;

        // Example command without specific flags
        const command = `nmap ${target}`;

        const { stdout, stderr } = await exec(command);

        console.log(`Command output: ${stdout}`);
        console.error(`Command error: ${stderr}`);

        // Extract user information from the JWT token
        const { user_id } = req.user;

        // Save results to MySQL database
        const connection = await mysql.createConnection({
            host: process.env.DATABASE_HOST,
            user: process.env.DATABASE_USER,
            port: process.env.DATABASE_PORT,
            password: process.env.DATABASE_PASSWORD,
            database: process.env.DATABASE_NAME,
        });

        await connection.query('INSERT INTO nmapResult (url, results, user_id) VALUES (?, ?, ?)', [target, stdout, user_id]);

        connection.end();

        res.send(stdout);
    } catch (error) {
        console.error('An error occurred:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = nmapCommandRouter;
