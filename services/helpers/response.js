const { Sequelize, DataTypes } = require('sequelize');
const { APIGatewayProxyResult } = require('aws-lambda');

const sequelize = new Sequelize('database', 'username', 'password', {
    host: 'localhost',
    dialect: 'mysql', // Change this to the appropriate database dialect
});

const Model = sequelize.define('Model', {
    // Define your model properties here
    property1: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    property2: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
});

// Define your associations here
// Model.associate = (models) => {
//   ...
// };

// Create tables if they don't exist
sequelize.sync();

async function getData() {
    try {
        const data = await Model.findAll();
        return data;
    } catch (error) {
        console.error('Error fetching data:', error);
        return [];
    }
}

function APIResponse(options) {
    let body = '';
    options = options || {};
    let defaultStatusCode = 204;
    if (options.data || options.message) {
        defaultStatusCode = 200;
        body = JSON.stringify({
            data: options.data,
            message: options.message,
        });
    }
    let headers = {
        'Access-Control-Allow-Methods': '*',
        'Access-Control-Allow-Headers': '*',
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': process.env.FRONTEND_ORIGIN,
    };
    return {
        statusCode: options.statusCode || defaultStatusCode,
        body,
        isBase64Encoded: options.isBase64Encoded,
        headers: Object.assign(headers, options.headers),
        multiValueHeaders: options.multiValueHeaders,
    };
}

const InternalServerError = APIResponse({
    statusCode: 500,
    message: 'Something Went wrong',
});
const NotFoundError = APIResponse({
    statusCode: 404,
    message: 'Not Found',
});
const UnauthorizedError = APIResponse({
    statusCode: 401,
    message: 'Unauthorized',
});
const ForbiddenError = APIResponse({
    statusCode: 403,
    message: 'Forbidden',
});

module.exports = {
    getData,
    InternalServerError,
    NotFoundError,
    UnauthorizedError,
    ForbiddenError,
};
