require('dotenv').config();
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const cron = require("node-cron");
const router = require("./router/index.js");
const projectRouter = require("./router/projectRouter.js");
const contestRouter = require("./router/contestRouter.js");
const errorMiddleware = require("./middlewares/error-middleware");
const contestService = require("./service/contest-service");

const PORT = process.env.PORT || 5000;
const SERVER_HOST = process.env.SERVER_HOST || "localhost";
const app = express();


app.use(express.json({
  limit: '50mb'
}));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());
app.use(cors({
  credentials: true,
  origin: true // 172.20.10.13.3000 and all
}));
app.use('/api', router);
app.use('/api/projects', projectRouter);
app.use('/api/contests', contestRouter);
app.use(errorMiddleware);

const start = async () => {
  try {
    await  mongoose.connect(process.env.MONGODB_URI,{
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    try {
      await contestService.ensureWeek();
    } catch (e) {
      console.error("Contest week init:", e.message);
    }
    cron.schedule(
      process.env.CONTEST_CRON || "5 4 * * 1",
      async () => {
        try {
          await contestService.runMondayJob();
        } catch (e) {
          console.error("Contest cron:", e.message);
        }
      },
      { timezone: process.env.CONTEST_CRON_TZ || "UTC" }
    );
    app.listen(PORT,SERVER_HOST, () => console.log("Сервер запущен на http://localhost:5000"));
  }
  catch(err){
    console.log(err);
  }
}

start()
