
import redis from 'redis';

async function testRedisAuth() {
  
  const client = redis.createClient({
    url: process.env.REDIS_URL || 'redis://redis-17576.c1.us-west-2-2.ec2.redns.redis-cloud.com:17576',
    password: process.env.REDIS_PASSWORD,
    socket: {
      reconnectStrategy: (retries) => {
        return Math.min(retries * 100, 3000);
      },
      connectTimeout: 10000,
    },
  });

  try {
    client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    client.on('connect', () => {
    });

    client.on('ready', () => {
    });

    await client.connect();
    
    // Test authentication
    const pingResult = await client.ping();
    
    // Test basic operations
    await client.set('test_key', 'Hello Redis!');
    const value = await client.get('test_key');
    
    await client.quit();
    
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    
    // Provide specific troubleshooting based on error
    if (error.message.includes('NOAUTH') || error.message.includes('Authentication')) {
      
    }
  }
}

testRedisAuth();