"use strict";

import db from "../databases/sequelize.js";
import {
  HTTP_OK,
  HTTP_CREATED,
  HTTP_BAD_REQUEST,
  HTTP_FORBIDDEN,
  HTTP_NOT_FOUND,
  HTTP_CONFLICT,
} from "../helpers/httpCodes.js";
import { responseInfo } from "../helpers/utils.js";

const { Sequelize, Op } = db;

/**
 * Used to get paginated list for any given model
 * @param {class} Model - current model class
 * @param {object} req - the request object
 * @param {object} extra - any additional configuration [where, exclude]
 */
export const getPaginatedRecordList = async (Model, req, extra = {}) => {
  try {
    let {
      page,
      perPage,
      sort,
      search = "",
      active = 2,
      trashed = 0,
      properties = "",
    } = req.query;
    let {
      associations = [],
      whereExtra = {},
      excludeExtra = [],
      searchFields = [],
      fullText = {},
      replacements = {},
      having = null,
      group = "",
    } = extra;

    //build query

    //where
    let where = {};

    //active
    active = parseInt(active);
    if ([0, 1].includes(active)) {
      where = { ...where, ...{ isActive: active } };
    }

    //trashed
    trashed = parseInt(trashed);
    let paranoid = true; //since we are using soft-delete query
    if (trashed === 1) {
      //trashed
      where = { ...where, ...{ deletedAt: { [Op.not]: null } } };
      paranoid = false; //ignore soft-delete
    }
    if (trashed === 2) {
      //both
      paranoid = false; //ignore soft-delete query
    }

    if (whereExtra) {
      where = { ...where, ...whereExtra };
    }

    //columns
    let attributes = sqlAttributes(properties, excludeExtra);

    //search
    const fullTextEnabled =
      fullText.hasOwnProperty("enabled") && fullText.enabled === false
        ? false
        : true;
    if (fullTextEnabled) {
      //full text search
      const ftArr = sqlFullTextSearch(
        search,
        searchFields,
        attributes,
        replacements,
        fullText
      );
      attributes = ftArr[0]; //updated
      replacements = ftArr[1];
      having = ftArr[2];
    } else {
      //like search
      where = sqlLikeSearch(search, searchFields, where);
    }

    //associations
    const assoc = sqlAssociations(attributes, associations);
    attributes = assoc[0]; //updated
    const include = assoc[1];

    //sort
    const sortByRelevance = fullTextEnabled && search;
    const order = sqlSortOrder(sort, sortByRelevance);

    //limit and offset
    const [limit, offset] = sqlLimitOffset(page, perPage);

    let sqlQuery = {
      attributes,
      where,
      limit,
      offset,
      order,
      paranoid,
      // logging: console.log
    };
    if (include) {
      sqlQuery = { ...sqlQuery, ...{ include } };
    }
    if (replacements) {
      sqlQuery = { ...sqlQuery, ...{ replacements } };
    }
    if (having) {
      sqlQuery = { ...sqlQuery, ...{ having } };
    }
    if (group) {
      sqlQuery = { ...sqlQuery, ...{ group } };
    }
    const result = await Model.findAll(sqlQuery);
    return responseInfo(HTTP_OK, "success", result);
  } catch (err) {
    throw new Error(err.message);
  }
};

/**
 * Used to get a single record for any given model
 * @param {class} Model - current model class
 * @param {mixed} id - the value to lookup
 * @param {string} by - the field name to lookup the specified id
 * @param {object} extra - any additional configuration [where, exclude, properties, entity]
 */
export const getRecord = async (Model, id, by = "id", extra = {}) => {
  if (!id) {
    return responseInfo(
      HTTP_BAD_REQUEST,
      "error",
      null,
      `Reference ID {${by}} is missing!`
    );
  }
  try {
    const {
      entity = "Record",
      associations = [],
      whereExtra = {},
      excludeExtra = [],
      properties = "",
      group = "",
    } = extra;

    const where = sqlWhere(id, by, whereExtra);
    let attributes = sqlAttributes(properties, excludeExtra);
    const assoc = sqlAssociations(attributes, associations);
    attributes = assoc[0]; //updated
    const include = assoc[1];

    // console.log(include);

    let sqlQuery = {
      attributes,
      where,
      // plain: false,
      // raw: true,
      // logging: console.log
    };
    if (include) {
      sqlQuery = { ...sqlQuery, ...{ include } };
    }
    if (group) {
      sqlQuery = { ...sqlQuery, ...{ group } };
    }
    const result = await Model.findOne(sqlQuery);
    if (result instanceof Model) {
      return responseInfo(HTTP_OK, "success", result);
    } else {
      return responseInfo(HTTP_NOT_FOUND, "error", null, `${entity} not found`);
    }
  } catch (err) {
    // console.log(err.stack);
    throw new Error(err.message);
  }
};

/**
 * Used to create a single record for any given model
 * @param {class} Model - current model class
 * @param {object} data - the data to be updated
 * @param {object} extra - any additional configuration [where, exclude, entity]
 * @return {object}
 */
export const createRecord = async (Model, data, extra = {}) => {
  const {
    properties = "",
    whereExtra = {},
    includeExtra = [],
    excludeExtra = [],
    associations = [],
    entity = Model.name,
  } = extra;

  const result = await Model.create(data);
  if (result instanceof Model) {
    const id = result.id;
    //we can return result but it will contain unwanted attributes...so we fetch anew
    const where = sqlWhere(id, "id", whereExtra);
    let attributes = sqlAttributes(properties, includeExtra, excludeExtra);

    //associations
    const assoc = sqlAssociations(attributes, associations);
    attributes = assoc[0]; //updated
    const include = assoc[1];

    let sqlQuery = {
      attributes,
      where,
      // logging: console.log
    };
    if (include) {
      sqlQuery = { ...sqlQuery, ...{ include } };
    }
    const createdResult = await Model.findOne(sqlQuery);

    return responseInfo(HTTP_CREATED, "success", createdResult);
  } else {
    return responseInfo(
      HTTP_BAD_REQUEST,
      "error",
      null,
      `${entity} wasn't created!`
    );
  }
};

/**
 * Used to update a single record for any given model
 * @param {class} Model - current model class
 * @param {mixed} id - the value to lookup
 * @param {string} by - the field name to lookup the specified id
 * @param {object} data - the data to be updated
 * @param {object} extra - any additional configuration [where, exclude, entity]
 */
export const updateRecord = async (Model, id, by = "id", data, extra = {}) => {
  if (!id) {
    return responseInfo(
      HTTP_BAD_REQUEST,
      "error",
      null,
      `Reference ID {${by}} is missing!`
    );
  }

  const { whereExtra = {}, excludeExtra = [], entity = "Record" } = extra;
  const where = sqlWhere(id, by, whereExtra);

  const result = await Model.findOne({ where, attributes: ["id"] });
  if (result instanceof Model === false) {
    return responseInfo(HTTP_NOT_FOUND, "error", null, `${entity} not found`);
  }

  try {
    const updated = await Model.update(data, {
      where,
      // logging: console.log
    });
    if (updated) {
      //fetch updated record and return
      const where = sqlWhere(result.id, "id", whereExtra);
      const attributes = sqlAttributes("", excludeExtra);
      const updatedResult = await Model.findOne({
        attributes,
        where,
        // logging: console.log
      });
      return responseInfo(HTTP_OK, "success", updatedResult);
    } else {
      return responseInfo(
        HTTP_BAD_REQUEST,
        "error",
        null,
        `${entity} wasn't updated!`
      );
    }
  } catch (err) {
    throw new Error(err.message);
  }
};

/**
 * Used to soft-delete a single record for any given model
 * @param {class} Model - current model class
 * @param {mixed} id - the value to lookup
 * @param {string} by - the field name to lookup the specified id
 * @param {object} extra - any additional configuration [where, entity]
 */
export const trashOrDeleteRecord = async (Model, id, by = "id", extra = {}) => {
  if (!id) {
    return responseInfo(
      HTTP_BAD_REQUEST,
      "error",
      null,
      `Reference ID {${by}} is missing!`
    );
  }
  const { entity = "Record", isHardDelete = false } = extra;

  let whereExtra = {};
  if (!isHardDelete) {
    whereExtra = { deletedAt: { [Op.is]: null } };
  }
  const where = sqlWhere(id, by, whereExtra);

  const result = await Model.findOne({
    where,
    attributes: ["id"],
    paranoid: false,
  });
  if (result instanceof Model === false) {
    return responseInfo(HTTP_NOT_FOUND, "error", null, `${entity} not found`);
  }

  try {
    let sqlQuery = { where };
    if (isHardDelete) {
      sqlQuery = { ...sqlQuery, ...{ force: true } };
    }
    const trashedOrDeleted = await Model.destroy(sqlQuery);
    if (trashedOrDeleted) {
      return responseInfo(
        HTTP_OK,
        "success",
        null,
        `${entity} was ${isHardDelete ? "deleted" : "trashed"} successfully!`
      );
    } else {
      return responseInfo(
        HTTP_BAD_REQUEST,
        "error",
        null,
        `${entity} wasn't ${isHardDelete ? "deleted" : "trashed"}!`
      );
    }
  } catch (err) {
    throw new Error(err.message);
  }
};

/**
 * Used to restore a single soft-deleted record for any given model
 * @param {class} Model - current model class
 * @param {mixed} id - the value to lookup
 * @param {string} by - the field name to lookup the specified id
 * @param {object} extra - any additional configuration [where, entity]
 */
export const restoreRecord = async (Model, id, by = "id", extra = {}) => {
  if (!id) {
    return responseInfo(
      HTTP_BAD_REQUEST,
      "error",
      null,
      `Reference ID {${by}} is missing!`
    );
  }
  const { entity = "Record" } = extra;

  const whereExtra = { deletedAt: { [Op.not]: null } };
  const where = sqlWhere(id, by, whereExtra);

  const result = await Model.findOne({
    where,
    attributes: ["id"],
    paranoid: false,
  });
  if (result instanceof Model === false) {
    return responseInfo(HTTP_NOT_FOUND, "error", null, `${entity} not found`);
  }

  try {
    let restored = await Model.restore({ where });
    if (restored) {
      return responseInfo(
        HTTP_OK,
        "success",
        null,
        `${entity} restored successfully!`
      );
    } else {
      return responseInfo(
        HTTP_BAD_REQUEST,
        "error",
        null,
        `${entity} wasn't restored!`
      );
    }
  } catch (err) {
    throw new Error(err.message);
  }
};

/** 
# Used to check if a unique column already has a given value. 
# @param {class} Model - current model class
# @param {string} field - the field to do the lookup
# @param {mixed} value - the value to be looked up
# @param {integer} excludeId - should be supplied if update operation to exlude the record that matches the id
# @param {object} extra - any additional data eg. customMsg, pkField
*/
export const isUnique = async (
  Model,
  field,
  value,
  excludeId = null,
  extra = {}
) => {
  const { customMsg = null, pkField = "id" } = extra;
  let { whereExtra = {} } = extra;

  const excludeWhere = { [pkField]: { [Op.ne]: excludeId } };
  if (excludeId) {
    whereExtra = { ...whereExtra, ...excludeWhere };
  }
  const where = sqlWhere(value, field, whereExtra);

  const found = await Model.findOne({
    where,
    attributes: [field],
    paranoid: false, //soft-deleted or not
    // logging: console.log
  });
  if (!found) return true;
  const msg = customMsg || `${value} is not available!`;
  return responseInfo(HTTP_CONFLICT, "error", null, msg);
};

/** 
# Used to check if user owns a data
# @param {class} Model - current model class
# @param {mixed} userIdField - the user ID column against whom to do the check
# @param {mixed} userId - the user ID against whom to do the check
# @param {mixed} value - the data value to be looked up
# @param {string} action - the action attempted e.g. view, edit, delete, etc
# @param {object} extra - any additional data eg. customMsg, pkField
*/
export const verifyOwnership = async (
  Model,
  userIdField,
  userId,
  value,
  action,
  extra = {}
) => {
  const { customMsg = null, pkField = "id" } = extra;
  let { whereExtra = {} } = extra;

  const includeWhere = { [userIdField]: userId };
  whereExtra = { ...whereExtra, ...includeWhere };
  const where = sqlWhere(value, pkField, whereExtra);

  const found = await Model.findOne({
    where,
    attributes: [pkField],
    paranoid: false, //soft-deleted or not
    // logging: console.log
  });
  if (found) return true;
  const msg = customMsg || `You do not have permission to ${action} this data!`;
  return responseInfo(HTTP_FORBIDDEN, "error", null, msg);
};

const sqlAttributes = (properties, excludeExtra = []) => {
  let exclude = ["createdAt", "updatedAt", "deletedAt"];
  if (excludeExtra) {
    exclude = [...exclude, ...excludeExtra];
  }
  if (!properties) return { exclude };

  let attributes = [];
  let propertiesArr = properties.split(",");
  if (propertiesArr.length) {
    //remove excludables, even if requested
    propertiesArr = propertiesArr.filter((field) => !exclude.includes(field));
    attributes = propertiesArr;
  }
  return attributes;
};

const sqlWhere = (id, by, whereExtra = {}) => {
  let where = { [by]: id };
  if (whereExtra) {
    where = { ...where, ...whereExtra };
  }
  return where;
};

const sqlAssociations = (attributes, associations = []) => {
  if (associations) {
    if (!Array.isArray(associations)) {
      throw new Error("key 'associations' must be an array!");
    }
    let associationAliases = [];
    associations.map((assoc) => {
      //we push the attributes of assocs with aliases to the parent's attributes
      if (assoc.hasOwnProperty("aliases") && assoc.aliases) {
        for (const alias of assoc.aliases) {
          associationAliases = [...associationAliases, ...[alias]];
        }
      }
    });
    // console.log(associationAliases);
    if (Array.isArray(attributes)) {
      attributes = [...attributes, ...associationAliases];
    } else {
      if (!attributes.hasOwnProperty("include")) attributes.include = [];
      attributes.include = [...attributes.include, ...associationAliases];
    }
  }
  return [attributes, associations];
};

const sqlLimitOffset = (page, perPage) => {
  if (!page) page = 0;
  if (!perPage) perPage = 10;
  page = parseInt(page);
  perPage = parseInt(perPage);
  if (page < 0) {
    throw new Error("Page must be a valid positive integer!");
  }
  const limit = perPage;
  let offset = 0;
  if (page > 0) {
    offset = (page - 1) * limit;
  }
  return [limit, offset];
};

const sqlSortOrder = (sort, withsqlFullTextSearch = true) => {
  if (!sort) sort = "id";
  let order = sort;
  if (sort === "*") {
    //random
    order = sequelize.random();
  } else {
    let ordersArr = [];
    const sortArr = sort.split(",");
    for (let field of sortArr) {
      const direction = field.slice(0, 1);
      if (direction === "-") {
        field = field.slice(1);
        ordersArr.push([field, "DESC"]);
      } else {
        ordersArr.push([field, "ASC"]);
      }
    }
    if (withsqlFullTextSearch) {
      //search by relevance first
      // ordersArr.unshift(['relevance', 'DESC']); //this guy will only work if model name matches table name
      ordersArr.unshift([Sequelize.literal("relevance DESC")]);
    }
    order = ordersArr;
  }
  return order;
};

/**
 * Searching using LIKE (not efficient for large data sets. Use sqlFullTextSearch() below)
 * @param {mixed} keyword - the keyword to search
 * @param {array} searchFields - the fields to search in
 * @param {object} where - where clause
 */
const sqlLikeSearch = (keyword, searchFields, where = {}) => {
  if (keyword && searchFields) {
    let likesArr = [];
    for (let field of searchFields) {
      let like = { [field]: { [Op.substring]: keyword } }; //%{keyword}%
      likesArr.push(like);
    }
    if (likesArr) {
      where = { ...where, ...{ [Op.or]: likesArr } };
    }
  }
  return where;
};

/**
 * Fulltext Search.
 * Note: @param searchFields MUST match the number and position of the fulltext index.
 * The fulltext index must have been added to the table
 * It won't work otherwise.
 * For instance, @param searchFields for FULLTEXT INDEX `ftSearchFields` (`col1`, `col2`, `col3`) MUST be ['col1', 'col2', 'col3'];
 * @param {mixed} keyword - the keyword to search
 * @param {array} searchFields - the fields to search in
 * @param {mixed} attributes - other fields to select (could be an array or object)
 * @param {object} replacements - other replacement definitions
 * @param {object} config - FullText config such as mode, include/exlude keywords (for boolean mode)
 */
const sqlFullTextSearch = (
  keyword,
  searchFields,
  attributes,
  replacements = {},
  config = {}
) => {
  let having = null;
  if (keyword && searchFields) {
    const modes = {
      natural: "IN NATURAL LANGUAGE MODE",
      expansion: "WITH QUERY EXPANSION",
      boolean: "IN BOOLEAN MODE",
    };

    const { mode = "boolean", includes = [], exludes = [] } = config;
    //if mode is boolean, let's check for keywords to include and/or exclude...
    if (mode === "boolean") {
      //includes
      if (includes) {
        for (let include of includes) keyword += ` +${include}`;
      }
      //excludes
      if (exludes) {
        for (let exlude of exludes) keyword += ` -${exlude}`;
      }
    }

    const lookupColumns = searchFields.join(", ");
    const matchAgainst = Sequelize.literal(
      `MATCH (${lookupColumns}) AGAINST (:against ${modes[mode]})`
    );
    const matchAgainstArr = [matchAgainst, "relevance"];
    if (Array.isArray(attributes)) {
      attributes = [...attributes, ...[matchAgainstArr]];
    } else {
      //object
      if (!attributes.hasOwnProperty("include")) attributes.include = [];
      attributes.include = [...attributes.include, ...[matchAgainstArr]];
    }
    //replacements
    replacements = { ...replacements, ...{ against: keyword } };
    //filter off non-zero relevances
    having = Sequelize.literal("relevance > 0");
  }
  return [attributes, replacements, having];
};

export const sqlUserFullName = (dbAlias = "", as = "fullName") => {
  return [
    Sequelize.fn(
      "TRIM",
      Sequelize.fn(
        "CONCAT",
        Sequelize.fn("IFNULL", Sequelize.col(`${dbAlias}.title`), ""),
        " ",
        Sequelize.col(`${dbAlias}.firstName`),
        " ",
        Sequelize.fn("IFNULL", Sequelize.col(`${dbAlias}.otherName`), ""),
        " ",
        Sequelize.col(`${dbAlias}.lastName`)
      )
    ),
    as,
  ];
};
