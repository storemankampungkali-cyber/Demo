require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

// Menggunakan environment variables dari .env (fallback ke hardcoded jika perlu untuk emergency)
const sequelize = new Sequelize(
  process.env.DB_NAME || 'neonflow_inventory', 
  process.env.DB_USER || 'dudung', 
  process.env.DB_PASS || 'Lokasiku123.', 
  {
    host: process.env.DB_HOST || '127.0.0.1',
    dialect: 'mysql',
    logging: false,
    define: { timestamps: false }
  }
);

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

User.prototype.validatePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = { sequelize, Inventory, Transaction, RejectMaster, RejectRecord, User };