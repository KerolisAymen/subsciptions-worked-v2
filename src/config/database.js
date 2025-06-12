const { DataSource } = require("typeorm");
const path = require("path");
require("dotenv").config();

const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  synchronize: false, // Changed from true to false
  logging: process.env.NODE_ENV === "development",
  entities: [path.join(__dirname, "../models/*.js")],
  migrations: [path.join(__dirname, "../migrations/*.js")],
  subscribers: [path.join(__dirname, "../subscribers/*.js")],
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = AppDataSource;
