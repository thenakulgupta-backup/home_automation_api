const { Context } = require('aws-lambda');
const { InternalServerError, APIResponse } = require('../../helpers/response');
const { S3 } = require('aws-sdk');
const { Connection, model } = require('mongoose');
const { connectToDB } = require('../../config/db');
const { promisify } = require('util');
const fs = require('fs');
const { exec } = require('child_process');

const execPromise = promisify(exec);
const s3Client = new S3();
let conn;

/**
 * Lambda function which converts the pdf files to corresponding txt
 * @param event 
 * @param context 
 */
async function convertToTxt(event, context) {
    context.callbackWaitsForEmptyEventLoop = false;
    process.env['PATH'] = process.env['PATH'] + ':' + process.env['LAMBDA_TASK_ROOT'];
    process.env.PATH = process.env.PATH + ':' + '/opt/pdftotext/bin';
    process.env.LD_LIBRARY_PATH = process.env.LD_LIBRARY_PATH + ':' + '/opt/pdftotext/lib';
    try {
        const fileId = event.fileId;
        conn = await connectToDB(conn);
        const ResultFile = conn.model('ResultFile');
        let resultFile = await ResultFile.findById(fileId);
        if (!resultFile) {
            return APIResponse({ message: 'not found', statusCode: 404 });
        }
        let resultFileIdStr = resultFile._id.toHexString();

        try {
            console.log("started pdf fetching");
            await getPdfFile(resultFileIdStr);
            console.log("ended pdf fetching");

            console.log("started pdf conversion");
            await convertPdfFile(resultFileIdStr);
            console.log("ended pdf conversion");

            console.log("started txt upload");
            await uploadTxtFile(resultFileIdStr);
            console.log("ended pdf upload");
        } catch (err) {
            resultFile.toSkip = true;
            resultFile = await resultFile.save();
            throw err;
        }

        resultFile.isConverted = true;
        resultFile = await resultFile.save();

        return APIResponse({ message: `result pdf ${resultFileIdStr} converted to txt` });
    } catch (err) {
        console.error(err);
        return InternalServerError;
    }
}

/**
 * fetch the pdf from S3
 * @param fileKey 
 */
function getPdfFile(fileKey) {
    return new Promise((res, rej) => {
        let writeStream = fs.createWriteStream(`/tmp/${fileKey}.pdf`);
        let s3Stream = s3Client.getObject({
            Bucket: process.env.BUCKET_NAME,
            Key: `pdfs/${fileKey}`,
        }).createReadStream();
        s3Stream.on('error', (err) => {
            console.log(err);
            rej(new Error("Couldn't fetch the pdf file"));
        });
        s3Stream.pipe(writeStream).on('close', () => {
            res();
        });
    });
}

/**
 * pdf=>txt using poppler's pdftotext
 * @param fileKey 
 */
async function convertPdfFile(fileKey) {
    try {
        await execPromise(`pdftotext -raw /tmp/${fileKey}.pdf /tmp/${fileKey}.txt`);
        return;
    } catch (err) {
        console.log(err);
        throw new Error("Couldn't convert the file");
    }
}

/**
 * Upload the created txt to S3
 * @param fileKey 
 */
function uploadTxtFile(fileKey) {
    let fileReadStream = fs.createReadStream(`/tmp/${fileKey}.txt`);
    return s3Client
        .putObject({
            Bucket: process.env.BUCKET_NAME,
            Key: `txts/${fileKey}`,
            Body: fileReadStream,
            ContentType: 'text/plain',
        })
        .promise();
}

module.exports = { convertToTxt };
