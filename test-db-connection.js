const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:YY2i%23@localhost:5432/gamehub?schema=public'
});

client.connect()
    .then(() => {
        console.log('Connected to the database successfully!');
        return client.end();
    })
    .catch(err => {
        console.error('Connection error', err.stack);
    });