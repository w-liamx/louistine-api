import { responseObject } from "../../../helpers/utils";
import db from "../../../databases/sequelize";
import {
  getPaginatedRecordList,
  getRecord,
  createRecord,
  updateRecord,
} from "../../../wrappers/sequelize.js";
import _ from "lodash";

const { Order } = db;

export const index = async (req, res) => {
  let { rCode, rState, rData, rMessage } = await getPaginatedRecordList(
    Order,
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
    Order,
    fetchId,
    fetchBy
    // extra
  );

  return responseObject(res, rCode, rState, rData, rMessage);
};

export const create = async (req, res) => {
  //   validate payload
  const validate = await Order.validatePostData(req);
  if (validate !== true) {
    const { rCode, rState, rMessage } = validate;
    return responseObject(res, rCode, rState, null, rMessage);
  }

  const data = _.pick(req.body, ["productId", "quantity"]);

  const { rCode, rState, rData, rMessage } = await createRecord(Order, data);

  return responseObject(res, rCode, rState, rData, rMessage);
};

export const update = async (req, res) => {
  const { id } = req.params;

  let data = _.pick(req.body, ["productId", "quantity"]);

  let { rCode, rState, rData, rMessage } = await updateRecord(
    Order,
    id,
    "id",
    data
  );

  return responseObject(res, rCode, rState, rData, rMessage);
};
