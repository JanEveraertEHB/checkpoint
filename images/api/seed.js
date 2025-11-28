#!/usr/bin/env node

const knex = require('./src/db/db.js');
const path = require('path');

const seedFiles = [
  '01_test_data.js',
  '02_quick_test.js'
];

async function runSeeds() {
  console.log('🌱 Starting database seeding...\n');
  
  try {
    // Run migrations first to ensure database is up to date
    console.log('📋 Running migrations...');
    await knex.migrate.latest();
    console.log('✅ Migrations completed\n');
    
    // Get available seed files
    const args = process.argv.slice(2);
    const seedToRun = args[0];
    
    if (seedToRun) {
      // Run specific seed file
      const seedFile = seedFiles.find(f => f.includes(seedToRun));
      if (seedFile) {
        console.log(`🎯 Running seed file: ${seedFile}`);
        const seed = require(path.join(__dirname, 'src/db/seeds', seedFile));
        await seed.seed(knex);
      } else {
        console.error(`❌ Seed file '${seedToRun}' not found.`);
        console.log('Available seed files:');
        seedFiles.forEach(file => console.log(`  - ${file}`));
        process.exit(1);
      }
    } else {
      // List available seed files
      console.log('📋 Available seed files:');
      seedFiles.forEach(file => console.log(`  - ${file}`));
      console.log('\nUsage: npm run seed <seed-file>');
      console.log('Example: npm run seed quick');
      console.log('Example: npm run seed test');
    }
    
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  } finally {
    await knex.destroy();
    console.log('\n👋 Database connection closed');
  }
}

// Handle command line arguments
if (require.main === module) {
  runSeeds();
}

module.exports = { runSeeds };