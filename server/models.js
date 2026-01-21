const { Sequelize, DataTypes } = require('sequelize');

// --- DATABASE CONNECTION CONFIG ---
// Ganti 'root', 'password', 'neonflow_inventory' sesuai config MySQL di VPS Anda
const sequelize = new Sequelize('neonflow_inventory', 'root', 'root', {
  host: '127.0.0.1',
  dialect: 'mysql',
  logging: false, // Set true to see raw SQL queries
  define: {
    timestamps: false // We use custom date fields provided by frontend logic
  }
});

// --- INVENTORY MODEL ---
const Inventory = sequelize.define('Inventory', {
  id: { type: DataTypes.STRING, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  sku: { type: DataTypes.STRING, allowNull: false },
  category: { type: DataTypes.STRING, allowNull: false },
  quantity: { type: DataTypes.INTEGER, defaultValue: 0 },
  price: { type: DataTypes.FLOAT, defaultValue: 0 },
  status: { 
    type: DataTypes.ENUM('In Stock', 'Low Stock', 'Out of Stock', 'Discontinued'), 
    defaultValue: 'In Stock' 
  },
  lastUpdated: { type: DataTypes.STRING } // Keeping string to match frontend ISO format
});

// --- TRANSACTION MODEL ---
const Transaction = sequelize.define('Transaction', {
  id: { type: DataTypes.STRING, primaryKey: true },
  date: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.ENUM('IN', 'OUT'), allowNull: false },
  // Storing complex nested objects (Cart Items) as JSON to maintain 
  // compatibility with the existing frontend structure without creating 
  // complex join tables immediately. MySQL 5.7+ supports JSON.
  items: { type: DataTypes.JSON, allowNull: false }, 
  totalUnits: { type: DataTypes.INTEGER, allowNull: false },
  referenceNumber: { type: DataTypes.STRING, defaultValue: '' },
  notes: { type: DataTypes.TEXT, defaultValue: '' },
  photos: { type: DataTypes.JSON, defaultValue: [] } // Array of strings stored as JSON
});

// --- REJECT MASTER DATA MODEL ---
const RejectMaster = sequelize.define('RejectMaster', {
  id: { type: DataTypes.STRING, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  sku: { type: DataTypes.STRING, allowNull: false },
  defaultUnit: { type: DataTypes.STRING, allowNull: false },
  category: { type: DataTypes.STRING, allowNull: false }
});

// --- REJECT HISTORY MODEL ---
const RejectRecord = sequelize.define('RejectRecord', {
  id: { type: DataTypes.STRING, primaryKey: true },
  date: { type: DataTypes.STRING, allowNull: false },
  outletName: { type: DataTypes.STRING, allowNull: false },
  items: { type: DataTypes.JSON, allowNull: false }, // Stored as JSON
  totalItems: { type: DataTypes.INTEGER, allowNull: false }
});

// --- USER MODEL ---
const User = sequelize.define('User', {
  id: { type: DataTypes.STRING, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('ADMIN', 'STAFF'), defaultValue: 'STAFF' },
  status: { type: DataTypes.ENUM('ACTIVE', 'INACTIVE'), defaultValue: 'ACTIVE' },
  lastActive: { type: DataTypes.STRING, defaultValue: 'Never' }
});

module.exports = {
  sequelize,
  Inventory,
  Transaction,
  RejectMaster,
  RejectRecord,
  User
};