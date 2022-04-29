"use strict";

const { Model } = require("sequelize");
import Joi from "joi";
import { sluggify } from "../../../helpers/utils.js";
import { resolveMultiFieldFileUrl } from "../../../middleware/file.js";

import { joiValidate } from "../../../wrappers/joi.js";

module.exports = (sequelize, DataTypes) => {
  class Product extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Product.belongsTo(models.Collection, {
      //   as: "collection",
      //   foreignKey: "collectionId",
      //   onDelete: "SET NULL",
      //   onUpdate: "CASCADE",
      // });
    }
  }
  Product.init(
    {
      collectionId: {
        allowNull: true,
        type: DataTypes.INTEGER(11),
        validate: {
          isInt: true,
        },
      },
      productName: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      price: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      description: {
        allowNull: false,
        type: DataTypes.TEXT,
      },
      images: {
        allowNull: true,
        type: DataTypes.TEXT,
        get: function () {
          let data = null;
          const val = this.getDataValue("images");
          if (val) {
            const uploadFolder = `images/products/${sluggify(
              this.getDataValue("productName")
            )}`;
            data = JSON.parse(val);
            data = resolveMultiFieldFileUrl(uploadFolder, val);
          }
          return data;
        },
        set: function (val) {
          this.setDataValue("images", val ? JSON.stringify(val) : null);
        },
      },
      size: {
        allowNull: false,
        type: DataTypes.INTEGER(5),
      }
    },
    {
      sequelize,
      modelName: "Product",
      paranoid: true, //allow soft delete
      timestamps: true,
    }
  );

  Product.validatePostData = async function (req, excludeId) {
    const schema = Joi.object({
      collectionId: Joi.number().required(),
      productName: Joi.string().required().max(255),
      price: Joi.number().required(),
      size: Joi.number().required(),
      description: Joi.string().required(),
    });

    let validate = joiValidate(schema, req, true);
    return validate;
  };

  return Product;
};
