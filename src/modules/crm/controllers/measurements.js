import { responseObject } from "../../../helpers/utils";
import db from "../../../databases/sequelize";
import {
  getPaginatedRecordList,
  getRecord,
  createRecord,
  updateRecord,
} from "../../../wrappers/sequelize.js";
import _ from "lodash";

const { Measurement } = db;

export const allMeasurements = async (req, res) => {
  let { rCode, rState, rData, rMessage } = await getPaginatedRecordList(
    Measurement,
    req
  );

  return responseObject(res, rCode, rState, rData, rMessage);
};

export const viewMeasurement = async (req, res) => {
  const { id } = req.params;

  let fetchBy = "id",
    fetchId = id;

  let { rCode, rState, rData, rMessage } = await getRecord(
    Measurement,
    fetchId,
    fetchBy
  );

  return responseObject(res, rCode, rState, rData, rMessage);
};

export const addMeasurement = async (req, res) => {
  //   validate payload
  const validate = await Measurement.validatePostData(req);
  if (validate !== true) {
    const { rCode, rState, rMessage } = validate;
    return responseObject(res, rCode, rState, null, rMessage);
  }

  const data = _.pick(req.body, [
    "customerName",
    "customerPhone",
    "customerEmail",
    "neck",
    "shoulderLength",
    "armLength",
    "chest",
    "belly",
    "waist",
    "hips",
    "trouserLength",
    "roundArm",
    "roundThigh",
    "knee",
    "cuff",
  ]);

  const { rCode, rState, rData, rMessage } = await createRecord(
    Measurement,
    data
  );

  return responseObject(res, rCode, rState, rData, rMessage);
};

export const updateProduct = async (req, res) => {
  const { id } = req.params;

  let data = _.pick(req.body, [
    "customerName",
    "customerPhone",
    "customerEmail",
    "neck",
    "shoulderLength",
    "armLength",
    "chest",
    "belly",
    "waist",
    "hips",
    "trouserLength",
    "roundArm",
    "roundThigh",
    "knee",
    "cuff",
  ]);

  let { rCode, rState, rData, rMessage } = await updateRecord(
    Measurement,
    id,
    "id",
    data
  );

  return responseObject(res, rCode, rState, rData, rMessage);
};
