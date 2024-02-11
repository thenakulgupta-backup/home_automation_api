const { DataTypes } = require('sequelize');
const { sequelize } = require('<path-to-your-sequelize-instance>');

const resultFileSchema = sequelize.define('ResultFile', {
    link: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    linkText: {
        type: DataTypes.STRING,
        allowNull: false
    },
    isDownloaded: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    isConverted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    isParsed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    downloadedAt: {
        type: DataTypes.DATE
    },
    convertedAt: {
        type: DataTypes.DATE
    },
    parsedAt: {
        type: DataTypes.DATE
    },
    toSkip: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    isRanked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    // Additional options
});

module.exports = resultFileSchema;
