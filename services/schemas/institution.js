const { DataTypes } = require('sequelize');
const { sequelize } = require('<path-to-your-sequelize-instance>');

const institutionSchema = sequelize.define('Institution', {
  code: {
    type: DataTypes.STRING,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  takenFrom: {
    type: DataTypes.UUID,
    allowNull: false
  }
}, {
  // Additional options
});

module.exports = institutionSchema;
