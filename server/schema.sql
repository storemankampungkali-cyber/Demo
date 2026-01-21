
-- NEONFLOW INVENTORY DATABASE SCHEMA (MySQL)
CREATE DATABASE IF NOT EXISTS neonflow_inventory;
USE neonflow_inventory;

-- Tabel Inventaris Utama
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

-- Tabel Transaksi (Stock In/Out)
CREATE TABLE IF NOT EXISTS Transactions (
    id VARCHAR(255) PRIMARY KEY,
    date VARCHAR(255) NOT NULL,
    type ENUM('IN', 'OUT') NOT NULL,
    items JSON NOT NULL,
    totalUnits INT NOT NULL,
    referenceNumber VARCHAR(255) DEFAULT '',
    notes TEXT,
    photos JSON
);

-- Tabel Master Reject
CREATE TABLE IF NOT EXISTS RejectMasters (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(255) NOT NULL,
    defaultUnit VARCHAR(255) NOT NULL,
    category VARCHAR(255) NOT NULL
);

-- Tabel Riwayat Reject
CREATE TABLE IF NOT EXISTS RejectRecords (
    id VARCHAR(255) PRIMARY KEY,
    date VARCHAR(255) NOT NULL,
    outletName VARCHAR(255) NOT NULL,
    items JSON NOT NULL,
    totalItems INT NOT NULL
);

-- Tabel User Management dengan Password Hashing & RBAC
CREATE TABLE IF NOT EXISTS Users (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('ADMIN', 'STAFF') DEFAULT 'STAFF',
    status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
    lastActive VARCHAR(255) DEFAULT 'Never'
);
