const { DataTypes } = require('sequelize');
const { sequelize } = require('<path-to-your-sequelize-instance>');

const Exam = sequelize.define('Exam', {
    regularReappear: {
        type: DataTypes.STRING,
        allowNull: false
    },
    special: {
        type: DataTypes.STRING
    },
    date: {
        type: DataTypes.DATE
    }
}, {
    timestamps: false
});

const Marks = sequelize.define('Marks', {
    score: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    isSpecial: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    },
    specialString: {
        type: DataTypes.STRING
    }
}, {
    timestamps: false
});

const SubjectResult = sequelize.define('SubjectResult', {
    paperId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    credits: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    grade: {
        type: DataTypes.STRING
    }
}, {
    timestamps: false
});

const SemYear = sequelize.define('SemYear', {
    type: {
        type: DataTypes.STRING,
        allowNull: false
    },
    num: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    timestamps: false
});

const ResultSet = sequelize.define('ResultSet', {
    pageNumber: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    rollNumber: {
        type: DataTypes.STRING,
        allowNull: false
    },
    totalCredits: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    declaredDate: {
        type: DataTypes.DATE,
        allowNull: false
    },
    preparedDate: {
        type: DataTypes.DATE,
        allowNull: false
    },
    schemeId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    studentId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    programmeCode: {
        type: DataTypes.STRING,
        allowNull: false
    },
    institutionCode: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    timestamps: false
});

ResultSet.hasMany(SubjectResult, {
    as: 'subjects',
    foreignKey: 'resultSetId',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});

ResultSet.belongsTo(Exam, {
    foreignKey: 'examId',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});

ResultSet.belongsTo(SemYear, {
    foreignKey: 'semYearId',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});

module.exports = {
    Exam,
    Marks,
    SubjectResult,
    SemYear,
    ResultSet
};
