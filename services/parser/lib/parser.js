const moment = require('moment');
const { Institution } = require('../../interfaces/institution');
const { RegexpStore } = require('./RegexpStore');

const numberWordMap = {
    'first': 1,
    'second': 2,
    'third': 3,
    'fourth': 4,
    'fifth': 5,
    'sixth': 6,
    'seventh': 7,
    'eight': 8,
    'eighth': 8,
    'ninth': 7,
    'tenth': 10
};

const subjects = {};
const institutions = {};
const programmes = {};
const paperCodePaperIdMap = {};

function parsePage(content) {
    let resultPageType = getResultPageType(content);
    if (resultPageType == 'result') {
        const { institution, programme, results, students, pageNumber } = parseResultPage(content);
        institutions[institution.code] = institution;
        programmes[programme.code] = programme;
        return { results, students, pageNumber };
    } else if (resultPageType == 'result2') {
        const { institution, programme, results, students, pageNumber } = parseResultPage2(content);
        institutions[institution.code] = institution;
        programmes[programme.code] = programme;
        return { results, students, pageNumber };
    } else if (resultPageType == 'scheme') {
        const { institution, programme, subjects: parsedSubjects, pageNumber } = parseSchemePage(content);
        const schemeIds = Object.keys(parsedSubjects);
        for (let schemeId of schemeIds) {
            if (!subjects[schemeId]) {
                subjects[schemeId] = {};
            }
            let paperIds = Object.keys(parsedSubjects[schemeId]);
            for (let paperId of paperIds) {
                if (!subjects[schemeId][paperId]) {
                    subjects[schemeId][paperId] = parsedSubjects[schemeId][paperId];
                }
            }
        }
        institutions[institution.code] = institution;
        programmes[programme.code] = programme;
        return {
            results: [],
            students: [],
            pageNumber
        };
    }
}

function getResultPageType(pageStr) {
    if (/Result of Programme Code/i.test(pageStr)) {
        return 'result';
    } else if (/Scheme of Programme Code/i.test(pageStr)) {
        return 'scheme';
    } else if (/Sem.\/Annual/i.test(pageStr)) {
        return 'scheme';
    } else if (/CS\/Remarks/i.test(pageStr)) {
        return 'result2';
    } else {
        return 'invalid';
    }
}

function parseContent(content) {
    const resultPagesArr = content.split(/\(SCHEME OF EXAMINATIONS\)|RESULT TABULATION SHEET|Result Prepration Date : .+/).filter(s => s);
    const pages = [];
    for (let resultPage of resultPagesArr) {
        const parsedPage = parsePage(resultPage);
        if (parsedPage) {
            pages.push(parsedPage);
        }
    }
    return {
        pages,
        subjects,
        institutions,
        programmes
    };
}

function parseDateMatch(match) {
    if (match && match[1]) {
        return moment(match[1], 'DD/MM/YYYY').toDate();
    } else {
        return new Date();
    }
}

function parseSemYear(semYear) {
    let [num, type] = semYear.split(' ');
    return {
        num: Number(num) || numberWordMap[num.toLowerCase()],
        type: /sem/i.test(type) ? 'sem' : 'year'
    };
}

function parseDeclaredDate(content) {
    return parseDateMatch(content.match(RegexpStore.declaredDate));
}

function parsePreparedDate(content) {
    return parseDateMatch(content.match(RegexpStore.preparedDate));
}

function parseInstitution(content) {
    const institutionMatch = content.match(RegexpStore.institution);
    return {
        code: institutionMatch[1],
        name: institutionMatch[2].replace(/ cs\/remarks/i, '')
    };
}

function parseSchemeProgramme(content) {
    const programmeMatch = content.match(RegexpStore.programme.scheme);
    return {
        schemeId: programmeMatch[3],
        semYear: parseSemYear(programmeMatch[4]),
        programme: {
            name: programmeMatch[2],
            code: programmeMatch[1]
        }
    };
}

function parsePageNumber(content) {
    const pageNumberMatch = content.match(RegexpStore.pageNumber);
    return Number(pageNumberMatch[1]);
}

function parseSubjects(content, schemeId) {
    let subjectsMatch;
    const subjects = {};
    while (subjectsMatch = RegexpStore.subjects.exec(content)) {
        const paperId = subjectsMatch[1];
        const paperCode = subjectsMatch[2];
        const subject = {
            paperId,
            paperCode,
            name: subjectsMatch[3],
            credits: subjectsMatch[4],
            type: subjectsMatch[5],
            exam: subjectsMatch[6],
            mode: subjectsMatch[7],
            kind: subjectsMatch[8],
            minor: Number(subjectsMatch[9]),
            major: Number(subjectsMatch[10]),
            maxMarks: Number(subjectsMatch[11]),
            passMarks: Number(subjectsMatch[12]),
            schemeId
        };
        if (isNaN(subject.minor)) {
            subject.minor = undefined;
        }
        if (isNaN(subject.major)) {
            subject.major = undefined;
        }
        if (!subjects[schemeId]) {
            subjects[schemeId] = {};
        }
        subjects[schemeId][paperId] = subject;
        paperCodePaperIdMap[paperCode] = paperId;
    }
    return subjects;
}

function parseResultProgramme(content) {
    let programmeMatch = content.match(RegexpStore.programme.result);
    if (!programmeMatch) {
        programmeMatch = content.match(RegexpStore.programme2.result);
    }
    return {
        programme: {
            name: programmeMatch[2],
            code: programmeMatch[1]
        },
        semYear: parseSemYear(programmeMatch[3]),
        batch: programmeMatch[4],
        examination: parseExam(programmeMatch[5])
    };
}

function parseExam(examString) {
    const match = examString.match(RegexpStore.exam);
    const date = moment(match[2], 'MMM, YYYY').toDate();
    const splitted = match[1].split(' ');
    const regularReappear = splitted.shift().toLowerCase();
    const special = splitted.join(' ').trim() || undefined;
    return {
        date,
        regularReappear,
        special
    };
}

function parsePaperId(paperIdStr) {
    const paperIdMatch = paperIdStr.match(RegexpStore.paperId);
    return {
        paperId: paperIdMatch[1],
        credits: Number(paperIdMatch[2])
    };
}

function parseNumCredits(creditsStr) {
    const creditsMatch = creditsStr.match(RegexpStore.numCredits);
    return Number(creditsMatch[1]);
}

function parseMajorMinorMarks(majorMinorStr) {
    const majorMinorMatch = majorMinorStr.match(RegexpStore.majorMinor);
    return {
        major: parseMarksString(majorMinorMatch[2]),
        minor: parseMarksString(majorMinorMatch[1])
    };
}

function parseTotalMarks(totalMarksStr) {
    const totalMarksMatch = totalMarksStr.match(RegexpStore.totalMarks);
    if (totalMarksMatch) {
        return {
            totalMarks: parseMarksString(totalMarksMatch[1]),
            grade: totalMarksMatch[2]
        };
    } else {
        return {
            totalMarks: parseMarksString(totalMarksStr)
        };
    }
}

function parseMarksString(marksStr) {
    let score = Number(marksStr.trim());
    let isSpecial = false;
    let specialString;
    if (isNaN(score)) {
        isSpecial = true;
        score = 0;
        specialString = marksStr;
    }
    return {
        score,
        isSpecial,
        specialString
    };
}

module.exports = {
    parseContent
};
