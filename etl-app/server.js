const express = require('express');
const mysql = require('mysql2/promise');
const amqp = require('amqplib');

const app = express();
const port = 3001; //separate port from joke-app

//Database connection
const pool = mysql.createPool({
    host: 'db', //the docker db container
    user: 'root',
    password: 'DistSystemsPassword',
    database: 'joke_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

//rabbit mq connection
//environment variable so you to pass the vm-2 IP address dynamically
const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://localhost';
const queueName = 'joke_queue';

async function connectQueue() {
    try {
        const connection = await amqp.connect(rabbitUrl);
        const channel = await connection.createChannel();
        
        //finds if queue exists and survives restarts (durable)
        await channel.assertQueue(queueName, { durable: true });
        console.log(`ETL waiting for messages in ${queueName}...`);

        //consume messages
        channel.consume(queueName, async (msg) => {
            if (msg !== null) {
                try {
                    const jokeData = JSON.parse(msg.content.toString());
                    const { setup, punchline, type } = jokeData;

                    console.log(`Received joke: ${setup}`);

                    //no duplicate types
                    await pool.query('INSERT IGNORE INTO types (name) VALUES (?)', [type]);

                    //get the ID of the type
                    const [typeRows] = await pool.query('SELECT id FROM types WHERE name = ?', [type]);
                    
                    if (typeRows.length > 0) {
                        const typeId = typeRows[0].id;

                        //insert the joke
                        await pool.query(
                            'INSERT INTO jokes (type_id, setup, punchline) VALUES (?, ?, ?)',
                            [typeId, setup, punchline]
                        );

                        //acknowledge to delete from queue
                        channel.ack(msg);
                        console.log("Message processed and acknowledged.");
                    } else {
                        throw new Error("Failed to retrieve type ID");
                    }

                } catch (error) {
                    console.error("Error processing message:", error);
                    //do not ack the message if it fails
                }
            }
        });
    } catch (error) {
        console.error("RabbitMQ connection failed, retrying...", error);
        //retry if RabbitMQ on VM 2 wasnt up yet
        setTimeout(connectQueue, 5000);
    }
}

//start the connection
connectQueue();

// /alive endpoint to check if ETL is up
app.get('/alive', (req, res) => {
    res.status(200).json({ status: 'ETL Service running' });
});

app.listen(port, () => {
    console.log(`ETL App listening on Port ${port}`);
});