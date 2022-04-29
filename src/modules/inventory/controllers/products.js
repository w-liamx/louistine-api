import { responseObject } from "../../../helpers/utils";
import db from "../../../databases/sequelize";
import {
  getPaginatedRecordList,
  getRecord,
  createRecord,
  updateRecord,
} from "../../../wrappers/sequelize.js";
import _ from "lodash";

const { Product } = db;

export const allProducts = async (req, res) => {
  let { rCode, rState, rData, rMessage } = await getPaginatedRecordList(
    Product,
    req
  );

  return responseObject(res, rCode, rState, rData, rMessage);
};

export const viewProduct = async (req, res) => {
  const { id } = req.params;

  let fetchBy = "id",
    fetchId = id;

  // let associations = [
  //   {
  //     model: Template,
  //     as: "template",
  //     attributes: ["id", "collectionId", "key", "title"],
  //   },
  //   {
  //     model: TemplateCategory,
  //     as: "category",
  //     attributes: ["id", "key", "title"],
  //   },
  // ];

  // const extra = { properties, whereExtra, associations };

  let { rCode, rState, rData, rMessage } = await getRecord(
    Product,
    fetchId,
    fetchBy
    // extra
  );

  return responseObject(res, rCode, rState, rData, rMessage);
};

export const addProduct = async (req, res) => {
  //   validate payload
  // const validate = await Product.validatePostData(req);
  // if (validate !== true) {
  //   const { rCode, rState, rMessage } = validate;
  //   return responseObject(res, rCode, rState, null, rMessage);
  // }

  const data = _.pick(req.body, [
    "collectionId",
    "productName",
    "price",
    "description",
    "size",
    "colour",
  ]);

  //append uploaded images (from resizePhotos() middleware) to data
  const { uploadedFiles } = res.locals;
  if (!_.isEmpty(uploadedFiles)) {
    data.images = uploadedFiles;
  }

  const { rCode, rState, rData, rMessage } = await createRecord(Product, data);

  return responseObject(res, rCode, rState, rData, rMessage);
};

export const updateProduct = async (req, res) => {
  const { id } = req.params;

  let data = _.pick(req.body, [
    "collectionId",
    "productName",
    "price",
    "description",
    "size",
    "colour",
  ]);

  let { rCode, rState, rData, rMessage } = await updateRecord(
    Product,
    id,
    "id",
    data
  );

  return responseObject(res, rCode, rState, rData, rMessage);
};

export const setLocals = async (req, res, next) => {
  let images = {};

  res.locals.Model = Product;
  res.locals.entity = "Product";

  //used for uploads
  res.locals.uploadConfig = {
    storage: "memory",
    uploadType: "multiField",
    uploadFolder: `images/products/`,
    uploadSubFolderKey: "productName",
    fileSize: 1024 * 2, //2MB
    allowedMimeTypes: ["image/jpg", "image/jpeg", "image/png"],
    withTextValidation: true,
    uploadFields: [
      //wedding
      { name: "thumbnail", maxCount: 1 },
      { name: "productImages", maxCount: 5 },
    ],
  };
  //for image resizing
  res.locals.resizeConfig = {
    width: 1200,
    height: "auto",
    minSizeForResize: 1024,
  };
  res.locals.savedFiles = images;

  return next();
};
