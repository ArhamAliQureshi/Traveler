const orientDB = require('./orientDB');

module.exports = {
    createClient: async function (type, connectionURL) {
        let client;
        switch (type) {
            case 'orientDB':
                client = await orientDB();
                break;
        }
        return client;
    }
};