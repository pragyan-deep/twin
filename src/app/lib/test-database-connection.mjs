import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3000';

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');
  
  try {
    // Test with a simple memory creation that should show connection issues
    const testMemory = {
      content: "Database connection test memory",
      type: "diary",
      visibility: "private",
      mood: "testing",
      tags: ["test", "database"]
    };

    const response = await fetch(`${API_BASE}/api/memories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testMemory),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log('✅ Database connection successful!');
      console.log('✅ Memory created with ID:', result.data.memory.id);
      console.log('✅ Embedding generated with', result.data.embedding.dimensions, 'dimensions');
      return true;
    } else {
      console.log('❌ Database connection failed!');
      console.log('Status:', response.status);
      console.log('Error:', result.error);
      console.log('Message:', result.message);
      
      if (result.error === 'DATABASE_UNAVAILABLE') {
        console.log('\n🛠️  Setup required:');
        console.log('1. Create .env.local file with Supabase credentials');
        console.log('2. Run: supabase db push');
        console.log('3. Make sure Supabase project is running');
      }
      
      return false;
    }
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    console.log('\n🛠️  Check:');
    console.log('1. Is your development server running? (npm run dev)');
    console.log('2. Are environment variables set correctly?');
    console.log('3. Is Supabase project accessible?');
    return false;
  }
}

async function checkEnvironmentVariables() {
  console.log('\n🔧 Checking environment setup...');
  
  // This is a simple check - the actual validation happens in the API
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'OPENAI_API_KEY'
  ];
  
  console.log('Required environment variables:');
  requiredVars.forEach(varName => {
    console.log(`- ${varName}: ${process.env[varName] ? '✅ Set' : '❌ Missing'}`);
  });
  
  if (requiredVars.some(varName => !process.env[varName])) {
    console.log('\n⚠️  Some environment variables are missing.');
    console.log('Create .env.local file with the required variables.');
    return false;
  }
  
  return true;
}

async function runDiagnostics() {
  console.log('🧠 Memory System Database Diagnostics\n');
  
  // Check environment variables
  const envOk = await checkEnvironmentVariables();
  if (!envOk) {
    console.log('\n❌ Environment check failed. Fix environment variables first.');
    return;
  }
  
  // Test database connection
  const dbOk = await testDatabaseConnection();
  if (dbOk) {
    console.log('\n🎉 All systems operational! Your memory system is ready to use.');
  } else {
    console.log('\n❌ Database connection failed. Check the setup instructions.');
  }
}

// Run diagnostics
runDiagnostics().catch(console.error); 