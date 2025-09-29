import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_PROJECT_URL;
const supabaseKey = process.env.SUPABASE_API_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTables() {
  try {
    console.log('Testing if tables exist...');
    
    // Try to query each table to see if it exists
    const tables = ['api_keys', 'api_usage', 'processed_filings', 'rate_limits', 'users'];
    
    for (const tableName of tables) {
      try {
        const { data, error } = await supabase.from(tableName).select('*').limit(1);
        if (error) {
          console.log(`❌ Table ${tableName} does not exist:`, error.message);
        } else {
          console.log(`✅ Table ${tableName} exists`);
        }
      } catch (err) {
        console.log(`❌ Table ${tableName} does not exist:`, err.message);
      }
    }
    
  } catch (err) {
    console.error('❌ Error testing tables:', err);
  }
}

testTables();

