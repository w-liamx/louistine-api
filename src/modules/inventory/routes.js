"use strict";

import express from "express";
import { resizePhotos, uploadFiles } from "../../middleware/file";
import { create, index, update, view } from "./controllers/productCategories";
import {
  addProduct,
  allProducts,
  setLocals,
  updateProduct,
  viewProduct,
} from "./controllers/products";

const inventoryRouter = express.Router();

inventoryRouter.post("/categories", create);
inventoryRouter.post("/categories/:id", update);
inventoryRouter.get("/categories", index);
inventoryRouter.get("/categories/:id", view);

inventoryRouter.post("/", [setLocals, uploadFiles, resizePhotos, addProduct]);
inventoryRouter.post("/:id", updateProduct);
inventoryRouter.get("/", allProducts);
inventoryRouter.get("/:id", viewProduct);

export default inventoryRouter;
