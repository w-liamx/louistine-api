"use strict";

const { Model } = require("sequelize");
import Joi from "joi";

import { joiValidate } from "../../../wrappers/joi.js";

module.exports = (sequelize, DataTypes) => {
  class ProductCategory extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // ProductCategory.hasMany(models.Product, {
      //   as: "products",
      // });
    }
  }

  ProductCategory.init(
    {
      name: {
        allowNull: false,
        unique: "slug",
        type: DataTypes.STRING,
      },
    },
    {
      sequelize,
      modelName: "ProductCategory",
      paranoid: true, //allow soft delete
      timestamps: true,
    }
  );

  ProductCategory.validatePostData = async function (req, excludeId) {
    const schema = Joi.object({
      name: Joi.string().required().max(255),
    });

    let validate = joiValidate(schema, req, true);
    return validate;
  };

  return ProductCategory;
};
