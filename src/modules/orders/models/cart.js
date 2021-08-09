"use strict";

const { Model } = require("sequelize");
import Joi from "joi";

import { joiValidate } from "../../../wrappers/joi.js";

module.exports = (sequelize, DataTypes) => {
  class Cart extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Cart.hasMany(models.Product, {
      //   as: "products",
      // });
    }
  }

  Cart.init(
    {
      userId: {
        allowNull: false,
        type: DataTypes.INTEGER,
      },
      productId: {
        allowNull: false,
        type: DataTypes.INTEGER,
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      metadata: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      ordered: {
        allowNull: false,
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      orderId: {
        allowNull: false,
        type: DataTypes.INTEGER,
      },
    },
    {
      sequelize,
      modelName: "Cart",
      timestamps: true,
    }
  );

  Cart.validatePostData = async function (req, excludeId) {
    const schema = Joi.object({
      productId: Joi.number().required(),
      quantity: Joi.number().required(),
    });

    let validate = joiValidate(schema, req, true);
    return validate;
  };

  return Cart;
};
