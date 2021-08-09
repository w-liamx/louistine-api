"use strict";

const { Model } = require("sequelize");
import Joi from "joi";

import { joiValidate } from "../../../wrappers/joi.js";

module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Order.belongsTo(models.OrderCategory, {
      //   as: "category",
      //   foreignKey: "categoryId",
      //   onDelete: "SET NULL",
      //   onUpdate: "CASCADE",
      // });
    }
  }
  Order.init(
    {
      userId: {
        allowNull: true,
        type: DataTypes.INTEGER,
        validate: {
          isInt: true,
        },
      },
      OrderRef: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      totalAmount: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      description: {
        allowNull: false,
        type: DataTypes.TEXT,
      },
      status: {
        allowNull: false,
        type: DataTypes.STRING,
        defaultValue: "pending",
      },
    },
    {
      sequelize,
      modelName: "Order",
      paranoid: true, //allow soft delete
      timestamps: true,
    }
  );

  // Order.validatePostData = async function (req, excludeId) {
  //   const schema = Joi.object({
  //     description: Joi.string().required(),
  //   });

  //   let validate = joiValidate(schema, req, true);
  //   return validate;
  // };

  return Order;
};
