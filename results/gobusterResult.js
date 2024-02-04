const express = require('express');
const mysql = require('mysql2/promise');
const authController = require('../controllers/auth');

const gobusterRouter = express.Router();

gobusterRouter.get('/gobusterResult', authController.isLoggedIn, async (req, res) => {
    try {
        // Extract user information from the JWT token
        const { user_id } = req.user;
        console.log('User ID Gobuster results:', user_id);

        // Fetch results from MySQL database for the logged-in user
        const connection = await mysql.createConnection({
            host: process.env.DATABASE_HOST,
            user: process.env.DATABASE_USER,
            port: process.env.DATABASE_PORT,
            password: process.env.DATABASE_PASSWORD,
            database: process.env.DATABASE_NAME,
        });

        const [gobusterResults] = await connection.query('SELECT result_id, url, wordlist, results FROM gobusterResult WHERE user_id = ?', [user_id]);
        console.log('Fetched Gobuster Results:', gobusterResults);

        connection.end();

        // Render the gobusterResult.hbs file using Handlebars with the fetched results, req, and user objects
        res.render('gobusterResult', { gobusterResults, req, user: req.user });
    } catch (error) {
        console.error('An error occurred:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = gobusterRouter;
