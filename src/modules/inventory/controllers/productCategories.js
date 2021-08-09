import { responseObject } from "../../../helpers/utils";
import db from "../../../databases/sequelize";
import {
  getPaginatedRecordList,
  getRecord,
  createRecord,
  updateRecord,
  trashOrDeleteRecord,
  restoreRecord,
  verifyOwnership,
  getFullTextSearchFields,
} from "../../../wrappers/sequelize.js";
import _ from "lodash";

const { ProductCategory } = db;

export const index = async (req, res) => {
  let { rCode, rState, rData, rMessage } = await getPaginatedRecordList(
    ProductCategory,
    req
  );

  return responseObject(res, rCode, rState, rData, rMessage);
};

export const view = async (req, res) => {
  const { id } = req.params;
  const { isFromWeb = false } = res.locals;
  const { properties = "" } = req.query;

  const whereExtra = res.locals.whereExtra ?? [];

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
    ProductCategory,
    fetchId,
    fetchBy
    // extra
  );

  return responseObject(res, rCode, rState, rData, rMessage);
};

export const create = async (req, res) => {
  //   validate payload
  const validate = await ProductCategory.validatePostData(req);
  if (validate !== true) {
    const { rCode, rState, rMessage } = validate;
    return responseObject(res, rCode, rState, null, rMessage);
  }

  const data = _.pick(req.body, ["name"]);

  const { rCode, rState, rData, rMessage } = await createRecord(
    ProductCategory,
    data
  );

  return responseObject(res, rCode, rState, rData, rMessage);
};

export const update = async (req, res) => {
  const { id } = req.params;

  let data = _.pick(req.body, ["name"]);

  let { rCode, rState, rData, rMessage } = await updateRecord(
    ProductCategory,
    id,
    "id",
    data
  );

  return responseObject(res, rCode, rState, rData, rMessage);
};
