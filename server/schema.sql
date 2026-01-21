-- NEONFLOW INVENTORY DATABASE SCHEMA (MySQL)
-- Run this script to manually create the database structure

CREATE DATABASE IF NOT EXISTS neonflow_inventory;
USE neonflow_inventory;

-- 1. Table: Inventories
-- Menyimpan data stok utama
CREATE TABLE IF NOT EXISTS Inventories (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(255) NOT NULL,
    category VARCHAR(255) NOT NULL,
    quantity INT DEFAULT 0,
    price FLOAT DEFAULT 0,
    status ENUM('In Stock', 'Low Stock', 'Out of Stock', 'Discontinued') DEFAULT 'In Stock',
    lastUpdated VARCHAR(255)
);

-- 2. Table: Transactions
-- Menyimpan riwayat transaksi (Stock In/Out)
-- Kolom 'items' menggunakan JSON untuk menyimpan detail item (CartItem) tanpa perlu tabel relasi kompleks
CREATE TABLE IF NOT EXISTS Transactions (
    id VARCHAR(255) PRIMARY KEY,
    date VARCHAR(255) NOT NULL,
    type ENUM('IN', 'OUT') NOT NULL,
    items JSON NOT NULL, -- Array of objects: {id, name, qty, unit, ...}
    totalUnits INT NOT NULL,
    referenceNumber VARCHAR(255) DEFAULT '',
    notes TEXT,
    photos JSON -- Array of string URLs
);

-- 3. Table: RejectMasters
-- Master data khusus untuk modul Reject/Limbah
CREATE TABLE IF NOT EXISTS RejectMasters (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(255) NOT NULL,
    defaultUnit VARCHAR(255) NOT NULL,
    category VARCHAR(255) NOT NULL
);

-- 4. Table: RejectRecords
-- Riwayat log barang reject
CREATE TABLE IF NOT EXISTS RejectRecords (
    id VARCHAR(255) PRIMARY KEY,
    date VARCHAR(255) NOT NULL,
    outletName VARCHAR(255) NOT NULL,
    items JSON NOT NULL, -- Array of items
    totalItems INT NOT NULL
);

-- 5. Table: Users
-- Manajemen pengguna aplikasi
CREATE TABLE IF NOT EXISTS Users (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    role ENUM('ADMIN', 'STAFF') DEFAULT 'STAFF',
    status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
    lastActive VARCHAR(255) DEFAULT 'Never'
);

-- Optional: Create default admin user
-- INSERT INTO Users (id, name, email, role, status) VALUES ('usr-1', 'Super Admin', 'admin@neonflow.com', 'ADMIN', 'ACTIVE');
