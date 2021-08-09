import createError from "http-errors";
import express from "express";
import cookieParser from "cookie-parser";
import logger from "morgan";
import cors from "cors";
import appRoutes from "../routes";
import path from "path";

export default ({ app }) => {
  app.use(cors());
  app.use(logger("dev"));
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());
  app.use(express.static(path.join(__dirname, "../../public")));
  // app.use("/public", express.static(path.resolve(__dirname, "../../public")));
  // Routes go in here
  /**
   * Health Check endpoints
   * Check if app was loaded correctly
   */
  app.get("/status", (req, res) => {
    res.status(200).send("Welcome to Louistine.Ng");
  });
  app.head("/status", (req, res) => {
    res.status(200).end();
  });

  appRoutes(app);

  app.get("*", (req, res) => {
    res.status(404).send("Route Not Found!");
  });

  //allow IP to be read from req object
  app.set("trust proxy", true);

  // catch 404 and forward to error handler
  app.use(function (req, res, next) {
    next(createError(404));
  });

  // error handler
  app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render("error");
  });
};

const corsConfig = {
  origin: ["*"],
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  optionsSuccessStatus: 200,
};
