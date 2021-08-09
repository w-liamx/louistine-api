"use strict";

const { exec } = require("child_process");
const glob = require("glob");
const path = require("path");
const { Sequelize, Op } = require("sequelize");
const env = process.env.NODE_ENV || "development";
const config = require(__dirname + "/../config/db.js")[env];

const db = {};
let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    config
  );
}

//IIFE to test connection
(async () => {
  try {
    await sequelize.authenticate();
    console.log(
      `Successfully connected to database ${config.database} at ${config.username}@${config.host}`
    );
    if (process.env.NODE_ENV === "production") {
      //sync models
      //Note: only uncomment when needed! Pass 'true' as argument to run a fresh sync
      syncModels(true);
    }
  } catch (error) {
    console.error("Could not establish database connection:", error);
  }
})();

/**
 * Synchronize models
 * @param {boolean} fresh - if true, will run sync and seed tables, otherwise it will just run sync
 */
const syncModels = async (fresh = false) => {
  try {
    if (fresh) {
      //sync tables
      await sequelize.sync({ force: true });
      console.log("All models were synchronized successfully.");
      //navigate to root and seed tables
      const root = path.join(__dirname, "../../");
      exec(
        "npx sequelize-cli db:seed:all",
        { cwd: root },
        (error, stdout, stderr) => {
          //do xyz...
          if (error) throw error;
          console.log("Seeds run successfully!");
        }
      );
    } else {
      await sequelize.sync({ alter: true });
      console.log("All models were synchronized successfully.");
    }
  } catch (error) {
    console.error("Database sync failed:", error);
  }
};

glob.sync(__dirname + "/../modules/*/models/*.js").forEach((file) => {
  // console.log(file);
  //require model file and push name to db object
  const Model = require(file);
  if (typeof Model === "function") {
    const mdl = require(file)(sequelize, Sequelize.DataTypes);
    db[mdl.name] = mdl;
  }
});

//associations
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;
db.Op = Op;

module.exports = db;
