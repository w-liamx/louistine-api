"use strict";

import multer from "multer";
import uuid, { v4 } from "uuid";
import path from "path";
import fs from "fs";
import jimp from "jimp";
import _ from "lodash";

import "../config/global";
import { responseObject, sluggify } from "../helpers/utils";
import { HTTP_BAD_REQUEST } from "../helpers/httpCodes.js";

/**
 * Usually called before resource creation/update to upload files associated with the resource
 */
export const uploadFiles = async (req, res, next) => {
  let { uploadConfig, Model } = res.locals;
  let {
    uploadType = "single",
    uploadField = "",
    uploadFields = [],
    maxCount = 2,
    fileSize = 1024 * 1024 * 1, // 1 MB
  } = uploadConfig;

  uploadConfig = { ...uploadConfig, ...{ Model } };

  const uploadOptions = multerOptions(uploadConfig);

  let multerUpload;
  switch (uploadType) {
    case "single":
      //single field, single file
      multerUpload = multer(uploadOptions).single(uploadField);
      break;
    case "multiple":
      //single field, multiple files
      multerUpload = multer(uploadOptions).array(uploadField, maxCount);
      break;
    case "multiField":
      //multiple fields, single/multiple files
      multerUpload = multer(uploadOptions).fields(uploadFields);
      break;
    default:
      break;
  }

  multerUpload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // a multer error occurred when uploading.
      console.log("multer error occured");
      return responseObject(res, HTTP_BAD_REQUEST, "error", null, err.message);
    } else if (err) {
      // other errors
      return responseObject(
        res,
        HTTP_BAD_REQUEST,
        "error",
        null,
        req.customError
      );
    }

    // everything went fine.
    if (fileSize) {
      //fileSize is sent in Kb
      fileSize = parseInt(fileSize) * 1024;
    }

    for (const fileKey in req.files) {
      const filesArr = req.files[fileKey];
      for (const file of filesArr) {
        // console.log(file);
        if (file.size > fileSize) {
          return responseObject(
            res,
            HTTP_BAD_REQUEST,
            "error",
            null,
            `${file.originalname} is larger than the permitted size`
          );
        }
      }
    }

    return next();
  });
};

/**
 * Usually called after image files upload to resize all the image files
 */
export const resizePhotos = async (req, res, next) => {
  if (!req.files) {
    return next();
  }

  //locals
  const { uploadConfig = {}, resizeConfig = {} } = res.locals;
  let {
    width = 550,
    height = jimp.AUTO,
    minSizeForResize = 1024,
  } = resizeConfig;
  if (width == "auto") {
    width = jimp.AUTO;
  }
  if (height == "auto") {
    height = jimp.AUTO;
  }

  const uploadPath = getUploadPath(uploadConfig.uploadFolder);
  const files = req.files;
  console.log(req.body);

  let uploadedFiles = {};
  for (const fileObj in files) {
    const fileArr = files[fileObj];
    for (const file of fileArr) {
      const ext = file.mimetype.split("/")[1];
      const newFilename = `${v4()}.${ext}`;
      const image = await jimp.read(file.buffer);
      //resize only if file size >= {minSizeForResize} kb
      if (file.size >= parseInt(minSizeForResize) * 1024) {
        // console.log('resized: ', file.originalname);
        await image.resize(width, height);
      }
      //write file to path
      let filePath = `${uploadPath}/${newFilename}`;
      if (uploadConfig.uploadSubFolderKey)
        filePath = `${uploadPath}/${sluggify(
          req.body[uploadConfig.uploadSubFolderKey]
        )}/${newFilename}`;

      await image.writeAsync(filePath);
      //file names for saving
      if (file.fieldname in uploadedFiles) {
        uploadedFiles[file.fieldname].push(newFilename);
      } else {
        uploadedFiles = {
          ...uploadedFiles,
          ...{ [file.fieldname]: [newFilename] },
        };
      }
    }
  }

  res.locals.uploadedFiles = uploadedFiles;

  return next();
};

/**
 * Usually called before resource update to delete all redundant files associated with the resource
 */
export const deleteRedundantMultiFieldFiles = async (req, res, next) => {
  if (!req.files) {
    return next();
  }

  let { uploadConfig = {}, savedFiles = {}, uploadedFiles = {} } = res.locals;
  const uploadPath = getUploadPath(uploadConfig.uploadFolder);

  if (typeof savedFiles !== "object") {
    savedFiles = JSON.parse(savedFiles);
  }

  for (const fileKey in savedFiles) {
    if (fileKey in uploadedFiles) {
      const filesToDelete = savedFiles[fileKey];
      for (const fileToDelete of filesToDelete) {
        fs.unlink(`${uploadPath}/${fileToDelete}`, function (err) {
          if (err && err.code != "ENOENT") {
            //file exists but can't be removed for some reason...
            throw new Error(
              `Error occured while removing file.: ${err.message}`
            );
          }
        });
      }
      //remove from saved files
      delete savedFiles[fileKey];
      //add the newly uploaded
      savedFiles[fileKey] = uploadedFiles[fileKey];
    }
  }

  //finally update uploaded file names
  res.locals.uploadedFiles = savedFiles;

  return next();
};

/**
 * Usually called after resource deletion to delete all files associated with the resource.
 * Note: ideally should be called after deletion to avoid losing the files if deletion fails.
 */
export const deleteMultiFieldFiles = async (req, res, next) => {
  let {
    uploadConfig = {},
    entity = Model.name,
    removeFilesAfterDelete = false,
  } = res.locals;

  const uploadPath = getUploadPath(uploadConfig.uploadFolder);

  if (typeof savedFiles !== "object") {
    savedFiles = JSON.parse(savedFiles);
  }

  for (const fileKey in savedFiles) {
    if (fileKey in uploadedFiles) {
      const filesToDelete = savedFiles[fileKey];
      for (const fileToDelete of filesToDelete) {
        fs.unlink(`${uploadPath}/${fileToDelete}`, function (err) {
          if (err && err.code != "ENOENT") {
            //file exists but can't be removed for some reason...
            console.log(`Error occured while removing file.: ${err.message}`);
            // throw new Error(`Error occured while removing file.: ${err.message}`);
          }
        });
      }
    }
  }

  if (removeFilesAfterDelete) {
    return responseObject(
      res,
      HTTP_OK,
      "error",
      null,
      `${entity} deleted successfully`
    );
  } else {
    return next();
  }
};

const multerOptions = (options) => {
  let {
    storage = "memory",
    uploadFolder = "",
    allowedMimeTypes = ["image/jpg", "image/jpeg", "image/png"],
    withTextValidation = false,
    Model = null,
    extra = {},
  } = options;

  //for disk storage
  const diskStorage = multer.diskStorage({
    destination: function (_req, _file, cb) {
      return getUploadPath(uploadFolder, cb);
    },
    filename: function (_req, file, cb) {
      cb(null, uuid() + path.extname(file.originalname));
    },
  });

  const storageMapper = {
    disk: diskStorage,
    memory: multer.memoryStorage(),
  };

  let hasValidatedText = false;

  const uploadOptions = {
    storage: storageMapper[storage],
    // limits: { fileSize }, //this guy throws unhandled error, check is done at resizePhotos()
    async fileFilter(req, file, cb) {
      //validate post data
      if (Model && withTextValidation && !hasValidatedText) {
        const excludeId = req.params?.id ?? ""; //for edit
        const validate = await Model.validatePostData(req, excludeId, extra);
        if (validate !== true) {
          const { rMessage } = validate;
          req.customError = rMessage;
          return cb(req.customError, false);
        } else {
          cb(null, true);
        }
        hasValidatedText = true; //we don't want to check more than once in one request cycle
      }

      //allowed types
      if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        const allowedExtensions = [];
        for (const mime of allowedMimeTypes) {
          const ext = mime.split("/")[1];
          allowedExtensions.push(ext);
        }
        req.customError = `Invalid file type. Expecting file(s) of type ${allowedExtensions.join(
          ", "
        )}`;
        return cb(req.customError, false);
      }
    },
  };

  return uploadOptions;
};

const getUploadPath = (uploadFolder = "", cb = null) => {
  let uploadPath = path.join(__dirname, "../../public/uploads");
  if (uploadFolder) {
    uploadPath += `/${uploadFolder}`;
  }
  //make dir if not exists: fs.access will return error if dir doesn't exist
  fs.access(uploadPath, function (error) {
    if (error) {
      //dir doesn't exist, so create
      return fs.mkdir(uploadPath, { recursive: true }, (error) => {
        if (typeof cb === "function") {
          return cb(error, uploadPath);
        }
        return uploadPath;
      });
    } else {
      //dir exists, return it
      if (typeof cb === "function") {
        return cb(null, uploadPath);
      }
      return uploadPath;
    }
  });
  return uploadPath;
};
console.log(global.config);

export const resolveMultiFieldFileUrl = (uploadFolder, savedFiles) => {
  console.log(global.config);

  if (_.isEmpty(savedFiles)) {
    return savedFiles;
  }

  if (typeof savedFiles !== "object") {
    savedFiles = JSON.parse(savedFiles);
  }

  for (const fileKey in savedFiles) {
    const filesArr = savedFiles[fileKey];
    for (const [i, file] of filesArr.entries()) {
      savedFiles[fileKey][
        i
      ] = `${global.config.baseUrl}/uploads/${uploadFolder}/${file}`;
    }
  }

  return savedFiles;
};
