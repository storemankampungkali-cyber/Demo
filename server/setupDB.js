
require('dotenv').config();
const { sequelize, User } = require('./models');

const initDB = async () => {
    try {
        console.log('🚀 INITIALIZING NEONFLOW DATABASE...');
        // Menghapus dan membuat ulang tabel sesuai model
        await sequelize.sync({ force: true });
        
        // Membuat admin default
        await User.create({
            id: 'usr-admin-01',
            name: 'Super Admin',
            email: 'admin',
            password: '22',
            role: 'ADMIN',
            status: 'ACTIVE',
            lastActive: 'System Initialized'
        });

        console.log('✅ Success! Database synced and admin user created.');
        console.log('👉 Login: admin / 22');
        process.exit(0);
    } catch (error) {
        console.error('❌ Initialization Error:', error);
        process.exit(1);
    }
};

if (require.main === module) {
    initDB();
}
