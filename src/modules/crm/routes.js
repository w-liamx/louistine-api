"use strict";

import express from "express";
import {
  addMeasurement,
  allMeasurements,
  viewMeasurement,
} from "./controllers/measurements";

const crmRouter = express.Router();

crmRouter.post("/", addMeasurement);
// crmRouter.post("/:id", updateMeasurement);
crmRouter.get("/", allMeasurements);
crmRouter.get("/:id", viewMeasurement);

export default crmRouter;
