const { DataTypes } = require('sequelize');
const { sequelize } = require('<path-to-your-sequelize-instance>');

const Subject = sequelize.define('Subject', {
    paperId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    schemeId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    paperCode: {
        type: DataTypes.STRING,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    credits: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    type: {
        type: DataTypes.STRING,
        allowNull: false
    },
    mode: {
        type: DataTypes.STRING,
        allowNull: false
    },
    kind: {
        type: DataTypes.STRING,
        allowNull: false
    },
    major: DataTypes.INTEGER,
    minor: DataTypes.INTEGER,
    exam: {
        type: DataTypes.STRING,
        allowNull: false
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    passMarks: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    maxMarks: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    takenFrom: {
        type: DataTypes.UUID,
        allowNull: false
    }
}, {
    timestamps: false
});

module.exports = Subject;
