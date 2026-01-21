
require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  host: process.env.DB_HOST,
  dialect: 'mysql',
  logging: false,
  define: { timestamps: false }
});

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
    }
  }
});

User.prototype.validatePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

const initDB = async () => {
    try {
        console.log('🚀 INITIALIZING NEONFLOW DATABASE...');
        await sequelize.sync({ force: true });
        
        await User.create({
            id: 'usr-admin-01',
            name: 'Super Admin',
            email: 'admin',
            password: '22',
            role: 'ADMIN',
            status: 'ACTIVE',
            lastActive: 'System Initialized'
        });

        console.log('✅ Success! Login: admin / 22');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

module.exports = { sequelize, Inventory, Transaction, RejectMaster, RejectRecord, User };

if (require.main === module) {
    initDB();
}
