const AWS = require('aws-sdk');
const { connectToDB } = require('../../config/db');
const { parseContent } = require('./parser');
const { prepareForInsert, insertAllData } = require('./insert');
const { APIResponse, InternalServerError } = require('../../helpers/response');

const s3Client = new AWS.S3();
let conn;

/**
 * Lambda to parse txt 1 by 1 and save data into the db
 * @param event 
 * @param context 
 */
exports.parseTxt = async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false;
    try {
        const fileId = event.fileId;
        conn = await connectToDB(conn);
        const ResultFile = conn.model('ResultFile');
        let resultFile = await ResultFile.findById(fileId);
        if (!resultFile) {
            return APIResponse({ message: 'not found', statusCode: 404 });
        }
        let resultFileIdStr = resultFile._id.toHexString();
        const fileContent = await getTxt(resultFileIdStr);
        console.log(`parsing result ${resultFileIdStr}`);
        try {
            const { pages, subjects, institutions, programmes } = parseContent(fileContent);
            const prepared = prepareForInsert({ conn, subjectsMap: subjects, pages, takenFrom: resultFile._id, institutionsMap: institutions, programmesMap: programmes });
            await insertAllData(prepared);
        } catch (err) {
            resultFile.toSkip = true;
            resultFile = await resultFile.save();
            throw err;
        }
        resultFile.isParsed = true;
        resultFile = await resultFile.save();
        return APIResponse({ message: 'result parsed' });
    } catch (err) {
        console.error(err);
        return InternalServerError;
    }
};

/**
 * fetch the txt file from the S3
 * @param fileKey 
 */
async function getTxt(fileKey) {
    try {
        const s3Response = await s3Client.getObject({
            Key: `txts/${fileKey}`,
            Bucket: process.env.BUCKET_NAME
        }).promise();
        return s3Response.Body.toString();
    } catch (err) {
        console.error(err);
        throw new Error("Couldn't fetch the txt file");
    }
}
