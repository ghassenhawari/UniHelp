const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5433'),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'unihelp',
});

async function test() {
    try {
        console.log('Connecting to:', {
            host: client.host,
            port: client.port,
            user: client.user,
            database: client.database
        });
        await client.connect();
        console.log('Successfully connected to PostgreSQL');
        const res = await client.query('SELECT NOW()');
        console.log('Current time from DB:', res.rows[0]);
        await client.end();
    } catch (err) {
        console.error('Connection error:', err.message);
        process.exit(1);
    }
}

test();
