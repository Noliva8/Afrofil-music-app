
import redis from 'redis';

async function testRedisAuth() {
  console.log('🧪 Testing Redis authentication...');
  
  const client = redis.createClient({
    url: process.env.REDIS_URL || 'redis://redis-17576.c1.us-west-2-2.ec2.redns.redis-cloud.com:17576',
    password: process.env.REDIS_PASSWORD,
    socket: {
      reconnectStrategy: (retries) => {
        console.log(`Redis reconnecting attempt ${retries}`);
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
      console.log('Connecting to Redis...');
    });

    client.on('ready', () => {
      console.log('Redis Client Ready');
    });

    await client.connect();
    
    // Test authentication
    const pingResult = await client.ping();
    console.log('✅ Ping successful:', pingResult);
    
    // Test basic operations
    await client.set('test_key', 'Hello Redis!');
    const value = await client.get('test_key');
    console.log('✅ Set/Get test:', value);
    
    await client.quit();
    console.log('✅ All authentication tests passed!');
    
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    
    // Provide specific troubleshooting based on error
    if (error.message.includes('NOAUTH') || error.message.includes('Authentication')) {
      console.log('\n🔧 AUTHENTICATION ISSUE DETECTED');
      console.log('REDIS_URL:', process.env.REDIS_URL ? '***' : 'NOT SET');
      console.log('REDIS_PASSWORD:', process.env.REDIS_PASSWORD ? '***' : 'NOT SET');
      
      console.log('\n💡 Possible solutions:');
      console.log('1. Check if REDIS_PASSWORD is set in your .env file');
      console.log('2. Try including the password in the REDIS_URL: redis://:password@host:port');
      console.log('3. Verify the password with your Redis Cloud provider');
    }
  }
}

testRedisAuth();