const { DataTypes } = require('sequelize');
const { sequelize } = require('<path-to-your-sequelize-instance>');

const Student = sequelize.define('Student', {
    rollNumber: {
        type: DataTypes.STRING,
        allowNull: false
    },
    studentId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    schemeId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    institutionCode: {
        type: DataTypes.STRING,
        allowNull: false
    },
    programmeCode: {
        type: DataTypes.STRING,
        allowNull: false
    },
    batch: {
        type: DataTypes.STRING,
        allowNull: false
    },
    takenFrom: {
        type: DataTypes.UUID,
        allowNull: false
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    timestamps: false
});

module.exports = Student;
