import path from "path";
import { Sequelize } from "sequelize";

const dbPath = path.resolve("data", "microblog.sqlite");
export const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: dbPath,
});