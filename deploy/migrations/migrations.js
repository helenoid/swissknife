/**
 * Database Migration System
 * 
 * This module provides automated database migration capabilities for the SwissKnife application,
 * supporting schema versioning, migration execution, and rollback functionality.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  // Migration directories
  migrationsDir: path.join(__dirname, 'migrations'),
  schemaVersionFile: path.join(__dirname, 'schema_version.json'),
  
  // Database configuration - in production these would be environment variables
  database: {
    type: process.env.DB_TYPE || 'sqlite', // sqlite, mysql, postgres
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || '3306',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'swissknife',
    filename: process.env.DB_FILENAME || path.join(__dirname, 'swissknife.db')
  },
  
  // Migration settings
  transactional: true, // Run migrations in transactions when possible
  lockTimeout: 60, // Lock timeout in seconds
  dryRun: false // Simulate migrations without applying
};

// Ensure migrations directory exists
if (!fs.existsSync(CONFIG.migrationsDir)) {
  fs.mkdirSync(CONFIG.migrationsDir, { recursive: true });
}

/**
 * Database connection abstractions for different database types
 */
const dbConnectors = {
  sqlite: {
    connect: async () => {
      try {
        const sqlite3 = require('sqlite3').verbose();
        
        return new Promise((resolve, reject) => {
          const db = new sqlite3.Database(CONFIG.database.filename, (err) => {
            if (err) {
              reject(err);
            } else {
              console.log(`Connected to SQLite database: ${CONFIG.database.filename}`);
              resolve(db);
            }
          });
        });
      } catch (error) {
        console.error('Error connecting to SQLite database:', error);
        throw error;
      }
    },
    
    disconnect: async (connection) => {
      return new Promise((resolve, reject) => {
        connection.close((err) => {
          if (err) {
            reject(err);
          } else {
            console.log('Disconnected from SQLite database');
            resolve();
          }
        });
      });
    },
    
    query: async (connection, sql, params = []) => {
      return new Promise((resolve, reject) => {
        connection.all(sql, params, (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        });
      });
    },
    
    execute: async (connection, sql, params = []) => {
      return new Promise((resolve, reject) => {
        connection.run(sql, params, function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ changes: this.changes, lastID: this.lastID });
          }
        });
      });
    },
    
    beginTransaction: async (connection) => {
      return connection.execute('BEGIN TRANSACTION');
    },
    
    commitTransaction: async (connection) => {
      return connection.execute('COMMIT');
    },
    
    rollbackTransaction: async (connection) => {
      return connection.execute('ROLLBACK');
    },
    
    initMigrationTable: async (connection) => {
      return connection.execute(`
        CREATE TABLE IF NOT EXISTS migrations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          version TEXT NOT NULL,
          name TEXT NOT NULL,
          applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          success BOOLEAN NOT NULL,
          error_message TEXT
        )
      `);
    }
  },
  
  mysql: {
    connect: async () => {
      // This would be a MySQL implementation in a real system
      console.log('MySQL connector not implemented in this demo');
      throw new Error('MySQL connector not implemented');
    },
    
    disconnect: async (connection) => {
      console.log('MySQL disconnect not implemented in this demo');
    }
    
    // Other methods would be implemented similarly
  },
  
  postgres: {
    connect: async () => {
      // This would be a PostgreSQL implementation in a real system
      console.log('PostgreSQL connector not implemented in this demo');
      throw new Error('PostgreSQL connector not implemented');
    },
    
    disconnect: async (connection) => {
      console.log('PostgreSQL disconnect not implemented in this demo');
    }
    
    // Other methods would be implemented similarly
  }
};

/**
 * Mock database operations for demo purposes
 */
const mockDatabase = {
  connect: async () => {
    console.log('[MOCK] Connected to database');
    return { mock: true };
  },
  
  disconnect: async (connection) => {
    console.log('[MOCK] Disconnected from database');
  },
  
  query: async (connection, sql, params = []) => {
    console.log(`[MOCK] Query: ${sql}`);
    console.log(`[MOCK] Params: ${JSON.stringify(params)}`);
    
    // Mock different queries
    if (sql.includes('SELECT * FROM migrations')) {
      return [
        { 
          id: 1, 
          version: '1.0.0', 
          name: 'create_initial_tables', 
          applied_at: new Date().toISOString(),
          success: true
        }
      ];
    }
    
    return [];
  },
  
  execute: async (connection, sql, params = []) => {
    console.log(`[MOCK] Execute: ${sql}`);
    console.log(`[MOCK] Params: ${JSON.stringify(params)}`);
    return { changes: 1, lastID: 1 };
  },
  
  beginTransaction: async (connection) => {
    console.log('[MOCK] Begin transaction');
  },
  
  commitTransaction: async (connection) => {
    console.log('[MOCK] Commit transaction');
  },
  
  rollbackTransaction: async (connection) => {
    console.log('[MOCK] Rollback transaction');
  },
  
  initMigrationTable: async (connection) => {
    console.log('[MOCK] Initialize migration table');
  }
};

/**
 * Get the appropriate database connector
 * @returns {Object} Database connector
 */
function getDatabaseConnector() {
  const dbType = CONFIG.database.type;
  
  // For testing purposes, allow using mock database
  if (dbType === 'mock' || process.env.MOCK_DB === 'true') {
    return mockDatabase;
  }
  
  // Get the appropriate connector
  const connector = dbConnectors[dbType];
  if (!connector) {
    throw new Error(`Unsupported database type: ${dbType}`);
  }
  
  return connector;
}

/**
 * Get the current schema version
 * @returns {Object} Schema version info
 */
function getCurrentSchemaVersion() {
  try {
    if (fs.existsSync(CONFIG.schemaVersionFile)) {
      return JSON.parse(fs.readFileSync(CONFIG.schemaVersionFile, 'utf8'));
    }
  } catch (error) {
    console.error('Error reading schema version file:', error);
  }
  
  // Default initial version
  return {
    version: '0.0.0',
    lastMigration: null,
    migrationsApplied: 0,
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Save schema version
 * @param {Object} versionInfo - Schema version info
 */
function saveSchemaVersion(versionInfo) {
  try {
    fs.writeFileSync(
      CONFIG.schemaVersionFile,
      JSON.stringify(versionInfo, null, 2)
    );
    console.log(`Schema version updated to ${versionInfo.version}`);
  } catch (error) {
    console.error('Error saving schema version:', error);
  }
}

/**
 * Get migration file info
 * @param {string} filename - Migration filename
 * @returns {Object|null} Migration info or null if invalid
 */
function parseMigrationFilename(filename) {
  // Expected format: V1.0.0__migration_name.sql
  const match = filename.match(/^V(\d+\.\d+\.\d+)__(.+)\.sql$/);
  if (!match) {
    return null;
  }
  
  return {
    version: match[1],
    name: match[2].replace(/_/g, ' ')
  };
}

/**
 * Compare schema versions
 * @param {string} version1 - First version
 * @param {string} version2 - Second version
 * @returns {number} -1 if version1 < version2, 0 if equal, 1 if version1 > version2
 */
function compareVersions(version1, version2) {
  const v1Parts = version1.split('.').map(Number);
  const v2Parts = version2.split('.').map(Number);
  
  for (let i = 0; i < 3; i++) {
    if (v1Parts[i] < v2Parts[i]) return -1;
    if (v1Parts[i] > v2Parts[i]) return 1;
  }
  
  return 0;
}

/**
 * Get all migration files
 * @returns {Array} Array of migration file info
 */
function getMigrationFiles() {
  try {
    const files = fs.readdirSync(CONFIG.migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .map(file => {
        const info = parseMigrationFilename(file);
        if (info) {
          return {
            ...info,
            filename: file,
            path: path.join(CONFIG.migrationsDir, file)
          };
        }
        return null;
      })
      .filter(Boolean);
    
    // Sort by version
    return files.sort((a, b) => compareVersions(a.version, b.version));
  } catch (error) {
    console.error('Error getting migration files:', error);
    return [];
  }
}

/**
 * Get migrations to apply
 * @param {string} currentVersion - Current schema version
 * @returns {Array} Array of migrations to apply
 */
function getMigrationsToApply(currentVersion) {
  const allMigrations = getMigrationFiles();
  
  // Filter migrations with version greater than current version
  return allMigrations.filter(migration => 
    compareVersions(migration.version, currentVersion) > 0
  );
}

/**
 * Get applied migrations from database
 * @param {Object} db - Database connection
 * @returns {Promise<Array>} Array of applied migrations
 */
async function getAppliedMigrations(db) {
  try {
    const connector = getDatabaseConnector();
    const migrations = await connector.query(
      db,
      'SELECT * FROM migrations ORDER BY id'
    );
    return migrations;
  } catch (error) {
    console.error('Error getting applied migrations:', error);
    return [];
  }
}

/**
 * Execute a migration
 * @param {Object} db - Database connection 
 * @param {Object} migration - Migration info
 * @param {boolean} dryRun - Whether to simulate the migration
 * @returns {Promise<boolean>} Success status
 */
async function executeMigration(db, migration, dryRun = false) {
  console.log(`Applying migration: ${migration.version} - ${migration.name}`);
  
  const connector = getDatabaseConnector();
  let transactionStarted = false;
  
  try {
    // Read migration SQL
    const sql = fs.readFileSync(migration.path, 'utf8');
    
    if (dryRun) {
      console.log('[DRY RUN] Would execute:');
      console.log(sql);
      return true;
    }
    
    // Start transaction if enabled
    if (CONFIG.transactional) {
      await connector.beginTransaction(db);
      transactionStarted = true;
    }
    
    // Execute migration
    const result = await connector.execute(db, sql);
    
    // Record migration
    await connector.execute(
      db,
      'INSERT INTO migrations (version, name, success) VALUES (?, ?, ?)',
      [migration.version, migration.name, true]
    );
    
    // Commit transaction
    if (transactionStarted) {
      await connector.commitTransaction(db);
    }
    
    console.log(`Migration ${migration.version} applied successfully`);
    return true;
  } catch (error) {
    console.error(`Error applying migration ${migration.version}:`, error);
    
    // Rollback transaction
    if (transactionStarted) {
      try {
        await connector.rollbackTransaction(db);
      } catch (rollbackError) {
        console.error('Error rolling back transaction:', rollbackError);
      }
    }
    
    // Record failed migration
    try {
      await connector.execute(
        db,
        'INSERT INTO migrations (version, name, success, error_message) VALUES (?, ?, ?, ?)',
        [migration.version, migration.name, false, error.message]
      );
    } catch (recordError) {
      console.error('Error recording failed migration:', recordError);
    }
    
    return false;
  }
}

/**
 * Roll back a migration
 * @param {Object} db - Database connection
 * @param {Object} migration - Migration info
 * @param {boolean} dryRun - Whether to simulate the rollback
 * @returns {Promise<boolean>} Success status
 */
async function rollbackMigration(db, migration, dryRun = false) {
  console.log(`Rolling back migration: ${migration.version} - ${migration.name}`);
  
  const connector = getDatabaseConnector();
  let transactionStarted = false;
  
  try {
    // Look for rollback file
    const rollbackPath = migration.path.replace('.sql', '.rollback.sql');
    if (!fs.existsSync(rollbackPath)) {
      console.error(`Rollback file not found: ${rollbackPath}`);
      return false;
    }
    
    // Read rollback SQL
    const sql = fs.readFileSync(rollbackPath, 'utf8');
    
    if (dryRun) {
      console.log('[DRY RUN] Would execute rollback:');
      console.log(sql);
      return true;
    }
    
    // Start transaction if enabled
    if (CONFIG.transactional) {
      await connector.beginTransaction(db);
      transactionStarted = true;
    }
    
    // Execute rollback
    const result = await connector.execute(db, sql);
    
    // Update migration record
    await connector.execute(
      db,
      'UPDATE migrations SET success = ?, error_message = ? WHERE version = ?',
      [false, 'Rolled back', migration.version]
    );
    
    // Commit transaction
    if (transactionStarted) {
      await connector.commitTransaction(db);
    }
    
    console.log(`Migration ${migration.version} rolled back successfully`);
    return true;
  } catch (error) {
    console.error(`Error rolling back migration ${migration.version}:`, error);
    
    // Rollback transaction
    if (transactionStarted) {
      try {
        await connector.rollbackTransaction(db);
      } catch (rollbackError) {
        console.error('Error rolling back transaction:', rollbackError);
      }
    }
    
    return false;
  }
}

/**
 * Create a new migration file
 * @param {string} version - Migration version
 * @param {string} name - Migration name
 * @returns {Promise<boolean>} Success status
 */
async function createMigration(version, name) {
  try {
    // Format name for filename
    const formattedName = name.toLowerCase().replace(/\s+/g, '_');
    const filename = `V${version}__${formattedName}.sql`;
    const rollbackFilename = `V${version}__${formattedName}.rollback.sql`;
    
    const filePath = path.join(CONFIG.migrationsDir, filename);
    const rollbackPath = path.join(CONFIG.migrationsDir, rollbackFilename);
    
    // Check if file already exists
    if (fs.existsSync(filePath)) {
      console.error(`Migration file already exists: ${filePath}`);
      return false;
    }
    
    // Create migration file
    fs.writeFileSync(filePath, `-- Migration: ${name} (${version})
-- Created: ${new Date().toISOString()}

-- Write your migration SQL here

`);
    
    // Create rollback file
    fs.writeFileSync(rollbackPath, `-- Rollback for migration: ${name} (${version})
-- Created: ${new Date().toISOString()}

-- Write your rollback SQL here

`);
    
    console.log(`Migration files created:`);
    console.log(`- ${filePath}`);
    console.log(`- ${rollbackPath}`);
    
    return true;
  } catch (error) {
    console.error('Error creating migration files:', error);
    return false;
  }
}

/**
 * Run migrations
 * @param {Object} options - Migration options
 * @returns {Promise<boolean>} Success status
 */
async function runMigrations(options = {}) {
  const {
    targetVersion = null,
    dryRun = CONFIG.dryRun
  } = options;
  
  console.log(`Running migrations${dryRun ? ' (DRY RUN)' : ''}...`);
  
  let db = null;
  
  try {
    // Get current schema version
    const currentSchema = getCurrentSchemaVersion();
    console.log(`Current schema version: ${currentSchema.version}`);
    
    // Get database connector
    const connector = getDatabaseConnector();
    
    // Connect to database
    db = await connector.connect();
    
    // Initialize migration table
    await connector.initMigrationTable(db);
    
    // Get migrations to apply
    const migrationsToApply = getMigrationsToApply(currentSchema.version);
    
    // Filter by target version if specified
    const filteredMigrations = targetVersion
      ? migrationsToApply.filter(m => compareVersions(m.version, targetVersion) <= 0)
      : migrationsToApply;
    
    if (filteredMigrations.length === 0) {
      console.log('No migrations to apply');
      return true;
    }
    
    console.log(`Found ${filteredMigrations.length} migrations to apply:`);
    for (const migration of filteredMigrations) {
      console.log(`- ${migration.version}: ${migration.name}`);
    }
    
    // Apply migrations
    let success = true;
    let appliedCount = 0;
    let lastApplied = null;
    
    for (const migration of filteredMigrations) {
      const result = await executeMigration(db, migration, dryRun);
      
      if (!result) {
        success = false;
        break;
      }
      
      appliedCount++;
      lastApplied = migration;
    }
    
    if (!dryRun && success && lastApplied) {
      // Update schema version
      const newSchema = {
        version: lastApplied.version,
        lastMigration: lastApplied.name,
        migrationsApplied: currentSchema.migrationsApplied + appliedCount,
        lastUpdated: new Date().toISOString()
      };
      
      saveSchemaVersion(newSchema);
    }
    
    return success;
  } catch (error) {
    console.error('Error running migrations:', error);
    return false;
  } finally {
    // Close database connection
    if (db) {
      try {
        const connector = getDatabaseConnector();
        await connector.disconnect(db);
      } catch (error) {
        console.error('Error disconnecting from database:', error);
      }
    }
  }
}

/**
 * Roll back migrations
 * @param {Object} options - Rollback options
 * @returns {Promise<boolean>} Success status
 */
async function rollbackMigrations(options = {}) {
  const {
    steps = 1,
    toVersion = null,
    dryRun = CONFIG.dryRun
  } = options;
  
  console.log(`Rolling back migrations${dryRun ? ' (DRY RUN)' : ''}...`);
  
  let db = null;
  
  try {
    // Get current schema version
    const currentSchema = getCurrentSchemaVersion();
    console.log(`Current schema version: ${currentSchema.version}`);
    
    // Get database connector
    const connector = getDatabaseConnector();
    
    // Connect to database
    db = await connector.connect();
    
    // Get applied migrations
    const appliedMigrations = await getAppliedMigrations(db);
    
    // Get migration files
    const migrationFiles = getMigrationFiles();
    
    // Create a map of applied migrations with file info
    const migrationsMap = new Map();
    for (const applied of appliedMigrations) {
      const fileInfo = migrationFiles.find(m => m.version === applied.version);
      if (fileInfo) {
        migrationsMap.set(applied.version, {
          ...applied,
          ...fileInfo
        });
      }
    }
    
    // Get migrations to roll back
    let migrationsToRollback = [];
    
    if (toVersion) {
      // Roll back to specific version
      migrationsToRollback = Array.from(migrationsMap.values())
        .filter(m => compareVersions(m.version, toVersion) > 0)
        .sort((a, b) => compareVersions(b.version, a.version)); // Reverse order
    } else {
      // Roll back specified number of steps
      migrationsToRollback = Array.from(migrationsMap.values())
        .sort((a, b) => compareVersions(b.version, a.version)) // Reverse order
        .slice(0, steps);
    }
    
    if (migrationsToRollback.length === 0) {
      console.log('No migrations to roll back');
      return true;
    }
    
    console.log(`Found ${migrationsToRollback.length} migrations to roll back:`);
    for (const migration of migrationsToRollback) {
      console.log(`- ${migration.version}: ${migration.name}`);
    }
    
    // Roll back migrations
    let success = true;
    let rolledBackCount = 0;
    let lastRolledBack = null;
    
    for (const migration of migrationsToRollback) {
      const result = await rollbackMigration(db, migration, dryRun);
      
      if (!result) {
        success = false;
        break;
      }
      
      rolledBackCount++;
      lastRolledBack = migration;
    }
    
    if (!dryRun && success && lastRolledBack) {
      // Find the previous version
      const previousVersion = migrationsToRollback.length === appliedMigrations.length
        ? '0.0.0'
        : appliedMigrations
            .filter(m => compareVersions(m.version, lastRolledBack.version) < 0)
            .sort((a, b) => compareVersions(b.version, a.version))[0]?.version || '0.0.0';
      
      // Update schema version
      const newSchema = {
        version: previousVersion,
        lastMigration: previousVersion === '0.0.0' ? null : 
          migrationsMap.get(previousVersion)?.name || null,
        migrationsApplied: currentSchema.migrationsApplied - rolledBackCount,
        lastUpdated: new Date().toISOString()
      };
      
      saveSchemaVersion(newSchema);
    }
    
    return success;
  } catch (error) {
    console.error('Error rolling back migrations:', error);
    return false;
  } finally {
    // Close database connection
    if (db) {
      try {
        const connector = getDatabaseConnector();
        await connector.disconnect(db);
      } catch (error) {
        console.error('Error disconnecting from database:', error);
      }
    }
  }
}

/**
 * Display command help
 */
function showHelp() {
  console.log(`
Database Migration System

Usage:
  node migrations.js <command> [options]

Commands:
  migrate              Run pending migrations
  rollback [steps]     Roll back migrations (default: 1 step)
  create <name>        Create a new migration
  info                 Show migration info
  help                 Show this help message

Options:
  --target-version <v> Target version for migrate/rollback
  --dry-run            Simulate without making changes
  
Examples:
  node migrations.js migrate                    # Apply all pending migrations
  node migrations.js migrate --target-version 1.0.5  # Migrate up to version 1.0.5
  node migrations.js rollback 3                 # Roll back the last 3 migrations
  node migrations.js rollback --target-version 1.0.0  # Roll back to version 1.0.0
  node migrations.js create "Add users table"   # Create a new migration
  node migrations.js info                       # Show migration status
  `);
}

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];

// Parse options
const options = {};
for (let i = 1; i < args.length; i++) {
  if (args[i] === '--target-version' && i + 1 < args.length) {
    options.targetVersion = args[i + 1];
    i++;
  } else if (args[i] === '--dry-run') {
    options.dryRun = true;
  } else if (command === 'rollback' && !isNaN(parseInt(args[i]))) {
    options.steps = parseInt(args[i]);
  }
}

// Command handler
(async () => {
  try {
    switch (command) {
      case 'migrate':
        // Run migrations
        await runMigrations(options);
        break;
        
      case 'rollback':
        // Roll back migrations
        await rollbackMigrations(options);
        break;
        
      case 'create':
        // Create a new migration
        const name = args[1];
        if (!name) {
          console.error('Migration name is required');
          showHelp();
          break;
        }
        
        // Generate new version based on current version
        const currentSchema = getCurrentSchemaVersion();
        const currentParts = currentSchema.version.split('.').map(Number);
        const newParts = [...currentParts];
        newParts[2]++; // Increment patch version
        const newVersion = newParts.join('.');
        
        await createMigration(newVersion, name);
        break;
        
      case 'info':
        // Show migration info
        const schema = getCurrentSchemaVersion();
        console.log('Schema information:');
        console.log(`- Current version: ${schema.version}`);
        console.log(`- Last migration: ${schema.lastMigration || 'none'}`);
        console.log(`- Migrations applied: ${schema.migrationsApplied}`);
        console.log(`- Last updated: ${schema.lastUpdated}`);
        
        const migrationFiles = getMigrationFiles();
        console.log(`\nAvailable migrations (${migrationFiles.length}):`);
        for (const migration of migrationFiles) {
          console.log(`- ${migration.version}: ${migration.name}`);
        }
        
        const pendingMigrations = getMigrationsToApply(schema.version);
        console.log(`\nPending migrations (${pendingMigrations.length}):`);
        for (const migration of pendingMigrations) {
          console.log(`- ${migration.version}: ${migration.name}`);
        }
        break;
        
      case 'help':
      default:
        showHelp();
        break;
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();

// Export functions for use in other modules
module.exports = {
  runMigrations,
  rollbackMigrations,
  createMigration,
  getCurrentSchemaVersion,
  getMigrationFiles,
  getMigrationsToApply
};