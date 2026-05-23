
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();


// Check if .env file is loaded

// List all Redis-related environment variables
const redisVars = Object.keys(process.env).filter(key => 
    key.includes('REDIS') || key.includes('redis')
);

redisVars.forEach(key => {
    if (key.includes('PASSWORD')) {
    } else {
    }
});

// Check specific Redis variables

// Try to load from different .env file locations
const envPaths = [
    '.env',
    './.env',
    '../.env',
    '../../.env',
    './server/.env'
];

envPaths.forEach(path => {
    try {
        const result = dotenv.config({ path });
        if (result.parsed) {
        } else {
        }
    } catch (error) {
    }
});