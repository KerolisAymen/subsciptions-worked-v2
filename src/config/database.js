const { DataSource } = require("typeorm");
require("dotenv").config();

const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  synchronize: false, // Changed from true to false
  logging: process.env.NODE_ENV === "development",
  entities: ["src/models/*.js"],
  migrations: ["src/migrations/*.js"],
  subscribers: ["src/subscribers/*.js"],
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = AppDataSource;
