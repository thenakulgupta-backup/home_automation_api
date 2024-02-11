const { DataTypes } = require('sequelize');
const { sequelize } = require('<path-to-your-sequelize-instance>');

const Institution = sequelize.define('Institution', {
    code: {
        type: DataTypes.STRING,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    timestamps: false
});

const SemesterRank = sequelize.define('SemesterRank', {
    marks: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    rollNumber: {
        type: DataTypes.STRING,
        allowNull: false
    },
    collegeRank: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    universityRank: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    batch: {
        type: DataTypes.STRING
    }
}, {
    timestamps: false
});

SemesterRank.belongsTo(Institution, {
    foreignKey: 'institutionId',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});

module.exports = {
    Institution,
    SemesterRank
};
