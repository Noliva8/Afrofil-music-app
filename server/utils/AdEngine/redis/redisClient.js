





// -------------------------

import redis from 'redis';

// Singleton Redis client instance
let redisClient = null;
let isConnecting = false;
let connectionPromise = null;

// Create Redis client with correct configuration
function createRedisClient() {
    // Use the correct URL format from your environment
    const redisUrl = process.env.REDIS_URL || 
        'redis://default:0mdu56G71eupxCZOzpMQYSRVVm6PFy2v@redis-17576.c1.us-west-2-2.ec2.redns.redis-cloud.com:17576';

    // console.log('🔧 Redis Configuration:');
    // console.log(' - URL:', redisUrl.replace(/:([^@]+)@/, ':***@'));
    
    return redis.createClient({
        url: redisUrl,
        socket: {
            reconnectStrategy: (retries) => {
                console.log(`Redis reconnecting attempt ${retries}`);
                return Math.min(retries * 100, 3000);
            },
            connectTimeout: 15000,
        },
    });
}
// Enhanced initialization with better error handling
export async function initializeRedis() {
    if (redisClient && redisClient.isOpen) {
        return redisClient;
    }

    if (isConnecting && connectionPromise) {
        return connectionPromise;
    }

    isConnecting = true;
    connectionPromise = (async () => {
        try {
            redisClient = createRedisClient();

            // Enhanced event handlers
            redisClient.on('error', (err) => {
                console.error('❌ Redis Client Error:', err.message);
                if (err.message.includes('NOAUTH')) {
                    console.error('💡 Authentication required. Check REDIS_PASSWORD environment variable.');
                }
            });

            redisClient.on('connect', () => {
                console.log('🔌 Connecting to Redis...');
            });

            redisClient.on('ready', () => {
                console.log('✅ Redis Client Ready');
            });

            redisClient.on('end', () => {
                console.log('🔴 Redis connection closed');
                isConnecting = false;
                connectionPromise = null;
            });

            redisClient.on('reconnecting', () => {
                console.log('🔄 Redis reconnecting...');
            });

            console.log('🚀 Attempting Redis connection...');
            await redisClient.connect();
            
            // Test connection immediately
            const pingResult = await redisClient.ping();
            console.log('✅ Connected to Redis successfully! Ping:', pingResult);
            
            isConnecting = false;
            return redisClient;
        } catch (error) {
            console.error('💥 Failed to connect to Redis:', error.message);
            
            // // Provide detailed error information
            // if (error.message.includes('NOAUTH')) {
            //     console.log('\n🔐 AUTHENTICATION TROUBLESHOOTING:');
            //     console.log('1. Check if REDIS_PASSWORD is set in your .env file');
            //     console.log('2. Verify the password matches your Redis Cloud dashboard');
            //     console.log('3. Try the format: redis://:password@host:port');
            //     console.log('4. Ensure your Redis Cloud subscription is active');
            // } else if (error.message.includes('ECONNREFUSED')) {
            //     console.log('\n🌐 CONNECTION TROUBLESHOOTING:');
            //     console.log('1. Check if the Redis Cloud instance is running');
            //     console.log('2. Verify the host/port in REDIS_URL');
            //     console.log('3. Check your network/firewall settings');
            // } else if (error.message.includes('ENOTFOUND')) {
            //     console.log('\n🔍 DNS TROUBLESHOOTING:');
            //     console.log('1. The Redis host cannot be found');
            //     console.log('2. Check the hostname in REDIS_URL');
            //     console.log('3. Verify DNS resolution');
            // }
            
            redisClient = null;
            isConnecting = false;
            connectionPromise = null;
            throw error;
        }
    })();

    return connectionPromise;
}

// Get Redis client instance with retry logic
export async function getRedis(maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            if (!redisClient || !redisClient.isOpen) {
                console.log(`🔄 Redis connection attempt ${attempt}/${maxRetries}`);
                return await initializeRedis();
            }
            
            // Test connection
            await redisClient.ping();
            return redisClient;
        } catch (error) {
            console.error(`❌ Redis connection attempt ${attempt} failed:`, error.message);
            
            if (attempt === maxRetries) {
                throw new Error(`Failed to connect to Redis after ${maxRetries} attempts: ${error.message}`);
            }
            
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
    }
}






// Enhanced health check
export async function checkRedisHealth() {
    try {
        const client = await getRedis();
        const startTime = Date.now();
        await client.ping();
        const responseTime = Date.now() - startTime;
        
        console.log(`✅ Redis health check passed (${responseTime}ms)`);
        return { healthy: true, responseTime };
    } catch (error) {
        console.error('❌ Redis health check failed:', error.message);
        return { healthy: false, error: error.message };
    }
}

// ... rest of your functions remain the same
// Graceful shutdown
export async function closeRedis() {
    if (redisClient) {
        await redisClient.quit();
        console.log('Redis connection closed gracefully');
        redisClient = null;
        isConnecting = false;
        connectionPromise = null;
    }
}

// Debug utilities
export async function debugRedisKeys(pattern = '*') {
    const client = await getRedis();
    try {
        const keys = await client.keys(pattern);
        // console.log('Redis keys matching pattern:', pattern);
        
        const results = [];
        for (const key of keys.slice(0, 20)) {
            const type = await client.type(key);
            const result = { key, type };
            
            if (type === 'hash') {
                result.values = await client.hGetAll(key);
            } else if (type === 'string') {
                result.value = await client.get(key);
            } else if (type === 'set') {
                result.members = await client.sMembers(key);
            } else if (type === 'zset') {
                result.members = await client.zRange(key, 0, -1);
            } else if (type === 'list') {
                result.length = await client.lLen(key);
                result.firstFew = await client.lRange(key, 0, 4);
            }
            
            results.push(result);
        }
        
        return results;
    } catch (error) {
        console.error('Debug error:', error);
        throw error;
    }
}

// Test data population
export async function populateTestData() {
    const client = await getRedis();
    
    // Sample user data
    await client.hSet('user:u1', {
        role: 'premium',
        country: 'US',
        state: 'CA',
        city: 'San Francisco',
        lat: '37.7749',
        lon: '-122.4194',
        age: '30',
        updatedAt: Date.now().toString()
    });
    
    // Sample session data
    await client.hSet('session:sess_abc', {
        userId: 'u1',
        device: 'iPhone',
        role: 'listener',
        country: 'US',
        city: 'San Francisco',
        lastEventTs: Date.now().toString(),
        songsPlayed: '5',
        songsFinished: '3',
        songsSkipped: '2',
        ms_listened: '150000'
    });
    
    // Set TTL
    await client.expire('session:sess_abc', 48 * 3600);
    
    console.log('Test data populated successfully');
}