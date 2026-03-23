"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commonService = void 0;
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const path = require('path');
const fs = require('fs');
const path_1 = require("path");
const constance_1 = require("../../config/constance");
const clip_schema_1 = require("../../model/clip.schema");
const saved_sessions_schema_1 = require("../../model/saved_sessions.schema");
const booked_sessions_schema_1 = require("../../model/booked_sessions.schema");
const AWS = require("aws-sdk");
const mongoose_1 = require("mongoose");
const booked_sessions_schema_2 = require("../../model/booked_sessions.schema");
const constant_1 = require("../../Utils/constant");
const referred_user_schema_1 = require("../../model/referred.user.schema");
const sendEmail_1 = require("../../Utils/sendEmail");
const user_schema_1 = require("../../model/user.schema");
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
            }
            catch (err) {
                console.error("Error generating pre-signed URL:", err);
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
            }
            catch (cleanupError) {
                console.error('Error during cleanup:', cleanupError);
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
            const fileExtension = (0, path_1.extname)(uploadedFile.originalname).toLowerCase();
            if (!constance_1.allowedImageExtensions.includes(fileExtension)) {
                return res
                    .status(constance_1.CONSTANCE.RES_CODE.error.badRequest)
                    .json({ error: constance_1.Message.errors.allowedImageExtensions });
            }
            const fileSize = constance_1.MAX_FILE_SIZE_MB * constance_1.MAX_FILE_SIZE_MB;
            if (uploadedFile.size > fileSize) {
                return res
                    .status(constance_1.CONSTANCE.RES_CODE.error.badRequest)
                    .json({ error: constance_1.Message.errors.maxFileSizeMB });
            }
            const fileUrl = `${process.env.BASE_URL}/public/assets/${uploadedFile.filename}`;
            return res
                .status(constance_1.CONSTANCE.RES_CODE.success)
                .json({ success: 1, url: fileUrl });
        }
        catch (error) {
            res.status(constance_1.CONSTANCE.RES_CODE.error.internalServerError).json({
                success: 0,
                message: constance_1.Message.internal,
            });
        }
    }
    async processInvites(invites, referrerUser) {
        const existingUserIds = [];
        const newUserIds = [];
        for (const inviteEmail of invites) {
            try {
                // Check if a user with this email already exists in the User collection
                const existingUser = await user_schema_1.default.findOne({ email: inviteEmail });
                if (existingUser) {
                    // If the user exists, push their ID into userIds
                    existingUserIds.push(existingUser._id);
                }
                else {
                    // Check if the email exists in the ReferredUser collection
                    const existingReferredUser = await referred_user_schema_1.default.findOne({ email: inviteEmail });
                    if (existingReferredUser) {
                        // If the referred user exists, push their ID into userIds
                        newUserIds.push(existingReferredUser._id);
                    }
                    else {
                        // If the user doesn't exist in both collections, create a new referred user
                        const referredUser = new referred_user_schema_1.default({
                            email: inviteEmail,
                            referrerId: referrerUser._id,
                        });
                        // Save the referred user and push their ID into userIds
                        const savedReferredUser = await referredUser.save();
                        newUserIds.push(savedReferredUser._id);
                    }
                }
            }
            catch (error) {
                console.error(`Error processing invite for ${inviteEmail}:`, error);
                // You may want to handle the error further (e.g., log it, throw it, etc.)
            }
        }
        return { existingUserIds, newUserIds };
    }
    async videoUploadUrl(req, res) {
        try {
            const shareWithConstants = {
                myClips: "My Clips",
                myFriends: "Friends",
                newUsers: "New Users"
            };
            // Handle bulk upload
            if (Array.isArray(req.body.clips)) {
                const results = [];
                const { shareOptions } = req.body;
                let isNewUser = false;
                let processedUserIds = [];
                // Process invites if this is a share with new users
                if (shareOptions?.type === shareWithConstants.newUsers && shareOptions?.emails) {
                    const { existingUserIds, newUserIds } = await this.processInvites(shareOptions.emails, req.authUser);
                    isNewUser = newUserIds.length > 0;
                    processedUserIds = [...existingUserIds, ...newUserIds];
                }
                // Use selected friends if sharing with friends
                else if (shareOptions?.type === shareWithConstants.myFriends && shareOptions?.friends) {
                    processedUserIds = shareOptions.friends;
                }
                // Default to current user if sharing with my clips
                else {
                    processedUserIds = [req.authUser._id];
                }
                // Object to track users who need emails and their thumbnails with titles
                const usersToEmail = {};
                // Process each clip in the bulk upload
                for (const clipData of req.body.clips) {
                    const fileName = `${new Date().getTime()}_${Math.random().toString(36).substring(2, 9)}.${clipData.fileType.split("/")[1]}`;
                    const thumbnailFileName = `${new Date().getTime()}_${Math.random().toString(36).substring(2, 9)}.${clipData.thumbnail.split("/")[1]}`;
                    const clipPayload = {
                        ...clipData,
                        file_name: fileName,
                        thumbnail: thumbnailFileName,
                        user_id: processedUserIds
                    };
                    const fileUrl = await this.generatePreSignedPutUrl(fileName, clipData.fileType);
                    const thumbnailURL = await this.generatePreSignedPutUrl(thumbnailFileName, clipData.thumbnail);
                    // Save clips for all users
                    const savedClips = [];
                    for (const userId of processedUserIds) {
                        const clipObj = new clip_schema_1.default({ ...clipPayload, user_id: userId });
                        await clipObj.save();
                        savedClips.push(clipObj);
                        // Track users who need emails and collect their thumbnails
                        if ((isNewUser && shareOptions.type === shareWithConstants.newUsers) ||
                            (shareOptions.type === shareWithConstants.myFriends)) {
                            if (!usersToEmail[userId]) {
                                usersToEmail[userId] = {
                                    thumbnails: [],
                                    isNewUser: isNewUser && shareOptions.type === shareWithConstants.newUsers
                                };
                            }
                            usersToEmail[userId].thumbnails.push({
                                url: `https://data.netqwix.com/${clipObj.thumbnail}`,
                                title: clipObj.title || 'Untitled Video'
                            });
                        }
                    }
                    results.push({
                        success: 1,
                        url: fileUrl,
                        thumbnailURL,
                        clips: savedClips
                    });
                }
                // Send emails after all clips are processed
                for (const [userId, data] of Object.entries(usersToEmail)) {
                    const userData = data.isNewUser
                        ? await referred_user_schema_1.default.findById(userId)
                        : await user_schema_1.default.findById(userId);
                    if (userData) {
                        const templateName = data.isNewUser ? "clip-shared-new-user" : "clip-shared";
                        const isSingleVideo = data.thumbnails.length === 1;
                        // Prepare thumbnail HTML based on count
                        // Prepare thumbnail HTML based on count
                        let thumbnailsHTML = '';
                        let thumbnailsGridHTML = '';
                        if (isSingleVideo) {
                            const video = data.thumbnails[0];
                            thumbnailsHTML = video.url; // Just the URL for single image
                            thumbnailsGridHTML = `
                            <img src="${video.url}" alt="Video Thumbnail" style="width:100%; max-width: 200px; border: 1px solid #ddd; border-radius: 4px;"/>
                            <div style="margin-top: 5px; font-size: 14px; font-weight: bold;">${video.title}</div>
                          `;
                        }
                        else {
                            // Create grid of thumbnails for multiple videos with titles
                            thumbnailsGridHTML = data.thumbnails.map((video, index) => `
                               <td style="padding: 7px; vertical-align: top; width: 50%;">
                              <img src="${video.url}" alt="Video Thumbnail" style="width:100%; max-width: 200px; border: 1px solid #ddd; border-radius: 4px;"/>
                              <div style="margin-top: 5px; font-size: 14px; font-weight: bold;">${video.title}</div>
                            </td>
                              ${(index + 1) % 2 === 0 ? '</tr><tr>' : ''}
                          `).join('');
                        }
                        const displaySingle = data.thumbnails.length === 1 ? `
                          <div style="text-align: center; margin: 20px 0;">
                            ${thumbnailsGridHTML}
                          
                          </div>
                        ` : '';
                        const displayMultiple = data.thumbnails.length > 1 ? `
                          <div style="text-align: center; margin: 20px 0;">
                            <h3 style="margin-bottom: 15px;">Shared Videos:</h3>
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="max-width: 500px; margin: 0 auto;">
  <tr>
                              ${thumbnailsGridHTML}
                             </tr>
</table>
                        ` : '';
                        await sendEmail_1.SendEmail.sendRawEmail(templateName, {
                            "[TRAINER/TRAINEE NAME]": req.authUser.fullname,
                            "[TRAINER/TRAINEE NAME2]": req.authUser.fullname,
                            "[DISPLAY_SINGLE]": displaySingle,
                            "[DISPLAY_MULTIPLE]": displayMultiple,
                        }, [userData.email], `Your friend ${req.authUser.fullname} has shared ${data.thumbnails.length} video(s) in your NetQwix Locker!`);
                    }
                }
                return res.status(constance_1.CONSTANCE.RES_CODE.success).json({
                    success: 1,
                    results,
                    message: "Bulk upload processed successfully"
                });
            }
            // Handle single upload (legacy support)
            // ... (keep your existing single upload logic here)
        }
        catch (error) {
            console.error("Error in video upload URL:", error);
            res.status(constance_1.CONSTANCE.RES_CODE.error.internalServerError).json({
                success: 0,
                message: constance_1.Message.internal,
            });
        }
    }
    async profileImageUrl(req, res) {
        try {
            req.body.user_id = req?.authUser?._id;
            var fileName = new Date().getTime().toString() +
                "." +
                req?.body?.fileType?.split("/")[1];
            req.body.file_name = fileName;
            await user_schema_1.default.findByIdAndUpdate(req?.authUser?._id, {
                $set: { profile_picture: fileName },
            });
            let fileUrl = await this.generatePreSignedPutUrl(fileName, req?.body?.fileType);
            return res
                .status(constance_1.CONSTANCE.RES_CODE.success)
                .json({ success: 1, url: fileUrl });
        }
        catch (error) {
            res.status(constance_1.CONSTANCE.RES_CODE.error.internalServerError).json({
                success: 0,
                message: constance_1.Message.internal,
            });
        }
    }
    async sessionsVideoUploadUrl(req, res) {
        try {
            req.body.user_id = req?.authUser?._id;
            var fileName = new Date().getTime().toString() +
                "." +
                req?.body?.fileType?.split("/")[1];
            req.body.file_name = fileName;
            const savedSessionObj = new saved_sessions_schema_1.default(req.body);
            var savedSessionData = await savedSessionObj.save();
            let fileUrl = await this.generatePreSignedPutUrl(fileName, req?.body?.fileType);
            return res
                .status(constance_1.CONSTANCE.RES_CODE.success)
                .json({ success: 1, url: fileUrl });
        }
        catch (error) {
            res.status(constance_1.CONSTANCE.RES_CODE.error.internalServerError).json({
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
        }
        catch (error) {
            res.status(constance_1.CONSTANCE.RES_CODE.error.internalServerError).json({
                success: 0,
                message: constance_1.Message.internal,
            });
        }
    }
    async pdfUploadUrl(req, res) {
        try {
            var filename = "file-" + new Date().getTime().toString() + ".pdf";
            req.body.user_id = req?.authUser?._id;
            const clipObj = await booked_sessions_schema_2.default.findOneAndUpdate({ _id: req.body.session_id }, { report: filename });
            let fileUrl = await this.generatePreSignedPutUrl(filename, "pdf");
            return res
                .status(constance_1.CONSTANCE.RES_CODE.success)
                .json({ success: 1, url: fileUrl });
        }
        catch (error) {
            res.status(constance_1.CONSTANCE.RES_CODE.error.internalServerError).json({
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
                        user_id: {
                            $in: [new mongoose_1.default.Types.ObjectId(trainee_id ?? req?.authUser?._id)]
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
            return res.status(constance_1.CONSTANCE.RES_CODE.success).json({ data: clips });
        }
        catch (error) {
            res.status(constance_1.CONSTANCE.RES_CODE.error.internalServerError).json({
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
                        trainer_id: new mongoose_1.default.Types.ObjectId(req?.authUser?._id),
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
            return res.status(constance_1.CONSTANCE.RES_CODE.success).json({ data: clips });
        }
        catch (error) {
            res.status(constance_1.CONSTANCE.RES_CODE.error.internalServerError).json({
                success: 0,
                message: constance_1.Message.internal,
            });
        }
    }
    async deleteClip(req, res) {
        try {
            const { id } = req?.params;
            if (!mongoose_1.default.isValidObjectId(id)) {
                return res.status(constance_1.CONSTANCE.RES_CODE.error.badRequest).json({
                    success: 0,
                    message: "Invalid ID",
                });
            }
            var clips = await clip_schema_1.default.findByIdAndUpdate(id, { $set: { status: false } });
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
        }
        catch (error) {
            res.status(constance_1.CONSTANCE.RES_CODE.error.internalServerError).json({
                success: 0,
                message: constance_1.Message.internal,
            });
        }
    }
    async deleteSavedSession(req, res) {
        try {
            const { id } = req?.params;
            if (!mongoose_1.default.isValidObjectId(id)) {
                return res.status(constance_1.CONSTANCE.RES_CODE.error.badRequest).json({
                    success: 0,
                    message: "Invalid ID",
                });
            }
            var session = await saved_sessions_schema_1.default.findByIdAndUpdate(id, {
                $set: { status: false },
            });
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
        }
        catch (error) {
            res.status(constance_1.CONSTANCE.RES_CODE.error.internalServerError).json({
                success: 0,
                message: constance_1.Message.internal,
            });
        }
    }
    async generateThumbnail(req, res) {
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
            return new Promise((resolve, reject) => {
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
                        }
                        else {
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
        }
        catch (error) {
            res.status(constance_1.CONSTANCE.RES_CODE.error.internalServerError).json({
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
    async featuredContentUploadUrl(req, res) {
        try {
            if (!req.body.user_id) {
                req.body.user_id = [req?.authUser?._id];
            }
            if (req.body.invites && Array.isArray(req.body.invites)) {
                const { existingUserIds, newUserIds } = await this.processInvites(req.body.invites, req.authUser);
                req.body.user_id = [...req.body.user_id, ...existingUserIds, ...newUserIds];
            }
            if (!req?.body?.fileType || !req?.body?.thumbnail) {
                return res.status(constance_1.CONSTANCE.RES_CODE.error.badRequest).json({
                    success: 0,
                    message: "fileType and thumbnail are required.",
                });
            }
            const timestamp = new Date().getTime().toString();
            const fileType = req?.body?.fileType?.split("/")[1];
            const thumbnailType = req?.body?.thumbnail?.split("/")[1];
            if (!fileType || !thumbnailType) {
                return res.status(constance_1.CONSTANCE.RES_CODE.error.badRequest).json({
                    success: 0,
                    message: "Invalid fileType or thumbnail format.",
                });
            }
            const fileName = `${timestamp}.${fileType}`;
            const thumbnailFileName = `${timestamp}.${thumbnailType}`;
            req.body.file_name = fileName;
            req.body.thumbnail = thumbnailFileName;
            const fileUrl = await this.generatePreSignedPutUrl(fileName, req.body.fileType);
            const thumbnailURL = await this.generatePreSignedPutUrl(thumbnailFileName, req.body.thumbnail);
            if (!fileUrl || !thumbnailURL) {
                return res.status(constance_1.CONSTANCE.RES_CODE.error.internalServerError).json({
                    success: 0,
                    message: "Failed to generate pre-signed URLs.",
                });
            }
            return res.status(constance_1.CONSTANCE.RES_CODE.success).json({
                success: 1,
                url: fileUrl,
                thumbnailURL,
            });
        }
        catch (error) {
            console.error("Error in featuredContentUploadUrl:", error);
            return res.status(constance_1.CONSTANCE.RES_CODE.error.internalServerError).json({
                success: 0,
                message: constance_1.Message.internal,
                error: error.message
            });
        }
    }
}
exports.commonService = commonService;
//# sourceMappingURL=commonService.js.map