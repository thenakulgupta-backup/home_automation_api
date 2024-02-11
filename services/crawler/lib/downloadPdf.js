const http = require('http');
const { S3 } = require('aws-sdk');
const { connectToDB } = require('../../config/db');
const { InternalServerError, APIResponse } = require('../../helpers/response');

let conn;

/**
 * Lambda function to download pdf from result files in db one by one and save in S3
 * @param {*} event 
 * @param {*} context 
 * @returns {Promise<Object>} APIGatewayProxyResult
 */
exports.downloadPdf = async function (event, context) {
    context.callbackWaitsForEmptyEventLoop = false;
    try {
        const fileId = event.fileId;
        conn = await connectToDB(conn);
        const ResultFile = conn.model('ResultFile');
        let resultFile = await ResultFile.findById(fileId);
        if (!resultFile) {
            return APIResponse({ message: 'not found', statusCode: 404 });
        }
        let requestURL = encodeURI(resultFile.link);
        let resultFileIdStr = resultFile._id.toHexString();
        console.log('downloading pdf');
        let uploadRequest;
        try {
            uploadRequest = await downloadAndUploadStuff(requestURL, resultFileIdStr);
        } catch (err) {
            resultFile.toSkip = true;
            resultFile = await resultFile.save();
            throw err;
        }
        console.log('downloaded pdf and uploaded to S3');
        console.log(uploadRequest);
        resultFile.isDownloaded = true;
        resultFile = await resultFile.save();
        return APIResponse({ message: `result pdf ${resultFileIdStr} uploaded` });
    } catch (err) {
        console.error(err);
        return InternalServerError;
    }
};

/**
 * Download the file at a given url and save it in S3
 * @param {string} requestURL 
 * @param {string} s3Key 
 * @returns {Promise<PromiseResult<S3.PutObjectOutput, AWS.AWSError>>}
 */
function downloadAndUploadStuff(requestURL, s3Key) {
    return new Promise((res, rej) => {
        const s3Client = new S3();
        let requestObj = http.get(requestURL, (response) => {
            if (response.statusCode >= 300) {
                rej(new Error('Error fetching URL'));
            } else {
                let s3Request = s3Client.putObject({
                    Bucket: process.env.BUCKET_NAME,
                    Key: `pdfs/${s3Key}`,
                    Body: response,
                    ContentLength: Number(response.headers['content-length']),
                    ContentType: 'application/pdf',
                }).promise();
                s3Request
                    .then((req) => res(req))
                    .catch((err) => rej(err));
            }
        });
        requestObj.on('error', (err) => {
            rej(err);
        });
    });
}
