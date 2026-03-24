require('dotenv').config();
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const router = require("./router/index.js");
const projectRouter = require("./router/projectRouter.js");
const errorMiddleware = require("./middlewares/error-middleware");

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
app.use(errorMiddleware);

const start = async () => {
  try {
    await  mongoose.connect(process.env.MONGODB_URI,{
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    app.listen(PORT,SERVER_HOST, () => console.log("Сервер запущен на http://localhost:5000"));
  }
  catch(err){
    console.log(err);
  }
}

start()
