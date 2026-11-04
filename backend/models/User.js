const { DataTypes } = require('sequelize');
const { sequelize } = require('./Report'); // Pinjam koneksi dari file Report.js

const User = sequelize.define('User', {
  username: { 
    type: DataTypes.STRING, 
    allowNull: false, 
    unique: true 
  },
  password: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  role: {
    type: DataTypes.STRING,
    defaultValue: 'admin'
  }
}, {
  tableName: 'users',
  timestamps: true
});

module.exports = { User };