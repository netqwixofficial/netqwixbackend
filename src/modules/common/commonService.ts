const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const path = require('path');
const fs = require('fs');
import { extname } from "path";
import {
  allowedImageExtensions,
  CONSTANCE,
  MAX_FILE_SIZE_MB,
  Message,
  NetquixImage,
} from "../../config/constance";
import * as l10n from "jm-ez-l10n";
import { Request, Response } from "express";
import clip from "../../model/clip.schema";
import savedSession from "../../model/saved_sessions.schema";
import book from "../../model/booked_sessions.schema";

import * as AWS from "aws-sdk";
import mongoose from "mongoose";
import booked_session from "../../model/booked_sessions.schema";
import { ResponseBuilder } from "../../helpers/responseBuilder";
import user from "../../model/user.schema";
import { Constant } from "../../Utils/constant";
import sharp = require("sharp");
import ReferredUser from "../../model/referred.user.schema";
import { SendEmail } from "../../Utils/sendEmail";
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

export class commonService {
  public async uploadFile(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res
          .status(CONSTANCE.RES_CODE.error.badRequest)
          .json({ error: Message.errors.noFileUpload });
      }
      const uploadedFile = req.file;
      const fileExtension = extname(uploadedFile.originalname).toLowerCase();

      if (!allowedImageExtensions.includes(fileExtension)) {
        return res
          .status(CONSTANCE.RES_CODE.error.badRequest)
          .json({ error: Message.errors.allowedImageExtensions });
      }
      const fileSize = MAX_FILE_SIZE_MB * MAX_FILE_SIZE_MB;
      if (uploadedFile.size > fileSize) {
        return res
          .status(CONSTANCE.RES_CODE.error.badRequest)
          .json({ error: Message.errors.maxFileSizeMB });
      }

      const fileUrl = `${process.env.BASE_URL}/public/assets/${uploadedFile.filename}`;
      return res
        .status(CONSTANCE.RES_CODE.success)
        .json({ success: 1, url: fileUrl });
    } catch (error) {
      res.status(CONSTANCE.RES_CODE.error.internalServerError).json({
        success: 0,
        message: Message.internal,
      });
    }
  }

  generatePreSignedPutUrl = async (fileName, fileType) => {
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

  cleanupFiles = (inputPath: string | null, tempOutputPath: string | null, finalOutputPath: string | null) => {
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
      console.error('Error during cleanup:', cleanupError);
    }
  }

  private async processInvites(invites: string[], referrerUser): Promise<string[]> {
    const userIds: string[] = [];
    
    for (const inviteEmail of invites) {
      try {
        // Check if a user with this email already exists in the User collection
        const existingUser = await user.findOne<any>({ email: inviteEmail });
        let emailBody = `
        <div style="font-family: Verdana,Arial,Helvetica,sans-serif;font-size: 18px;line-height: 30px;">
        Hello ${existingUser ? `<i style='color:#aebf76'>${existingUser.fullname}</i>,` : ''} 
        <br/><br/>
        ${referrerUser.fullname} has shared a video with you! 
        <br/><br/>
        Please <u style='color:#aebf76'><a href=${process.env.FRONTEND_URL}>${existingUser ? 'log in' : 'sign up'}</a></u> 
        to check it out and connect with other NetQwix Team Members.
        <br/><br/>
        Team NetQwix. 
        <br/>
        <img src=${NetquixImage.logo} style="object-fit: contain; width: 180px;"/>
        </div>`;

        if (existingUser) {
          // If the user exists, push their ID into userIds
          userIds.push(existingUser._id);

          
        } else {
          // Check if the email exists in the ReferredUser collection
          const existingReferredUser = await ReferredUser.findOne<any>({ email: inviteEmail });
  
          if (existingReferredUser) {
            // If the referred user exists, push their ID into userIds
            userIds.push(existingReferredUser._id);
          } else {
            // If the user doesn't exist in both collections, create a new referred user
            const referredUser = new ReferredUser({
              email: inviteEmail,
              referrerId: referrerUser._id,
            });
  
            // Save the referred user and push their ID into userIds
            const savedReferredUser = await referredUser.save();
            userIds.push(savedReferredUser._id);
          }
        }
        
        if(referrerUser._id !== existingUser._id){
          SendEmail.sendRawEmail(
            null,
            "",
            [inviteEmail],
            "Video Shared with You by " + referrerUser.fullname,
            null,
            emailBody
          );
        }

      } catch (error) {
        console.error(`Error processing invite for ${inviteEmail}:`, error);
        // You may want to handle the error further (e.g., log it, throw it, etc.)
      }
    }
  
    return userIds;
  }
  

  public async videoUploadUrl(req: any, res: Response) {
    try {
      if(!req.body.user_id){
        req.body.user_id = [req?.authUser?._id];
      }
      if (req.body.invites  && Array.isArray(req.body.invites)) {
        const userIds = await this.processInvites(req.body.invites, req.authUser);
        req.body.user_id = [...req.body.user_id ,  ...userIds];
      }

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
      const clipObj = new clip(req.body);
      
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
        .status(CONSTANCE.RES_CODE.success)
        .json({ success: 1, url: fileUrl, thumbnailURL , clipObj });
    } catch (error) {
      res.status(CONSTANCE.RES_CODE.error.internalServerError).json({
        success: 0,
        message: Message.internal,
      });
    }
  }

  public async profileImageUrl(req: any, res: Response) {
    try {
      req.body.user_id = req?.authUser?._id;
      var fileName =
        new Date().getTime().toString() +
        "." +
        req?.body?.fileType?.split("/")[1];
      req.body.file_name = fileName;
      await user.findByIdAndUpdate(req?.authUser?._id, {
        $set: { profile_picture: fileName },
      });
      let fileUrl = await this.generatePreSignedPutUrl(
        fileName,
        req?.body?.fileType
      );
      return res
        .status(CONSTANCE.RES_CODE.success)
        .json({ success: 1, url: fileUrl });
    } catch (error) {
      res.status(CONSTANCE.RES_CODE.error.internalServerError).json({
        success: 0,
        message: Message.internal,
      });
    }
  }

  public async sessionsVideoUploadUrl(req: any, res: Response) {
    try {
      req.body.user_id = req?.authUser?._id;
      var fileName =
        new Date().getTime().toString() +
        "." +
        req?.body?.fileType?.split("/")[1];
      req.body.file_name = fileName;
      const savedSessionObj = new savedSession(req.body);
      var savedSessionData = await savedSessionObj.save();
      console.log("SaveSession ", savedSessionData);
      let fileUrl = await this.generatePreSignedPutUrl(
        fileName,
        req?.body?.fileType
      );
      return res
        .status(CONSTANCE.RES_CODE.success)
        .json({ success: 1, url: fileUrl });
    } catch (error) {
      res.status(CONSTANCE.RES_CODE.error.internalServerError).json({
        success: 0,
        message: Message.internal,
      });
    }
  }

  public async getAllSavedSession(req: any, res: any) {
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

      const data = await savedSession.find(query);

      return res
        .status(CONSTANCE.RES_CODE.success)
        .json({ success: 1, data: data });
    } catch (error) {
      res.status(CONSTANCE.RES_CODE.error.internalServerError).json({
        success: 0,
        message: Message.internal,
      });
    }
  }

  public async pdfUploadUrl(req: any, res: Response) {
    try {
      var filename = "file-" + new Date().getTime().toString() + ".pdf";
      req.body.user_id = req?.authUser?._id;
      const clipObj = await booked_session.findOneAndUpdate(
        { _id: req.body.session_id },
        { report: filename }
      );
      let fileUrl = await this.generatePreSignedPutUrl(filename, "pdf");
      return res
        .status(CONSTANCE.RES_CODE.success)
        .json({ success: 1, url: fileUrl });
    } catch (error) {
      res.status(CONSTANCE.RES_CODE.error.internalServerError).json({
        success: 0,
        message: Message.internal,
      });
    }
  }

  public async getClips(req: any, res: Response) {
    try {
      const trainee_id = req.body.trainee_id ?? null;
  
      var clips = await clip.aggregate([
        {
          $match: {
            user_id: { 
              $in: [new mongoose.Types.ObjectId(trainee_id ?? req?.authUser?._id)] 
            },
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
  
      return res.status(CONSTANCE.RES_CODE.success).json({ data: clips });
    } catch (error) {
      res.status(CONSTANCE.RES_CODE.error.internalServerError).json({
        success: 0,
        message: Message.internal,
      });
    }
  }

  public async traineeClips(req: any, res: Response) {
    try {
      var clips = await book.aggregate([
        {
          $match: {
            trainer_id: new mongoose.Types.ObjectId(req?.authUser?._id),
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
                $project: Constant.pipelineUser,
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
      return res.status(CONSTANCE.RES_CODE.success).json({ data: clips });
    } catch (error) {
      res.status(CONSTANCE.RES_CODE.error.internalServerError).json({
        success: 0,
        message: Message.internal,
      });
    }
  }

  public async deleteClip(req: any, res: Response) {
    try {
      const { id } = req?.params;
      if (!mongoose.isValidObjectId(id)) {
        return res.status(CONSTANCE.RES_CODE.error.badRequest).json({
          success: 0,
          message: "Invalid ID",
        });
      }
      var clips = await clip.findByIdAndUpdate(id, { $set: { status: false } });
      if (!clips) {
        return res.status(CONSTANCE.RES_CODE.error.notFound).json({
          success: 0,
          message: Message.notFoundData,
        });
      }
      return res.status(CONSTANCE.RES_CODE.success).json({
        success: 1,
        message: "Clip deleted Successfully",
      });
    } catch (error) {
      res.status(CONSTANCE.RES_CODE.error.internalServerError).json({
        success: 0,
        message: Message.internal,
      });
    }
  }

  public async deleteSavedSession(req: any, res: Response) {
    try {
      const { id } = req?.params;
      if (!mongoose.isValidObjectId(id)) {
        return res.status(CONSTANCE.RES_CODE.error.badRequest).json({
          success: 0,
          message: "Invalid ID",
        });
      }
      var session = await savedSession.findByIdAndUpdate(id, {
        $set: { status: false },
      });
      if (!session) {
        return res.status(CONSTANCE.RES_CODE.error.notFound).json({
          success: 0,
          message: Message.notFoundData,
        });
      }
      return res.status(CONSTANCE.RES_CODE.success).json({
        success: 1,
        message: "Saved Session deleted Successfully",
      });
    } catch (error) {
      res.status(CONSTANCE.RES_CODE.error.internalServerError).json({
        success: 0,
        message: Message.internal,
      });
    }
  }

  public async generateThumbnail(req: any, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: 0, message: 'No video file uploaded.' });
      }
     
      const inputPath = req.file.path;
      const thumbnailDir = path.join(__dirname, '..', 'thumbnails'); // Adjust this path as needed
      const outputPath = path.join(thumbnailDir, `${req.file.filename}.jpg`);
  
      // Ensure the thumbnail directory exists
      if (!fs.existsSync(thumbnailDir)) {
        fs.mkdirSync(thumbnailDir, { recursive: true });
      }
  
      return new Promise<void>((resolve, reject) => {
        ffmpeg(inputPath)
          .screenshots({
            timestamps: ['00:00:01'],
            filename: `${req.file.filename}.jpg`,
            folder: thumbnailDir,
            size: "700x1100",
          })
          .on('end', () => {
            fs.unlinkSync(inputPath); // Remove the uploaded video file
  
            // Check if the thumbnail file exists
            if (!fs.existsSync(outputPath)) {
              reject(new Error('Thumbnail file not created'));
              return;
            }
  
            // Send the thumbnail file
            res.sendFile(outputPath, (err) => {
              if (err) {
                console.error('Error sending file:', err);
                reject(err);
              } else {
                // Remove the thumbnail file after sending
                fs.unlinkSync(outputPath);
                resolve();
              }
            });
          })
          .on('error', (err) => {
            console.error('Error generating thumbnail:', err);
            reject(err);
          });
      });
  
    } catch (error) {
      res.status(CONSTANCE.RES_CODE.error.internalServerError).json({
        success: 0,
        message: Message.internal,
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
