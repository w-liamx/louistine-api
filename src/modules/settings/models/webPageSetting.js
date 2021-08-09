"use strict";

const { Model } = require("sequelize");
import Joi from "joi";
import { sluggify } from "../../../helpers/utils.js";
import { resolveMultiFieldFileUrl } from "../../../middleware/file.js";

import { joiValidate } from "../../../wrappers/joi.js";

module.exports = (sequelize, DataTypes) => {
  class PageSetting extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {}
  }

  PageSetting.init(
    {
      pageName: {
        allowNull: false,
        unique: true,
        type: DataTypes.STRING,
      },
      settings: {
        allowNull: false,
        type: DataTypes.TEXT,
        get: function () {
          const val = this.getDataValue("settings");
          return JSON.parse(val);
        },
        // set: function (val) {
        //   this.setDataValue("settings", val ? JSON.stringify(val) : null);
        // },
      },
      images: {
        allowNull: true,
        type: DataTypes.TEXT,
        get: function () {
          let data = null;
          const val = this.getDataValue("images");
          if (val) {
            const uploadFolder = `images/pageSettings/${sluggify(
              this.getDataValue("pageName")
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
    },
    {
      sequelize,
      modelName: "PageSetting",
      timestamps: true,
    }
  );

  PageSetting.validatePostData = async function (req, excludeId) {
    const schema = Joi.object({
      pageName: Joi.string().required().max(255),
      settings: Joi.required(),
    });

    let validate = joiValidate(schema, req, true);
    return validate;
  };

  return PageSetting;
};
