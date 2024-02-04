const express = require('express');
const mysql = require('mysql2/promise');
const authController = require('../controllers/auth');

const nmapCommandRouter = express.Router();

nmapCommandRouter.get('/nmapResult', authController.isLoggedIn, async (req, res) => {
    try {
        // Extract user information from the JWT token
        const { user_id } = req.user;
        console.log('User ID nmap results:', user_id);

        // Fetch results from MySQL database for the logged-in user
        const connection = await mysql.createConnection({
            host: process.env.DATABASE_HOST,
            user: process.env.DATABASE_USER,
            port: process.env.DATABASE_PORT,
            password: process.env.DATABASE_PASSWORD,
            database: process.env.DATABASE_NAME,
        });

        const [nmapResults] = await connection.query('SELECT * FROM nmapResult WHERE user_id = ?', [user_id]);
        console.log('Fetched Results:', nmapResults);

        connection.end();

        // Render the nmapResult.hbs file using Handlebars with the fetched results
        res.render('nmapResult', { nmapResults, req, user: req.user });
    } catch (error) {
        console.error('An error occurred:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = nmapCommandRouter;