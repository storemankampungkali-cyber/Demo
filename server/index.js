const express = require('express');
const cors = require('cors');
const { sequelize, Inventory, Transaction, RejectMaster, RejectRecord, User } = require('./models');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// --- DATABASE CONNECTION & SYNC ---
// This creates tables if they don't exist
sequelize.sync() 
  .then(() => console.log('⚡ MySQL Database Connected & Synced'))
  .catch(err => console.error('MySQL Connection Error:', err));

// --- ROUTES ---

// 1. INVENTORY ROUTES
app.get('/api/inventory', async (req, res) => {
  try {
    const items = await Inventory.findAll();
    res.json(items);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/inventory/bulk', async (req, res) => {
  try {
    // bulkCreate is Sequelize's version of insertMany
    // updateOnDuplicate handles if ID already exists (upsert)
    const newItems = await Inventory.bulkCreate(req.body, { 
      updateOnDuplicate: ['name', 'quantity', 'price', 'status', 'lastUpdated'] 
    });
    res.json(newItems);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// 2. TRANSACTION ROUTES (Handles Stock Logic)
app.get('/api/transactions', async (req, res) => {
  try {
    const history = await Transaction.findAll({
      order: [['date', 'DESC']]
    });
    res.json(history);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/transactions', async (req, res) => {
  // Start a MySQL Transaction (ACID compliance)
  const t = await sequelize.transaction();
  
  try {
    const { id, date, type, items, totalUnits, referenceNumber, notes, photos } = req.body;

    // 1. Create Transaction Record
    const newTransaction = await Transaction.create({
      id, date, type, items, totalUnits, referenceNumber, notes, photos
    }, { transaction: t });

    // 2. Update Inventory Quantities
    const multiplier = type === 'IN' ? 1 : -1;
    
    for (const item of items) {
      const qtyChange = item.orderQuantity * item.selectedUnit.ratio * multiplier;
      
      // Find item (findByPk because id is Primary Key)
      const inventoryItem = await Inventory.findByPk(item.id, { transaction: t });
      
      if (!inventoryItem) {
          throw new Error(`Item ${item.name} not found in inventory.`);
      }

      const newQty = inventoryItem.quantity + qtyChange;
      
      if (newQty < 0) {
          throw new Error(`Insufficient stock for ${item.name}. Current: ${inventoryItem.quantity}`);
      }

      inventoryItem.quantity = newQty;
      
      // Update Status based on new Qty
      if (newQty === 0) inventoryItem.status = 'Out of Stock';
      else if (newQty < 20) inventoryItem.status = 'Low Stock';
      else inventoryItem.status = 'In Stock';
      
      inventoryItem.lastUpdated = new Date().toISOString().split('T')[0];
      await inventoryItem.save({ transaction: t });
    }

    // Commit the transaction
    await t.commit();
    res.json({ message: 'Transaction success', transaction: newTransaction });

  } catch (err) {
    // Rollback if anything fails
    await t.rollback();
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/transactions/:id', async (req, res) => {
    try {
        const [updatedRows] = await Transaction.update(req.body, {
            where: { id: req.params.id }
        });
        
        if (updatedRows > 0) {
            const updatedTransaction = await Transaction.findByPk(req.params.id);
            res.json(updatedTransaction);
        } else {
            res.status(404).json({ error: "Transaction not found" });
        }
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/transactions/:id', async (req, res) => {
    try {
        await Transaction.destroy({
            where: { id: req.params.id }
        });
        res.json({ message: 'Deleted' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 3. REJECT MODULE ROUTES
app.get('/api/reject/master', async (req, res) => {
    try {
        const items = await RejectMaster.findAll();
        res.json(items);
    } catch(err) { res.status(500).json({error: err.message}); }
});

app.post('/api/reject/master', async (req, res) => {
    try {
        const items = await RejectMaster.bulkCreate(req.body, {
             updateOnDuplicate: ['name', 'sku'] 
        });
        res.json(items);
    } catch(err) { res.status(400).json({error: err.message}); }
});

app.get('/api/reject/history', async (req, res) => {
    try {
        const history = await RejectRecord.findAll({
            order: [['date', 'DESC']]
        });
        res.json(history);
    } catch(err) { res.status(500).json({error: err.message}); }
});

app.post('/api/reject/record', async (req, res) => {
    try {
        const record = await RejectRecord.create(req.body);
        res.json(record);
    } catch(err) { res.status(400).json({error: err.message}); }
});

// 4. USER ROUTES
app.get('/api/users', async (req, res) => {
    try {
        const users = await User.findAll();
        res.json(users);
    } catch(err) { res.status(500).json({error: err.message}); }
});

app.post('/api/users', async (req, res) => {
    try {
        const user = await User.create(req.body);
        res.json(user);
    } catch(err) { res.status(400).json({error: err.message}); }
});

app.put('/api/users/:id', async (req, res) => {
    try {
        await User.update(req.body, {
            where: { id: req.params.id }
        });
        const updatedUser = await User.findByPk(req.params.id);
        res.json(updatedUser);
    } catch(err) { res.status(400).json({error: err.message}); }
});

app.delete('/api/users/:id', async (req, res) => {
    try {
        await User.destroy({
            where: { id: req.params.id }
        });
        res.json({ message: 'User deleted' });
    } catch(err) { res.status(500).json({error: err.message}); }
});

app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));