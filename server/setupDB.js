
const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

// Database Connection
const sequelize = new Sequelize('neonflow_inventory', 'dudung', 'Lokasiku123.', {
  host: '127.0.0.1',
  dialect: 'mysql',
  logging: false,
  define: { timestamps: false }
});

// --- MODEL DEFINITIONS ---

const Inventory = sequelize.define('Inventory', {
  id: { type: DataTypes.STRING, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  sku: { type: DataTypes.STRING, allowNull: false },
  category: { type: DataTypes.STRING, allowNull: false },
  quantity: { type: DataTypes.INTEGER, defaultValue: 0 },
  price: { type: DataTypes.FLOAT, defaultValue: 0 },
  status: { type: DataTypes.STRING, defaultValue: 'In Stock' },
  lastUpdated: { type: DataTypes.STRING }
});

const Transaction = sequelize.define('Transaction', {
  id: { type: DataTypes.STRING, primaryKey: true },
  date: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.ENUM('IN', 'OUT'), allowNull: false },
  items: { type: DataTypes.JSON, allowNull: false },
  totalUnits: { type: DataTypes.INTEGER, allowNull: false },
  referenceNumber: { type: DataTypes.STRING },
  notes: { type: DataTypes.TEXT },
  photos: { type: DataTypes.JSON }
});

const RejectMaster = sequelize.define('RejectMaster', {
  id: { type: DataTypes.STRING, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  sku: { type: DataTypes.STRING, allowNull: false },
  defaultUnit: { type: DataTypes.STRING, allowNull: false },
  category: { type: DataTypes.STRING, allowNull: false }
});

const RejectRecord = sequelize.define('RejectRecord', {
  id: { type: DataTypes.STRING, primaryKey: true },
  date: { type: DataTypes.STRING, allowNull: false },
  outletName: { type: DataTypes.STRING, allowNull: false },
  items: { type: DataTypes.JSON, allowNull: false },
  totalItems: { type: DataTypes.INTEGER, allowNull: false }
});

const User = sequelize.define('User', {
  id: { type: DataTypes.STRING, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('ADMIN', 'STAFF'), defaultValue: 'STAFF' },
  status: { type: DataTypes.ENUM('ACTIVE', 'INACTIVE'), defaultValue: 'ACTIVE' },
  lastActive: { type: DataTypes.STRING, defaultValue: 'Never' }
}, {
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// Instance method to check password
User.prototype.validatePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

// --- STANDALONE SETUP FUNCTION ---
// Runs when file is executed directly: node setupDB.js
const initDB = async () => {
    try {
        console.log('🚀 INITIALIZING NEONFLOW DATABASE...');
        
        // Sync models to database (DROPS EXISTING TABLES)
        await sequelize.sync({ force: true });
        console.log('✅ Tables created successfully.');

        // Seed default Admin as requested: admin / 22
        await User.create({
            id: 'usr-admin-01',
            name: 'Super Admin',
            email: 'admin', // Using 'admin' as the identifier
            password: '22',  // Hashed by hooks
            role: 'ADMIN',
            status: 'ACTIVE',
            lastActive: 'System Initialized'
        });

        console.log('✅ Default Super Admin created.');
        console.log('--- LOGIN CREDENTIALS ---');
        console.log('Username: admin');
        console.log('Password: 22');
        console.log('-------------------------');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Database Initialization Failed:', error);
        process.exit(1);
    }
};

// Export for app usage
module.exports = { sequelize, Inventory, Transaction, RejectMaster, RejectRecord, User };

// Execute if run via command line
if (require.main === module) {
    initDB();
}
