"use strict";

const { Model } = require("sequelize");
import Joi from "joi";

import { joiValidate } from "../../../wrappers/joi.js";

module.exports = (sequelize, DataTypes) => {
  class Measurement extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {}
  }

  Measurement.init(
    {
      customerName: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      customerPhone: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      customerEmail: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      neck: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      shoulderLength: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      armLength: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      chest: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      belly: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      waist: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      hips: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      trouserLength: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      roundArm: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      roundThigh: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      knee: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      cuff: {
        allowNull: false,
        type: DataTypes.STRING,
      },
    },
    {
      sequelize,
      modelName: "Measurement",
      paranoid: true, //allow soft delete
      timestamps: true,
    }
  );

  Measurement.validatePostData = async function (req, excludeId) {
    const schema = Joi.object({
      customerName: Joi.string().required().max(255),
      customerPhone: Joi.string().required().max(255),
      customerEmail: Joi.string().required().max(255),
      neck: Joi.string().required().max(255),
      shoulderLength: Joi.string().required().max(255),
      armLength: Joi.string().required().max(255),
      chest: Joi.string().required().max(255),
      belly: Joi.string().required().max(255),
      waist: Joi.string().required().max(255),
      hips: Joi.string().required().max(255),
      trouserLength: Joi.string().required().max(255),
      roundArm: Joi.string().required().max(255),
      roundThigh: Joi.string().required().max(255),
      knee: Joi.string().required().max(255),
      cuff: Joi.string().required().max(255),
    });

    let validate = joiValidate(schema, req, true);
    return validate;
  };

  return Measurement;
};
