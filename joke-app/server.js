const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.static('public')); 
app.use(express.json());

//connect to sql database
const pool = mysql.createPool({
    host: 'db',
    user: 'root',
    password: 'DistSystemsPassword',
    database: 'joke_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

//find joke categories from db
app.get('/types', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT name FROM types');
        res.json(rows);
    } catch (error) {
        console.error("Error fetching types:", error);
        res.status(500).json({ error: 'Database connection failed' });
    }
});

//from selected category, find jokes from db
app.get('/joke/:type', async (req, res) => {
    const jokeType = req.params.type;
    //find out how many jokes to return, 1 if not specified
    const count = req.query.count ? parseInt(req.query.count) : 1; 

    try {
        //Join jokes and types tables by id
        let query = `
            SELECT j.setup, j.punchline, t.name as type 
            FROM jokes j 
            JOIN types t ON j.type_id = t.id
        `;
        let params = [];

        //filter by the category chosen
        if (jokeType !== 'any') {
            query += ` WHERE t.name = ?`;
            params.push(jokeType);
        }

        //Order randomly
        query += ` ORDER BY RAND() LIMIT ?`;
        params.push(count);

        const [rows] = await pool.query(query, params);
        
        //empty
        if (rows.length === 0) {
            return res.status(404).json({ message: "No jokes found for this type" });
        }

        //Return a single object if count is 1, othrwise return the array
        res.json(count === 1 ? rows[0] : rows);

    } catch (error) {
        console.error("Error fetching joke:", error);
        res.status(500).json({ error: 'Database connection failed' });
    }
});

app.listen(port, () => {
    console.log(`Joke App connected and listening at http://localhost:${port}`);
});