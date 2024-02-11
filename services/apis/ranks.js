const { ObjectId } = require('bson');
const { APIResponse, InternalServerError } = require('../helpers/response');
const { connectToDB } = require('../config/db');

let conn;

/**
 * calculate institution and university ranks
 * @param event
 * @param context
 */
async function getRanks(event, context) {
    context.callbackWaitsForEmptyEventLoop = true;
    try {
        conn = await connectToDB(conn);
        const rankType = event.pathParameters['type'];
        const takenFrom = event.queryStringParameters['fileId'];
        const batch = event.queryStringParameters['batch'];
        const institutionCode = event.queryStringParameters['institutionCode'];
        const limit = Number(event.queryStringParameters['limit']) || 20;
        if (limit > 50) {
            return APIResponse({
                message: "limit can't exceed 50",
                statusCode: 400,
            });
        }
        const offset = Number(event.queryStringParameters['offset']) || 0;
        let institutionCodes;
        const SemesterRankModel = conn.model('SemesterRank');
        let query = {
            takenFrom: new ObjectId(takenFrom),
            $or: [
                {
                    batch,
                },
                {
                    batch: null,
                },
            ],
        };
        let sortFactor = { universityRank: 1 };
        if (rankType === 'institution') {
            sortFactor = { collegeRank: 1 };
            const InstitutionModel = conn.model('Institution');
            if (institutionCode) {
                const institution = await InstitutionModel.findOne({ code: institutionCode });
                if (!institution) {
                    return APIResponse({
                        message: 'Institution not found',
                        statusCode: 404,
                    });
                }
                const institutions = await InstitutionModel.find({ name: institution.name });
                institutionCodes = institutions.map((institution) => institution.code);
                query['institution.code'] = {
                    $in: institutionCodes,
                };
            } else {
                return APIResponse({
                    statusCode: 400,
                    message: 'insititutionCode is required for type institution',
                });
            }
        } else if (rankType !== 'university') {
            return APIResponse({
                message: 'Invalid type',
                statusCode: 400,
            });
        }
        if (!takenFrom) {
            return APIResponse({
                message: 'fileId is required',
                statusCode: 400,
            });
        }
        const semesterRanks = await SemesterRankModel.find(query).sort(sortFactor).skip(offset).limit(limit);
        const rankList = semesterRanks.map((semesterRank) => ({
            id: semesterRank._id,
            name: semesterRank.name,
            rollNumber: semesterRank.rollNumber,
            marks: semesterRank.marks,
            institution: {
                name: semesterRank.institution.name,
                code: semesterRank.institution.code,
            },
            collegeRank: semesterRank.collegeRank,
            universityRank: semesterRank.universityRank,
        }));
        return APIResponse({
            data: rankList,
        });
    } catch (err) {
        console.error(err);
        return InternalServerError;
    }
}

module.exports = {
    getRanks,
};
