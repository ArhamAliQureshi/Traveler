const Config = require('../configs/config.json').orientDB;
const OrientDBClient = require("orientjs").OrientDBClient;
var Connectors = {};

module.exports = async () => {
  try {
    Connectors.orientDB = Connectors.orientDB ? Connectors.orientDB : await OrientDBClient.connect(Config.url);
    let pool = await Connectors.orientDB.sessions(Config.credentials);
    let session = await pool.acquire();
    return {
      query: async (command) => {
        return await session.query(command).all();
      },
      command: async (command) => {
        return await session.command(command).all();
      },
      declareIntent: async (command) => {
        return await session.declareIntent(command).all();
      },
      close: async () => {
        await session.close();
        await pool.close();
        await Connectors.orientDB.close();
        Connectors.orientDB = undefined;
        console.log("Client closed");
        return true;
      }
    };
  }
  catch (e) {
    console.log(e);
  }

};