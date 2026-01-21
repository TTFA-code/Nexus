const { Client } = require('pg');

// Trying the Direct Connection via Project Host (Standard)
// Host: db.rkiplzdlprguefewxcil.supabase.co
// User: postgres (Simple user, routed by subdomain)
// Port: 5432 (Direct)
const connectionString = 'postgresql://postgres:ZSW1DmvmHrJlwfyX@db.rkiplzdlprguefewxcil.supabase.co:5432/postgres';

console.log('Testing connection to:', connectionString.replace(/:[^:]*@/, ':****@'));

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
});

async function testConnection() {
    try {
        console.log('Connecting...');
        await client.connect();
        console.log('✅ Connection Successful!');

        const res = await client.query('SELECT version();');
        console.log('Server Version:', res.rows[0].version);

        await client.end();
    } catch (err) {
        console.error('❌ Connection Failed:', err.stack); // Stack trace hints at network vs auth

        process.exit(1);
    }
}

testConnection();
