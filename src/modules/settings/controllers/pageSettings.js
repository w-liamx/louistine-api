import { responseObject } from "../../../helpers/utils";
import db from "../../../databases/sequelize";
import {
  getPaginatedRecordList,
  getRecord,
  createRecord,
  updateRecord,
} from "../../../wrappers/sequelize.js";
import _ from "lodash";

const { PageSetting } = db;

export const index = async (req, res) => {
  let { rCode, rState, rData, rMessage } = await getPaginatedRecordList(
    PageSetting,
    req
  );

  return responseObject(res, rCode, rState, rData, rMessage);
};

export const view = async (req, res) => {
  const { id } = req.params;

  let fetchBy = "id",
    fetchId = id;

  // let associations = [
  //   {
  //     model: Template,
  //     as: "template",
  //     attributes: ["id", "categoryId", "key", "title"],
  //   },
  //   {
  //     model: TemplateCategory,
  //     as: "category",
  //     attributes: ["id", "key", "title"],
  //   },
  // ];

  // const extra = { properties, whereExtra, associations };

  let { rCode, rState, rData, rMessage } = await getRecord(
    PageSetting,
    fetchId,
    fetchBy
    // extra
  );

  return responseObject(res, rCode, rState, rData, rMessage);
};

export const create = async (req, res) => {
  const data = _.pick(req.body, ["pageName", "settings"]);

  //append uploaded images (from resizePhotos() middleware) to data
  const { uploadedFiles } = res.locals;
  if (!_.isEmpty(uploadedFiles)) {
    data.images = uploadedFiles;
  }

  const { rCode, rState, rData, rMessage } = await createRecord(
    PageSetting,
    data
  );

  return responseObject(res, rCode, rState, rData, rMessage);
};

export const update = async (req, res) => {
  const { id } = req.params;

  let data = _.pick(req.body, ["pageName", "settings"]);

  let { rCode, rState, rData, rMessage } = await updateRecord(
    PageSetting,
    id,
    "id",
    data
  );

  return responseObject(res, rCode, rState, rData, rMessage);
};

export const setLocals = async (req, res, next) => {
  let images = {};

  res.locals.Model = PageSetting;
  res.locals.entity = "PageSetting";

  //used for uploads
  res.locals.uploadConfig = {
    storage: "memory",
    uploadType: "multiField",
    uploadFolder: `images/pageSettings/`,
    uploadSubFolderKey: "pageName",
    fileSize: 1024 * 2, //2MB
    allowedMimeTypes: ["image/jpg", "image/jpeg", "image/png"],
    withTextValidation: true,
    uploadFields: [
      { name: "aboutHeaderImage", maxCount: 1 },
      { name: "aboutContentImage", maxCount: 1 },
      { name: "homeCarousel", maxCount: 5 },
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
