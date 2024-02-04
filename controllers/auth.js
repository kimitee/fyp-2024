const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { promisify } = require('util');

const pool = mysql.createPool({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    port: process.env.DATABASE_PORT,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    connectionLimit: 10, // Adjust based on your application's needs
});

exports.register = async (req, res) => {
    try {
        const { name, username, password, passwordConfirm } = req.body;

        if (!name || !username || !password || !passwordConfirm) {
            return res.render('register', {
                message: 'Please fill in all fields.'
            });
        }

        const [existingUsers] = await pool.query('SELECT username FROM user WHERE username = ?', [username]);

        if (existingUsers.length > 0) {
            return res.render('register', {
                message: 'The username is already taken!'
            });
        } else if (password !== passwordConfirm) {
            return res.render('register', {
                message: 'Passwords do not match!'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 8);
        console.log(hashedPassword);

        const [insertResult] = await pool.query('INSERT INTO user SET ?', { name, username, password: hashedPassword });

        console.log(insertResult);
        return res.render('register', {
            message: 'User Registered!'
        });
    } catch (error) {
        console.error(error);
        return res.status(500).send('Internal Server Error');
    }
};

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).render('login', {
                message: 'Please provide a username and password'
            });
        }

        const [results] = await pool.query('SELECT * FROM user WHERE username = ?', [username]);

        console.log(results);

        if (!results || results.length === 0 || !(await bcrypt.compare(password, results[0].password))) {
            return res.status(401).render('login', {
                message: 'Username or Password is incorrect'
            });
        } else {
            const user_id = results[0].user_id;

            const token = jwt.sign({ user_id }, process.env.JWT_SECRET, {
                expiresIn: process.env.JWT_EXPIRES_IN
            });

            console.log("The token is: " + token);

            const cookieOptions = {
                expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000),
                httpOnly: true
            };

            res.cookie('jwt', token, cookieOptions);
            res.status(200).redirect("/");
        }

    } catch (error) {
        console.log(error);
        return res.status(500).send('Internal Server Error');
    }
};

exports.isLoggedIn = async (req, res, next) => {
  console.log("is logged in");
  console.log(req.cookies);

  if (!req.cookies.jwt) {
      return next();
  }

  try {
      const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);

      console.log("decoded");
      console.log(decoded);

      const [result] = await pool.query('SELECT * FROM user WHERE user_id = ?', [decoded.user_id]);

      console.log("user exist:");
      console.log(result);

      if (!result || result.length === 0) {
          console.log('User not found in the database.');
          return res.status(401).send('Unauthorized');
      }

      req.user = result[0];
      console.log("user is");
      console.log(req.user);

      // Continue with the next middleware or route
      return next();

  } catch (error) {
      console.log('Error in decoding JWT or querying the database:', error);
      return res.status(401).send('Unauthorized');
  }
};


// exports.logout = async (req, res) => {
//     res.cookie('jwt', 'logout', {
//         expires: new Date(Date.now() + 2 * 1000),
//         httpOnly: true
//     });

//     res.status(200).redirect('/');
// };

exports.logout = async (req, res) => {
  // Clear the jwt cookie
  res.clearCookie('jwt', { httpOnly: true });

  // Redirect to the home page or any desired page after logout
  res.status(200).redirect('/');
};
