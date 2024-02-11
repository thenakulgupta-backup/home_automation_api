const { APIResponse, InternalServerError } = require("../helpers/response");

async function options(_event, _context) {
    try {
        return APIResponse();
    } catch (err) {
        return InternalServerError;
    }
}

module.exports = {
    options: options
};
