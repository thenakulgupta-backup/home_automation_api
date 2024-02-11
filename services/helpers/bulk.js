async function bulkInsertAll(docs, Model) {
    let toInsert = [];
    let inserted = [];
    for (let i = 0; i < docs.length; i++) {
        toInsert.push(docs[i]);
        const isLastItem = i === docs.length - 1;
        if (i % 500 === 0 || isLastItem) {
            try {
                inserted = inserted.concat(await bulkInsert(toInsert, Model));
            }
            catch (err) {
                console.error(err);
            }
            toInsert = [];
        }
    }
    return inserted;
}

function bulkInsert(docs, Model) {
    return new Promise((res, rej) => {
        Model.bulkCreate(docs, { ignoreDuplicates: true })
            .then(() => {
                res(docs);
            })
            .catch((err) => {
                if (err.name === 'SequelizeUniqueConstraintError') {
                    res(docs);
                } else {
                    rej(err);
                }
            });
    });
}

module.exports = {
    bulkInsertAll: bulkInsertAll,
    bulkInsert: bulkInsert,
}