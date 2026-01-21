
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

// --- 1. DATABASE CONFIGURATION ---
const sequelize = new Sequelize(
  process.env.DB_NAME || 'neonflow_inventory', 
  process.env.DB_USER || 'root', 
  process.env.DB_PASS || '', 
  {
    host: process.env.DB_HOST || '127.0.0.1',
    dialect: 'mysql',
    logging: false,
    define: { timestamps: false }
  }
);

// --- 2. MODEL DEFINITIONS ---
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

// Ekspor model agar bisa dipakai setupDB.js
module.exports = { sequelize, Inventory, Transaction, RejectMaster, RejectRecord, User };

// --- 3. EXPRESS APP SETUP ---
const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'neonflow_secret';

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// --- 4. API ROUTES ---

// AUTH
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email, status: 'ACTIVE' } });
    if (!user || !(await user.validatePassword(password))) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    user.lastActive = new Date().toLocaleString();
    await user.save();
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// SYSTEM RESET
app.post('/api/system/reset', async (req, res) => {
  try {
    await sequelize.sync({ force: true });
    await User.create({ id: 'usr-1', name: 'Super Admin', email: 'admin', password: '22', role: 'ADMIN', status: 'ACTIVE', lastActive: 'Just Now' });
    res.json({ success: true, message: 'Database reset. Login: admin / 22' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// INVENTORY
app.get('/api/inventory', async (req, res) => res.json(await Inventory.findAll()));
app.post('/api/inventory/bulk', async (req, res) => res.json(await Inventory.bulkCreate(req.body, { updateOnDuplicate: ['name', 'quantity', 'price', 'status', 'lastUpdated'] })));

// TRANSACTIONS
app.get('/api/transactions', async (req, res) => res.json(await Transaction.findAll({ order: [['date', 'DESC']] })));
app.post('/api/transactions', async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const newTrx = await Transaction.create(req.body, { transaction: t });
    const multiplier = req.body.type === 'IN' ? 1 : -1;
    for (const item of req.body.items) {
      const invItem = await Inventory.findByPk(item.id, { transaction: t });
      if (!invItem) throw new Error(`Item ${item.name} not found`);
      const newQty = invItem.quantity + (item.orderQuantity * item.selectedUnit.ratio * multiplier);
      if (newQty < 0) throw new Error(`Stock insufficient for ${item.name}`);
      invItem.quantity = newQty;
      invItem.status = newQty === 0 ? 'Out of Stock' : (newQty < 20 ? 'Low Stock' : 'In Stock');
      invItem.lastUpdated = new Date().toISOString().split('T')[0];
      await invItem.save({ transaction: t });
    }
    await t.commit();
    res.json({ transaction: newTrx });
  } catch (err) { await t.rollback(); res.status(400).json({ error: err.message }); }
});

// REJECT
app.get('/api/reject/master', async (req, res) => res.json(await RejectMaster.findAll()));
app.post('/api/reject/master', async (req, res) => res.json(await RejectMaster.bulkCreate(req.body, { updateOnDuplicate: ['name', 'sku'] })));
app.get('/api/reject/history', async (req, res) => res.json(await RejectRecord.findAll({ order: [['date', 'DESC']] })));
app.post('/api/reject/record', async (req, res) => res.json(await RejectRecord.create(req.body)));

// USERS
app.get('/api/users', async (req, res) => res.json(await User.findAll({ attributes: { exclude: ['password'] } })));
app.post('/api/users', async (req, res) => res.json(await User.create(req.body)));
app.delete('/api/users/:id', async (req, res) => {
    const user = await User.findByPk(req.params.id);
    if(user) await user.destroy();
    res.json({ success: true });
});

// --- 5. SERVER INITIALIZATION ---
// Hanya jalankan app.listen jika file ini dijalankan langsung (bukan di-require)
if (require.main === module) {
  sequelize.authenticate()
    .then(() => {
      console.log('⚡ MySQL Database Connected');
      const PORT = process.env.PORT || 3000;
      app.listen(PORT, () => console.log(`🚀 NeonFlow Server on port ${PORT}`));
    })
    .catch(err => console.error('❌ Database Connection Error:', err));
}