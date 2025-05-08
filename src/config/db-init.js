const AppDataSource = require('./database');

async function initializeDatabase() {
  try {
    // First, try to connect without synchronization
    const originalSynchronize = AppDataSource.options.synchronize;
    AppDataSource.options.synchronize = false;
    
    await AppDataSource.initialize();
    console.log("Connected to database");
    
    // Check if we need to drop tables
    // if (process.env.NODE_ENV !== 'production') {
    //   console.log("Development environment detected - preparing database...");
      
    //   // Get query runner to execute raw SQL
    //   const queryRunner = AppDataSource.createQueryRunner();
      
    //   try {
    //     // Start transaction
    //     await queryRunner.startTransaction();
        
    //     // Drop the problematic tables - drop them in the right order
    //     console.log("Dropping existing tables...");
        
    //     // Check if collectors table exists and drop it first
    //     const tablesResult = await queryRunner.query(
    //       `SELECT table_name FROM information_schema.tables 
    //        WHERE table_schema = 'public' AND table_name = 'collectors'`
    //     );
        
    //     if (tablesResult.length > 0) {
    //       console.log("Dropping collectors table...");
    //       await queryRunner.query(`DROP TABLE IF EXISTS "collectors" CASCADE`);
    //     }
        
    //     // Drop other tables
    //     await queryRunner.query(`DROP TABLE IF EXISTS "payments" CASCADE`);
    //     await queryRunner.query(`DROP TABLE IF EXISTS "participants" CASCADE`);
    //     await queryRunner.query(`DROP TABLE IF EXISTS "project_members" CASCADE`);
    //     await queryRunner.query(`DROP TABLE IF EXISTS "trips" CASCADE`);
    //     await queryRunner.query(`DROP TABLE IF EXISTS "projects" CASCADE`);
    //     await queryRunner.query(`DROP TABLE IF EXISTS "users" CASCADE`);
        
    //     // Drop custom types
    //     await queryRunner.query(`DROP TYPE IF EXISTS "project_members_role_enum" CASCADE`);
        
    //     // Commit transaction
    //     await queryRunner.commitTransaction();
    //     console.log("Database tables dropped successfully");
        
    //     // Close the query runner
    //     await queryRunner.release();
        
    //     // Now re-initialize the datasource with synchronize set to true
    //     await AppDataSource.destroy();
    //     AppDataSource.options.synchronize = true;
    //     await AppDataSource.initialize();
    //     console.log("Database synchronized successfully");
        
    //     return true;
    //   } catch (error) {
    //     // If anything fails, roll back
    //     console.error("Error during database initialization:", error);
    //     await queryRunner.rollbackTransaction();
    //     await queryRunner.release();
    //     throw error;
    //   }
    // }
    
    return true;
  } catch (error) {
    console.error("Database initialization error:", error);
    throw error;
  }
}

module.exports = initializeDatabase;
