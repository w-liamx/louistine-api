"use strict";

const { Model } = require("sequelize");
import Joi from "joi";

import { joiValidate } from "../../../wrappers/joi.js";

module.exports = (sequelize, DataTypes) => {
  class Collection extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Collection.hasMany(models.Product, {
      //   as: "products",
      // });
    }
  }

  Collection.init(
    {
      name: {
        allowNull: false,
        unique: true,
        type: DataTypes.STRING,
      },
      title: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      image: {
        allowNull: true,
        type: DataTypes.STRING,
      },
    },
    {
      sequelize,
      modelName: "Collection",
      timestamps: true,
    }
  );

  Collection.validatePostData = async function (req, excludeId) {
    const schema = Joi.object({
      name: Joi.string().required().max(255),
      title: Joi.string().required().max(255),
    });

    let validate = joiValidate(schema, req, true);
    return validate;
  };

  return Collection;
};
