const express = require("express");
const path = require("path");
const mysql = require('mysql2/promise');
const dotenv = require("dotenv");
const cookieParser = require('cookie-parser');
const fs = require('fs').promises;

const exphbs = require('express-handlebars').create({
    defaultLayout: 'main',
    extname: '.hbs',
    helpers: {
        eq: function (a, b) {
            return a === b;
        }
    }
});

dotenv.config({ path: './.env'});

const app = express();

// //Database Connection
// const db = mysql.createConnection({
//     host: process.env.DATABASE_HOST,
//     user: process.env.DATABASE_USER,   
//     port: process.env.DATABASE_PORT,
//     password: process.env.DATABASE_PASSWORD,
//     database: process.env.DATABASE_NAME
// });

// //Check Database Connection
// db.connect( (error) => {
//     if(error) {
//         console.log(error)
//     } else {
//         console.log("MySQL Connected...")
//     }
// });

//Database Connection
const pool = mysql.createPool({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    port: process.env.DATABASE_PORT,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    connectionLimit: 10, // Adjust based on your application's needs
});

// Check Database Connection
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to database:', err);
    } else {
        console.log('MySQL Connected...');
        connection.release(); // Release the connection back to the pool
    }
});


// // Define the route to fetch the list of wordlist files
// app.get('/wordlists', async (req, res) => {
//     try {
//         // Read the list of wordlist files from the root/wordlists folder
//         const files = await fs.readdir('./wordlists');

//          // Filter the list to include only .txt files
//          const txtFiles = files.filter(file => path.extname(file) === '.txt');

//         // Dynamically determine the full path for each wordlist file
//         const fullPaths = files.map(file => path.join(process.cwd(), 'wordlists', file));

//         // Send the list of full paths to the client
//         res.json(fullPaths);
//     } catch (error) {
//         console.error('Error reading wordlists:', error);
//         res.status(500).send('Error reading wordlists.');
//     }
// });

// Define the route to fetch the list of wordlist files
app.get('/wordlists', async (req, res) => {
    try {
        // Read the list of wordlist files from the root/wordlists folder
        const files = await fs.readdir('./wordlists');

        // Filter the list to include only .txt files
        const txtFiles = files.filter(file => {
            const isTxtFile = path.extname(file) === '.txt';
            if (!isTxtFile) {
                console.log(`Excluding non-txt file: ${file}`);
            }
            return isTxtFile;
        });

        // Dynamically determine the full path for each .txt file
        const fullPaths = txtFiles.map(file => path.join(process.cwd(), 'wordlists', file));

        // Send the list of full paths to the client
        res.json(fullPaths);
    } catch (error) {
        console.error('Error reading wordlists:', error);
        res.status(500).send('Error reading wordlists.');
    }
});

//Directory
const publicDirectory = path.join(__dirname, './public')
console.log(__dirname, '= dirname');
app.use(express.static(publicDirectory));

//Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded({ extended: false}));
//Parse JSON bodies (as sent by API clients)
app.use(express.json());
app.use(cookieParser());

app.set('view engine', 'hbs')
app.engine('hbs', exphbs.engine);

//Use routes instead
/* app.get("/", (req, res) => {
    //res.send("<h1> Home Page </h1>")
    //render index.hbs
    res.render("index")
}); */

//Define Routes
app.use('/', require('./routes/pages'));
app.use('/auth', require('./routes/auth'));
//Additional Routes
app.use('/execute', require('./execute/executeCommand'));
app.use('/execute', require('./execute/gobuster'));
app.use('/execute', require('./execute/nmap'));
app.use('/results', require('./results/nmapResult'));
app.use('/results', require('./results/gobusterResult'));

//Server running
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});