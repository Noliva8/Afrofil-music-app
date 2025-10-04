
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🔍 Environment Variables Debug:');
console.log('================================');

// Check if .env file is loaded
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Current directory:', process.cwd());

// List all Redis-related environment variables
const redisVars = Object.keys(process.env).filter(key => 
    key.includes('REDIS') || key.includes('redis')
);

console.log('\n📋 Redis-related environment variables:');
redisVars.forEach(key => {
    if (key.includes('PASSWORD')) {
        console.log(`   ${key}: ${process.env[key] ? '***' + process.env[key].slice(-3) : 'NOT SET'}`);
    } else {
        console.log(`   ${key}: ${process.env[key] || 'NOT SET'}`);
    }
});

// Check specific Redis variables
console.log('\n🔐 Redis Configuration:');
console.log('REDIS_URL:', process.env.REDIS_URL ? 'SET' : 'NOT SET');
console.log('REDIS_PASSWORD:', process.env.REDIS_PASSWORD ? 'SET' : 'NOT SET');

// Try to load from different .env file locations
const envPaths = [
    '.env',
    './.env',
    '../.env',
    '../../.env',
    './server/.env'
];

console.log('\n📁 Trying to load .env from different paths:');
envPaths.forEach(path => {
    try {
        const result = dotenv.config({ path });
        if (result.parsed) {
            console.log(`✅ Loaded from ${path}`);
            console.log('   REDIS_URL:', result.parsed.REDIS_URL ? 'SET' : 'NOT SET');
        } else {
            console.log(`❌ Not found: ${path}`);
        }
    } catch (error) {
        console.log(`❌ Error loading ${path}:`, error.message);
    }
});