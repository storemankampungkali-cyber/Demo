
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { sequelize, Inventory, Transaction, RejectMaster, RejectRecord, User } = require('./setupDB');

const app = express();
const JWT_SECRET = 'neonflow_super_secret_key_2024'; // In production, use env variable

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Note: In production, sequelize.sync() usually happens in setup script, 
// but we keep a check here for app stability.
sequelize.authenticate()
  .then(() => console.log('⚡ MySQL Database Connected & Authenticated'))
  .catch(err => console.error('MySQL Connection Error:', err));

// --- AUTHENTICATION ---
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email, status: 'ACTIVE' } });
    
    if (!user || !(await user.validatePassword(password))) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    
    // Update last active
    user.lastActive = new Date().toLocaleString();
    await user.save();

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Middleware for RBAC
const authorize = (roles = []) => {
  return (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      req.user = decoded;
      next();
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };
};

// --- SYSTEM UTILITIES ---
app.post('/api/system/reset', async (req, res) => {
  try {
    console.log('☢️ INITIATING SYSTEM RESET VIA API...');
    await sequelize.sync({ force: true });
    
    await User.create({
      id: 'usr-1',
      name: 'Super Admin',
      email: 'admin',
      password: '22',
      role: 'ADMIN',
      status: 'ACTIVE',
      lastActive: 'Just Now'
    });

    res.json({ 
      success: true, 
      message: 'Database berhasil direset. Login Admin: admin / 22' 
    });
  } catch (err) {
    res.status(500).json({ error: 'Gagal melakukan reset sistem: ' + err.message });
  }
});

// --- INVENTORY ---
app.get('/api/inventory', async (req, res) => {
  const items = await Inventory.findAll();
  res.json(items);
});

app.post('/api/inventory/bulk', async (req, res) => {
  try {
    const items = await Inventory.bulkCreate(req.body, { updateOnDuplicate: ['name', 'quantity', 'price', 'status', 'lastUpdated'] });
    res.json(items);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// --- TRANSACTIONS ---
app.get('/api/transactions', async (req, res) => {
  const history = await Transaction.findAll({ order: [['date', 'DESC']] });
  res.json(history);
});

app.post('/api/transactions', async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id, date, type, items, totalUnits, referenceNumber, notes, photos } = req.body;
    const newTrx = await Transaction.create({ id, date, type, items, totalUnits, referenceNumber, notes, photos }, { transaction: t });
    
    const multiplier = type === 'IN' ? 1 : -1;
    for (const item of items) {
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
  } catch (err) {
    await t.rollback();
    res.status(400).json({ error: err.message });
  }
});

// --- REJECT MODULE ---
app.get('/api/reject/master', async (req, res) => {
  const items = await RejectMaster.findAll();
  res.json(items);
});

app.post('/api/reject/master', async (req, res) => {
  const items = await RejectMaster.bulkCreate(req.body, { updateOnDuplicate: ['name', 'sku'] });
  res.json(items);
});

app.get('/api/reject/history', async (req, res) => {
  const hist = await RejectRecord.findAll({ order: [['date', 'DESC']] });
  res.json(hist);
});

app.post('/api/reject/record', async (req, res) => {
  const record = await RejectRecord.create(req.body);
  res.json(record);
});

// --- USERS MANAGEMENT (Admin only) ---
app.get('/api/users', async (req, res) => {
  const users = await User.findAll({ attributes: { exclude: ['password'] } });
  res.json(users);
});

app.post('/api/users', async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.json(user);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    await user.update(req.body);
    res.json(user);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    await user.destroy();
    res.json({ success: true });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.listen(5000, () => console.log('🚀 Server running on port 5000'));
