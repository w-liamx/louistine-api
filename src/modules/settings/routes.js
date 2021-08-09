"use strict";

import express from "express";
import { resizePhotos, uploadFiles } from "../../middleware/file";
import {
  create,
  index,
  setLocals,
  update,
  view,
} from "./controllers/pageSettings";

const pageSettingsRouter = express.Router();

pageSettingsRouter.post("/", [setLocals, uploadFiles, resizePhotos, create]);
pageSettingsRouter.post("/:id", update);
pageSettingsRouter.get("/", index);
pageSettingsRouter.get("/:id", view);

export default pageSettingsRouter;
