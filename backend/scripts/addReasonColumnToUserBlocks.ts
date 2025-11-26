import { sequelize } from '../models';

async function addReasonColumn() {
  try {
    console.log('🔄 Checking user_blocks table...');

    // Check if the reason column exists
    const [results]: any = await sequelize.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'user_blocks'
      AND COLUMN_NAME = 'reason'
    `);

    if (results.length > 0) {
      console.log('✅ reason column already exists');
      process.exit(0);
    }

    console.log('📝 Adding reason column to user_blocks table...');

    // Add the reason column
    await sequelize.query(`
      ALTER TABLE user_blocks
      ADD COLUMN reason VARCHAR(500) NULL
    `);

    console.log('✅ Successfully added reason column to user_blocks table');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addReasonColumn();
