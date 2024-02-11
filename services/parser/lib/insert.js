const { Connection, model, Types } = require("mongoose");
const { bulkInsertAll } = require("../../helpers/bulk");

function prepareForInsert({ pages, conn, takenFrom, subjectsMap, institutionsMap, programmesMap }) {
    const InstitutionModel = conn.model("Institution");
    const ProgrammeModel = conn.model("Programme");
    const StudentModel = conn.model("Student");
    const ResultSetModel = conn.model("ResultSet");
    const SubjectModel = conn.model("Subject");
    const institutions = [];
    const programmes = [];
    const students = [];
    const results = [];
    const subjects = [];

    for (let schemeId of Object.keys(subjectsMap)) {
        for (let paperId of Object.keys(subjectsMap[schemeId])) {
            let subject = new SubjectModel(subjectsMap[schemeId][paperId]);
            subject.takenFrom = takenFrom;
            subjects.push(subject);
        }
    }

    for (let code of Object.keys(institutionsMap)) {
        const institution = new InstitutionModel(institutionsMap[code]);
        institution.takenFrom = takenFrom;
        institutions.push(institution);
    }

    for (let code of Object.keys(programmesMap)) {
        const programme = new ProgrammeModel(programmesMap[code]);
        programme.takenFrom = takenFrom;
        programmes.push(programme);
    }

    for (const page of pages) {
        for (let student of page.students) {
            let modelledStudent = new StudentModel(student);
            modelledStudent.takenFrom = takenFrom;
            students.push(modelledStudent);
        }
        for (let result of page.results) {
            let modelledResult = new ResultSetModel(result);
            modelledResult.takenFrom = takenFrom;
            let rollNumberMatch = result.rollNumber.match(/\d{3,3}(\d{3,3})(\d{3,3})\d{2,2}/);
            modelledResult.institutionCode = rollNumberMatch[1];
            modelledResult.programmeCode = rollNumberMatch[2];
            results.push(modelledResult);
        }
    }
    return {
        data: {
            institutions,
            programmes,
            students,
            results,
            subjects,
        },
        models: {
            InstitutionModel,
            ProgrammeModel,
            ResultSetModel,
            StudentModel,
            SubjectModel,
        },
    };
}

async function insertAllData(prepared) {
    const { models, data } = prepared;
    let { InstitutionModel, StudentModel, ResultSetModel, ProgrammeModel, SubjectModel } = models;
    let { institutions, programmes, results, students, subjects } = data;
    let toThrow;
    try {
        console.log("Inserting institutions");
        institutions = await bulkInsertAll(institutions, InstitutionModel);
        console.log("Inserted institutions");
    } catch (err) {
        toThrow = err;
    }
    try {
        console.log("Inserting programmes");
        programmes = await bulkInsertAll(programmes, ProgrammeModel);
        console.log("Inserted programmes");
    } catch (err) {
        toThrow = err;
    }
    try {
        console.log("Inserting subjects");
        subjects = await bulkInsertAll(subjects, SubjectModel);
        console.log("Inserted subjects");
    } catch (err) {
        toThrow = err;
    }
    try {
        console.log("Inserting students");
        students = await bulkInsertAll(students, StudentModel);
        console.log("Inserted students");
    } catch (err) {
        toThrow = err;
    }
    try {
        console.log("Inserting results");
        results = await bulkInsertAll(results, ResultSetModel);
        console.log("Inserted results");
    } catch (err) {
        toThrow = err;
    }
}

module.exports = { prepareForInsert, insertAllData };
