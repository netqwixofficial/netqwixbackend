"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commonService = void 0;
const ffmpeg = require("fluent-ffmpeg");
const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
const path = require("path");
const fs = require("fs");
const path_1 = require("path");
const constance_1 = require("../../config/constance");
const clip_schema_1 = require("../../model/clip.schema");
const saved_sessions_schema_1 = require("../../model/saved_sessions.schema");
const booked_sessions_schema_1 = require("../../model/booked_sessions.schema");
const AWS = require("aws-sdk");
const mongoose_1 = require("mongoose");
const booked_sessions_schema_2 = require("../../model/booked_sessions.schema");
const user_schema_1 = require("../../model/user.schema");
const constant_1 = require("../../Utils/constant");
const bucketName = process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const s3 = new AWS.S3({
  endpoint: `https://${process.env.CLOUDFLARE_R2}.r2.cloudflarestorage.com`,
  region,
  accessKeyId,
  secretAccessKey,
  signatureVersion: "v4",
});
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
class commonService {
  constructor() {
    this.generatePreSignedPutUrl = async (fileName, fileType) => {
      const params = {
        Bucket: bucketName,
        Key: fileName,
        Expires: 600,
        // ACL: "public-read",
        ContentType: fileType,
      };
      let url;
      try {
        url = await s3.getSignedUrlPromise("putObject", params);
      } catch (err) {
        console.log("err", err);
        // do something with the error here
        // and abort the operation.
        return;
      }
      return url;
    };
    this.cleanupFiles = (inputPath, tempOutputPath, finalOutputPath) => {
      try {
        if (inputPath && fs.existsSync(inputPath)) {
          fs.unlinkSync(inputPath);
        }
        if (tempOutputPath && fs.existsSync(tempOutputPath)) {
          fs.unlinkSync(tempOutputPath);
        }
        if (finalOutputPath && fs.existsSync(finalOutputPath)) {
          fs.unlinkSync(finalOutputPath);
        }
      } catch (cleanupError) {
        console.error("Error during cleanup:", cleanupError);
      }
    };
  }
  async uploadFile(req, res) {
    try {
      if (!req.file) {
        return res
          .status(constance_1.CONSTANCE.RES_CODE.error.badRequest)
          .json({ error: constance_1.Message.errors.noFileUpload });
      }
      const uploadedFile = req.file;
      const fileExtension = (0, path_1.extname)(
        uploadedFile.originalname
      ).toLowerCase();
      if (!constance_1.allowedImageExtensions.includes(fileExtension)) {
        return res
          .status(constance_1.CONSTANCE.RES_CODE.error.badRequest)
          .json({ error: constance_1.Message.errors.allowedImageExtensions });
      }
      const fileSize =
        constance_1.MAX_FILE_SIZE_MB * constance_1.MAX_FILE_SIZE_MB;
      if (uploadedFile.size > fileSize) {
        return res
          .status(constance_1.CONSTANCE.RES_CODE.error.badRequest)
          .json({ error: constance_1.Message.errors.maxFileSizeMB });
      }
      const fileUrl = `${process.env.BASE_URL}/public/assets/${uploadedFile.filename}`;
      return res
        .status(constance_1.CONSTANCE.RES_CODE.success)
        .json({ success: 1, url: fileUrl });
    } catch (error) {
      res
        .status(constance_1.CONSTANCE.RES_CODE.error.internalServerError)
        .json({
          success: 0,
          message: constance_1.Message.internal,
        });
    }
  }
  async videoUploadUrl(req, res) {
    try {
      req.body.user_id = req?.authUser?._id;
      var fileName =
        new Date().getTime().toString() +
        "." +
        req?.body?.fileType?.split("/")[1];
      var thumbnailFileName =
        new Date().getTime().toString() +
        "." +
        req?.body?.thumbnail?.split("/")[1];
      req.body.file_name = fileName;
      req.body.thumbnail = thumbnailFileName;
      const clipObj = new clip_schema_1.default(req.body);
      await clipObj.save();
      let fileUrl = await this.generatePreSignedPutUrl(
        fileName,
        req?.body?.fileType
      );
      let thumbnailURL = await this.generatePreSignedPutUrl(
        thumbnailFileName,
        req?.body?.thumbnail
      );
      return res
        .status(constance_1.CONSTANCE.RES_CODE.success)
        .json({ success: 1, url: fileUrl, thumbnailURL });
    } catch (error) {
      res
        .status(constance_1.CONSTANCE.RES_CODE.error.internalServerError)
        .json({
          success: 0,
          message: constance_1.Message.internal,
        });
    }
  }
  async profileImageUrl(req, res) {
    try {
      req.body.user_id = req?.authUser?._id;
      var fileName =
        new Date().getTime().toString() +
        "." +
        req?.body?.fileType?.split("/")[1];
      req.body.file_name = fileName;
      await user_schema_1.default.findByIdAndUpdate(req?.authUser?._id, {
        $set: { profile_picture: fileName },
      });
      let fileUrl = await this.generatePreSignedPutUrl(
        fileName,
        req?.body?.fileType
      );
      return res
        .status(constance_1.CONSTANCE.RES_CODE.success)
        .json({ success: 1, url: fileUrl });
    } catch (error) {
      res
        .status(constance_1.CONSTANCE.RES_CODE.error.internalServerError)
        .json({
          success: 0,
          message: constance_1.Message.internal,
        });
    }
  }
  async sessionsVideoUploadUrl(req, res) {
    try {
      req.body.user_id = req?.authUser?._id;
      var fileName =
        new Date().getTime().toString() +
        "." +
        req?.body?.fileType?.split("/")[1];
      req.body.file_name = fileName;
      const savedSessionObj = new saved_sessions_schema_1.default(req.body);
      var savedSessionData = await savedSessionObj.save();
      console.log("SaveSession ", savedSessionData);
      let fileUrl = await this.generatePreSignedPutUrl(
        fileName,
        req?.body?.fileType
      );
      return res
        .status(constance_1.CONSTANCE.RES_CODE.success)
        .json({ success: 1, url: fileUrl });
    } catch (error) {
      res
        .status(constance_1.CONSTANCE.RES_CODE.error.internalServerError)
        .json({
          success: 0,
          message: constance_1.Message.internal,
        });
    }
  }
  async getAllSavedSession(req, res) {
    try {
      //NOTE -we will get data based on this user_id , when we call the api from admin for each trainer and trainee
      const id = req?.body?.user_id || req?.authUser?._id;
      // check if user is trainer or trainee
      const query = {
        $and: [
          {
            $or: [{ status: true }, { status: { $exists: false } }],
          },
          {
            $or: [{ trainer: id }, { trainee: id }],
          },
        ],
      };
      const data = await saved_sessions_schema_1.default.find(query);
      return res
        .status(constance_1.CONSTANCE.RES_CODE.success)
        .json({ success: 1, data: data });
    } catch (error) {
      res
        .status(constance_1.CONSTANCE.RES_CODE.error.internalServerError)
        .json({
          success: 0,
          message: constance_1.Message.internal,
        });
    }
  }
  async pdfUploadUrl(req, res) {
    try {
      var filename = "file-" + new Date().getTime().toString() + ".pdf";
      req.body.user_id = req?.authUser?._id;
      const clipObj = await booked_sessions_schema_2.default.findOneAndUpdate(
        { _id: req.body.session_id },
        { report: filename }
      );
      let fileUrl = await this.generatePreSignedPutUrl(filename, "pdf");
      return res
        .status(constance_1.CONSTANCE.RES_CODE.success)
        .json({ success: 1, url: fileUrl });
    } catch (error) {
      res
        .status(constance_1.CONSTANCE.RES_CODE.error.internalServerError)
        .json({
          success: 0,
          message: constance_1.Message.internal,
        });
    }
  }
  async getClips(req, res) {
    try {
      const trainee_id = req.body.trainee_id ?? null;
      var clips = await clip_schema_1.default.aggregate([
        {
          $match: {
            user_id: new mongoose_1.default.Types.ObjectId(
              trainee_id ?? req?.authUser?._id
            ),
            $or: [{ status: true }, { status: { $exists: false } }],
          },
        },
        {
          $group: {
            _id: "$category",
            clips: {
              $push: "$$ROOT",
            },
          },
        },
      ]);
      return res
        .status(constance_1.CONSTANCE.RES_CODE.success)
        .json({ data: clips });
    } catch (error) {
      res
        .status(constance_1.CONSTANCE.RES_CODE.error.internalServerError)
        .json({
          success: 0,
          message: constance_1.Message.internal,
        });
    }
  }
  async traineeClips(req, res) {
    try {
      var clips = await booked_sessions_schema_1.default.aggregate([
        {
          $match: {
            trainer_id: new mongoose_1.default.Types.ObjectId(
              req?.authUser?._id
            ),
          },
        },
        {
          $lookup: {
            from: "clips",
            localField: "trainee_clip",
            foreignField: "_id",
            as: "clips",
          },
        },
        {
          $unwind: {
            path: "$clips",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "clips.user_id",
            foreignField: "_id",
            as: "clip_user",
            pipeline: [
              {
                $project: constant_1.Constant.pipelineUser,
              },
            ],
          },
        },
        {
          $unwind: {
            path: "$clip_user",
          },
        },
        {
          $group: {
            _id: "$clip_user",
            clips: {
              $push: "$$ROOT",
            },
          },
        },
      ]);
      return res
        .status(constance_1.CONSTANCE.RES_CODE.success)
        .json({ data: clips });
    } catch (error) {
      res
        .status(constance_1.CONSTANCE.RES_CODE.error.internalServerError)
        .json({
          success: 0,
          message: constance_1.Message.internal,
        });
    }
  }
  async deleteClip(req, res) {
    try {
      const { id } = req?.params;
      if (!mongoose_1.default.isValidObjectId(id)) {
        return res
          .status(constance_1.CONSTANCE.RES_CODE.error.badRequest)
          .json({
            success: 0,
            message: "Invalid ID",
          });
      }
      var clips = await clip_schema_1.default.findByIdAndUpdate(id, {
        $set: { status: false },
      });
      if (!clips) {
        return res.status(constance_1.CONSTANCE.RES_CODE.error.notFound).json({
          success: 0,
          message: constance_1.Message.notFoundData,
        });
      }
      return res.status(constance_1.CONSTANCE.RES_CODE.success).json({
        success: 1,
        message: "Clip deleted Successfully",
      });
    } catch (error) {
      res
        .status(constance_1.CONSTANCE.RES_CODE.error.internalServerError)
        .json({
          success: 0,
          message: constance_1.Message.internal,
        });
    }
  }
  async deleteSavedSession(req, res) {
    try {
      const { id } = req?.params;
      if (!mongoose_1.default.isValidObjectId(id)) {
        return res
          .status(constance_1.CONSTANCE.RES_CODE.error.badRequest)
          .json({
            success: 0,
            message: "Invalid ID",
          });
      }
      var session = await saved_sessions_schema_1.default.findByIdAndUpdate(
        id,
        {
          $set: { status: false },
        }
      );
      if (!session) {
        return res.status(constance_1.CONSTANCE.RES_CODE.error.notFound).json({
          success: 0,
          message: constance_1.Message.notFoundData,
        });
      }
      return res.status(constance_1.CONSTANCE.RES_CODE.success).json({
        success: 1,
        message: "Saved Session deleted Successfully",
      });
    } catch (error) {
      res
        .status(constance_1.CONSTANCE.RES_CODE.error.internalServerError)
        .json({
          success: 0,
          message: constance_1.Message.internal,
        });
    }
  }
  async generateThumbnail(req, res) {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ success: 0, message: "No video file uploaded." });
      }
      const inputPath = req.file.path;
      const thumbnailDir = path.join(__dirname, "..", "thumbnails"); // Adjust this path as needed
      const outputPath = path.join(thumbnailDir, `${req.file.filename}.jpg`);
      // Ensure the thumbnail directory exists
      if (!fs.existsSync(thumbnailDir)) {
        fs.mkdirSync(thumbnailDir, { recursive: true });
      }
      return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
          .screenshots({
            timestamps: ["00:00:01"],
            filename: `${req.file.filename}.jpg`,
            folder: thumbnailDir,
            size: "700x1100",
          })
          .on("end", () => {
            fs.unlinkSync(inputPath); // Remove the uploaded video file
            // Check if the thumbnail file exists
            if (!fs.existsSync(outputPath)) {
              reject(new Error("Thumbnail file not created"));
              return;
            }
            // Send the thumbnail file
            res.sendFile(outputPath, (err) => {
              if (err) {
                console.error("Error sending file:", err);
                reject(err);
              } else {
                // Remove the thumbnail file after sending
                fs.unlinkSync(outputPath);
                resolve();
              }
            });
          })
          .on("error", (err) => {
            console.error("Error generating thumbnail:", err);
            reject(err);
          });
      });
    } catch (error) {
      res
        .status(constance_1.CONSTANCE.RES_CODE.error.internalServerError)
        .json({
          success: 0,
          message: constance_1.Message.internal,
        });
    }
    // let inputPath: string | null = null;
    // let tempOutputPath: string | null = null;
    // let finalOutputPath: string | null = null;
    // try {
    //   if (!req.file) {
    //     return res.status(400).json({ success: 0, message: 'No video file uploaded.' });
    //   }
    //   inputPath = req.file.path;
    //   const thumbnailDir = path.join(__dirname, '..', 'thumbnails'); // Adjust this path as needed
    //   tempOutputPath = path.join(thumbnailDir, `${req.file.filename}_temp.jpg`);
    //   finalOutputPath = path.join(thumbnailDir, `${req.file.filename}.jpg`);
    //   // Ensure the thumbnail directory exists
    //   if (!fs.existsSync(thumbnailDir)) {
    //     fs.mkdirSync(thumbnailDir, { recursive: true });
    //   }
    //   await new Promise<void>((resolve, reject) => {
    //     ffmpeg(inputPath!)
    //       .inputOptions(['-ss 00:00:01'])
    //       .outputOptions(['-frames:v 1'])
    //       .output(tempOutputPath!)
    //       .on('end', async () => {
    //         try {
    //           // Resize the image using sharp
    //           await sharp(tempOutputPath!)
    //             .resize(320, 240, { fit: 'cover' })
    //             .toFile(finalOutputPath!);
    //           // Send the final thumbnail file
    //           res.sendFile(finalOutputPath!, (err) => {
    //             if (err) {
    //               console.error('Error sending file:', err);
    //               reject(err);
    //             } else {
    //               setTimeout(() => {
    //                 this.cleanupFiles(inputPath, tempOutputPath, finalOutputPath);
    //               }, 5 * 60 * 1000);
    //               resolve();
    //             }
    //           });
    //         } catch (err) {
    //           console.error('Error processing with sharp:', err);
    //           reject(err);
    //         }
    //       })
    //       .on('error', (err) => {
    //         console.error('Error generating thumbnail with ffmpeg:', err);
    //         reject(err);
    //       })
    //       .run();
    //   });
    // } catch (error) {
    //   console.error('Thumbnail generation error:', error);
    //   this.cleanupFiles(inputPath, tempOutputPath, finalOutputPath);
    //   res.status(CONSTANCE.RES_CODE.error.internalServerError).json({
    //     success: 0,
    //     message: Message.internal,
    //   });
    // } finally {
    //   // Clean up files in the finally block
    //   this.cleanupFiles(inputPath, tempOutputPath, finalOutputPath);
    //   // try {
    //   //   if (inputPath && fs.existsSync(inputPath)) {
    //   //     fs.unlinkSync(inputPath);
    //   //   }
    //   //   if (tempOutputPath && fs.existsSync(tempOutputPath)) {
    //   //     fs.unlinkSync(tempOutputPath);
    //   //   }
    //   //   if (finalOutputPath && fs.existsSync(finalOutputPath)) {
    //   //     fs.unlinkSync(finalOutputPath);
    //   //   }
    //   // } catch (cleanupError) {
    //   //   console.error('Error during cleanup:', cleanupError);
    //   // }
    // }
  }
}
exports.commonService = commonService;
//# sourceMappingURL=commonService.js.map
