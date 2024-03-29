const { Context } = require('aws-lambda');
const { Connection, model } = require('mongoose');
const { connectToDB } = require('./config/db');
const { APIResponse, InternalServerError } = require('./helpers/response');
const { Lambda } = require('aws-sdk');
const lambda = new Lambda();

let conn;

/**
 * Triggered by cron to run every minute and execute the functions acc to requirement
 * @param event
 * @param context
 */
async function executeScripts(event, context) {
  context.callbackWaitsForEmptyEventLoop = false;
  try {
    const downloadPerMinute = Number(process.env.DOWNLOADS_PER_MINUTE);
    const convertPerMinute = Number(process.env.CONVERTS_PER_MINUTE);
    const parsePerMinute = Number(process.env.PARSE_PER_MINUTE);
    const rankPerMinute = Number(process.env.RANK_PER_MINUTE);
    conn = await connectToDB(conn);
    const ResultFile = conn.model('ResultFile');
    if (downloadPerMinute) {
      const toDownload = await ResultFile.find({
        isDownloaded: false,
        toSkip: false,
      }).limit(downloadPerMinute);
      await invokeLambda('downloadPdf', toDownload);
    }
    if (convertPerMinute) {
      const toConvert = await ResultFile.find({
        isDownloaded: true,
        isConverted: false,
        toSkip: false,
      }).limit(convertPerMinute);
      await invokeLambda('convertToTxt', toConvert);
    }
    if (parsePerMinute) {
      const toParse = await ResultFile.find({
        isDownloaded: true,
        isConverted: true,
        toSkip: false,
        isParsed: false,
      }).limit(parsePerMinute);
      await invokeLambda('parseTxt', toParse);
    }
    if (rankPerMinute) {
      const toRank = await ResultFile.find({
        isDownloaded: true,
        isConverted: true,
        toSkip: false,
        isParsed: true,
        isRanked: false,
      }).limit(rankPerMinute);
      await invokeLambda('rankResultSets', toRank);
    }
    return APIResponse({ data: 'started scripts execution successfully' });
  } catch (err) {
    console.error(err);
    return InternalServerError;
  }
}

async function invokeLambda(fname, files) {
  const arn = `${process.env.ARN_PREFIX}-${fname}`;
  const invokePromises = [];
  for (const file of files) {
    let payload = JSON.stringify({ fileId: file._id.toHexString() });
    console.log(`Invoking ${fname} with fileId ${file._id}`);
    const invokePromise = lambda.invoke({ InvocationType: 'Event', FunctionName: arn, Payload: payload }).promise();
    invokePromises.push(invokePromise);
  }
  return Promise.all(invokePromises);
}

module.exports = { executeScripts };
