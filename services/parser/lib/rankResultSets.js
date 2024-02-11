const AWS = require('aws-sdk');
const { connectToDB } = require('../../config/db');
const { APIResponse, InternalServerError } = require('../../helpers/response');
const { ObjectId } = require('bson');
const { bulkInsertAll } = require('../../helpers/bulk');

let conn;

/**
 * Lambda to assign ranks to all eligible result sets in a result file
 * @param event 
 * @param context 
 */
exports.rankResultSets = async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false;
    try {
        const fileId = event.fileId;
        conn = await connectToDB(conn);
        const ResultFile = conn.model('ResultFile');
        let resultFile = await ResultFile.findById(fileId);
        if (!resultFile) {
            return APIResponse({ message: 'not found', statusCode: 404 });
        }
        const ResultSetModel = conn.model('ResultSet');
        console.log(`ranking ${fileId}`);
        let scores = await aggregateSemesterScores({ ResultSetModel, takenFrom: new ObjectId(fileId) });
        let SemesterRankModel = conn.model('SemesterRank');
        let semesterRanks = [];
        let batchScoresMap = {};
        for (let score of scores) {
            let batch = '20' + score.rollNumber.match(/\d{9,9}(\d{2,2})/)[1];
            if (!batchScoresMap[batch]) {
                batchScoresMap[batch] = [];
            }
            batchScoresMap[batch].push(score);
        }
        for (let batch of Object.keys(batchScoresMap)) {
            let batchScores = batchScoresMap[batch];
            let universityRank = 1,
                prevMarks;
            let institutionNameScoresMap = {};
            for (let i = 0; i < batchScores.length; i++) {
                let batchScore = batchScores[i];
                if (i != 0 && prevMarks != batchScore.marks) {
                    universityRank++;
                }
                prevMarks = batchScore.marks;
                batchScore.universityRank = universityRank;
                if (!institutionNameScoresMap[batchScore.institution.name]) {
                    institutionNameScoresMap[batchScore.institution.name] = [];
                }
                institutionNameScoresMap[batchScore.institution.name].push(batchScore);
            }
            for (let institutionName of Object.keys(institutionNameScoresMap)) {
                let institutionScores = institutionNameScoresMap[institutionName];
                institutionScores.sort((a, b) => b.marks - a.marks);
                prevMarks = undefined
                let collegeRank = 1;
                for (let i = 0; i < institutionScores.length; i++) {
                    let institutionScore = institutionScores[i];
                    if (i != 0 && prevMarks != institutionScore.marks) {
                        collegeRank++;
                    }
                    prevMarks = institutionScore.marks;
                    semesterRanks.push(new SemesterRankModel({
                        rollNumber: institutionScore.rollNumber,
                        marks: institutionScore.marks,
                        takenFrom: institutionScore.takenFrom,
                        name: institutionScore.name,
                        institution: institutionScore.institution,
                        universityRank: institutionScore.universityRank,
                        collegeRank,
                        batch
                    }));
                }
            }
        }

        try {
            await bulkInsertAll(semesterRanks, SemesterRankModel);
        } catch (err) {
            resultFile.toSkip = true;
            await resultFile.save();
            throw err;
        }
        resultFile.isRanked = true;
        await resultFile.save();
        return APIResponse({
            message: `ranked ${fileId}`
        });
    } catch (err) {
        console.error(err);
        return InternalServerError;
    }
};

async function aggregateSemesterScores({ ResultSetModel, takenFrom }) {
    return ResultSetModel.aggregate([
        {
            '$match': {
                'exam.regularReappear': 'regular',
                'takenFrom': takenFrom
            }
        }, {
            '$unwind': {
                'path': '$subjects'
            }
        }, {
            '$group': {
                '_id': '$rollNumber',
                'marks': {
                    '$sum': '$subjects.totalMarks.score'
                },
                'takenFrom': {
                    '$first': '$takenFrom'
                },
                'institutionCode': {
                    '$first': '$institutionCode'
                }
            }
        }, {
            '$lookup': {
                'from': 'students',
                'localField': '_id',
                'foreignField': 'rollNumber',
                'as': 'students'
            }
        }, {
            '$lookup': {
                'from': 'institutions',
                'localField': 'institutionCode',
                'foreignField': 'code',
                'as': 'institutions'
            }
        }, {
            '$project': {
                'marks': 1,
                'takenFrom': '$takenFrom',
                'name': {
                    '$arrayElemAt': [
                        {
                            '$map': {
                                'input': '$students',
                                'as': 'student',
                                'in': '$$student.name'
                            }
                        }, 0
                    ]
                },
                'institution': {
                    'code': '$institutionCode',
                    'name': {
                        '$arrayElemAt': [
                            {
                                '$map': {
                                    'input': '$institutions',
                                    'as': 'institution',
                                    'in': '$$institution.name'
                                }
                            }, 0
                        ]
                    }
                },
                'rollNumber': '$_id',
                '_id': 0
            }
        }, {
            '$sort': {
                'marks': -1
            }
        }
    ]).allowDiskUse(true);
}
