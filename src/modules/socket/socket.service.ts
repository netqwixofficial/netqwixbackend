import { Readable } from "stream";
import { MemCache } from "../../Utils/memCache";
import { EVENTS } from "../../config/constance";
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const axios = require("axios");
import savedSession from "../../model/saved_sessions.schema";
import * as AWS from "aws-sdk";
import onlineUser from "../../model/online_user.schema";
import * as webpush from "web-push";
import notification from "../../model/notifications.schema";
import user from "../../model/user.schema";
import { NotificationType } from "../../enum/notification.enum";
import mongoose from "mongoose";
const logoPath = path.resolve(__dirname, "../../assets/netqwix_logo.png");

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

//NOTE -  Set VAPID details
webpush.setVapidDetails(
  "mailto:example@yourdomain.org",
  process.env.WEB_PUSH_PUBLIC_KEY,
  process.env.WEB_PUSH_PRIVATE_KEY
);

let activeUsers = {};

// Update user's activity status
async function updateUserActivity(socket) {
  try {
    const userId = socket.user._id;

    // Add the current user to the active users list

    if (socket?.user?._doc?.account_type === "Trainer") {
      activeUsers[userId] = { ...socket.user._doc };

      if (socket.user._doc._id) {
        const checkIfUserIsAlreadyAdded = await onlineUser.findOne({
          trainer_id: new mongoose.Types.ObjectId(socket.user._doc._id),
        });

        // console.log(
        //   "checkIfUserIsAlreadyAdded=========",
        //   checkIfUserIsAlreadyAdded
        // );

        if (checkIfUserIsAlreadyAdded) {
          await onlineUser.updateOne(
            { trainer_id: socket.user._doc._id },
            { $set: { last_activity_time: Date.now() } }
          );
        } else {
          const createNewOnlineUser = new onlineUser({
            trainer_id: socket.user._doc._id,
            last_activity_time: Date.now(),
          }).save();
        }
      }
    }

    // Broadcast the updated active users list to all connected clients
    socket.broadcast.emit("userStatus", {
      user: activeUsers,
      status: "online",
      userId,
    });

    socket.emit("onlineUser", {
      user: activeUsers,
      status: "online",
      userId,
    });

    socket.on("disconnect", async () => {
      if (!activeUsers[userId]) return;

      // Remove the user from the active users list
      delete activeUsers[userId];

      // Broadcast the updated active users list to all connected clients
      socket.broadcast.emit("userStatus", {
        user: activeUsers,
        status: "offline",
        userId,
      });

      // Update the user's last_activity_time instead of deleting them
      try {
        await onlineUser.updateOne(
          { trainer_id: userId },
          { $set: { last_activity_time: Date.now() } },
          { upsert: true } // Ensures the document exists or creates it
        );
      } catch (error) {
        console.error("Error updating last_activity_time on disconnect:", error);
      }
    });

    // Listen for any event to update the user's last activity time
    socket.on("userInteraction", () => {
      if (activeUsers[userId]) {
        activeUsers[userId].lastActivityTime = Date.now();
      }
    });
  } catch (error) {
    console.log("error for online Users", error)
  }

}

export const handleSocketEvents = (socket, connections = {}) => {
  socket.on(EVENTS.JOIN_ROOM, async (socketReq, request) => {
    const { roomName } = socketReq;
    handleRoomJoinEvent(roomName);
  });

  socket.on(EVENTS.VIDEO_CALL.ON_OFFER, ({ offer, userInfo }) => {
    const toUserId = MemCache.getDetail(
      process.env.SOCKET_CONFIG,
      userInfo?.to_user
    );
    console.log(`EVENTS.VIDEO_CALL.ON_OFFER on offer --- `, userInfo);
    console.log(`EVENTS.VIDEO_CALL.ON_OFFER to userID --- `, toUserId);
    socket.to(toUserId).emit("offer", offer);
    // TODO:for now broadcasting the event, it needs to send to specific user.
    // socket.broadcast.emit('offer', offer);
  });

  socket.on(EVENTS.VIDEO_CALL.ON_CALL_JOIN, ({ userInfo }) => {
    const toUserId = MemCache.getDetail(
      process.env.SOCKET_CONFIG,
      userInfo?.to_user
    );
    console.log(`userInfo --- `, userInfo);
    socket.to(toUserId).emit(EVENTS.VIDEO_CALL.ON_CALL_JOIN, { userInfo });
    // TODO:for now broadcasting the event, it needs to send to specific user.
    // socket.broadcast.emit('offer', offer);
  });

  // socket.on(EVENTS.VIDEO_CALL.ON_ANSWER, (data) => {
  //     // Broadcast the answer to the other connected peers
  //     console.log(`on answer --- `, data);
  //     socket.broadcast.emit('answer', data);
  // });

  socket.on(EVENTS.VIDEO_CALL.ON_ICE_CANDIDATE, (data) => {
    const { userInfo } = data;
    const toUserSocketId = MemCache.getDetail(
      process.env.SOCKET_CONFIG,
      userInfo?.to_user
    );

    // Broadcast the ICE candidate to the other connected peers
    socket.to(toUserSocketId).emit("ice-candidate", data);
  });

  socket.on(EVENTS.EMIT_CLEAR_CANVAS, (payload) => {
    const { userInfo } = payload;
    const toUserSocketId = MemCache.getDetail(
      process.env.SOCKET_CONFIG,
      userInfo?.to_user
    );
    socket.to(toUserSocketId).emit(EVENTS.ON_CLEAR_CANVAS, {});
  });

  socket.on(EVENTS.EMIT_UNDO, (payload) => {
    const { userInfo } = payload;
    const toUserSocketId = MemCache.getDetail(
      process.env.SOCKET_CONFIG,
      userInfo?.to_user
    );

    socket.to(toUserSocketId).emit(EVENTS.ON_UNDO, payload);
  });

  socket.on(EVENTS.VIDEO_CALL.MUTE_ME, ({ muteStatus, userInfo }) => {
    const toUserSocketId = MemCache.getDetail(
      process.env.SOCKET_CONFIG,
      userInfo?.to_user
    );

    socket.to(toUserSocketId).emit(EVENTS.VIDEO_CALL.MUTE_ME, { muteStatus });
  });

  socket.on(EVENTS.VIDEO_CALL.STOP_FEED, ({ feedStatus, userInfo }) => {
    const toUserSocketId = MemCache.getDetail(
      process.env.SOCKET_CONFIG,
      userInfo?.to_user
    );
    socket.to(toUserSocketId).emit(EVENTS.VIDEO_CALL.STOP_FEED, { feedStatus });
  });

  socket.on(EVENTS.VIDEO_CALL.ON_CLOSE, (payload) => {
    const { userInfo } = payload;
    const toUserSocketId = MemCache.getDetail(
      process.env.SOCKET_CONFIG,
      userInfo?.to_user
    );

    socket.to(toUserSocketId).emit(EVENTS.VIDEO_CALL.ON_CLOSE, {});
  });

  // Listen for userActivity event
  // socket.on('userActivity', (data) => {
  updateUserActivity(socket);
  // });

  const handleRoomJoinEvent = (roomName: string) => {
    // const peerConnection = new RTCPeerConnection();
  };

  listenDrawEvent(socket);
  stopDrawEvent(socket);
  listenShowVideoEvent(socket);
  listenVideoPositionEvent(socket)
  listenPlayPauseVideoEvent(socket);
  listenVideoTimeEvent(socket);
  listenVideoShowEvent(socket);
  listenDrawingModeToggle(socket);
  listenFullscreenToggle(socket);
  listenLockModeToggle(socket);

  listenVideoChunksEvent(socket);
  listenNotificationEvents(socket);
};

const listenNotificationEvents = (socket) => {
  try {
    socket.on(EVENTS.PUSH_NOTIFICATIONS.ON_SEND, async (payload: any) => {
      const { title, description, senderId, receiverId, bookingInfo, type } = payload;
      const toUserSocketId = MemCache.getDetail(
        process.env.SOCKET_CONFIG,
        receiverId
      );
      // console.log(toUserSocketId, 'toUserSocketId')
      const sender = await user.findById(senderId);
      const receiver = await user.findById(receiverId);
      const newNotifications = await notification.create({
        title,
        description,
        senderId,
        receiverId,
        type: type ?? NotificationType.DEFAULT
      });
      // console.log(sender, 'sender')
      // console.log(receiver, 'receiver')
      // console.log(newNotifications, 'newNotifications')
      const subscription = JSON.parse(receiver?.subscriptionId);
      // console.log(subscription, 'subscription')
      socket.to(toUserSocketId).emit(EVENTS.PUSH_NOTIFICATIONS.ON_RECEIVE, {
        _id: newNotifications?._id,
        title: newNotifications?.title,
        description: newNotifications?.description,
        createdAt: newNotifications?.createdAt,
        isRead: newNotifications?.isRead,
        sender: {
          _id: sender?._id,
          name: sender?.fullname,
          profile_picture: sender?.profile_picture || null,
        },
        bookingInfo,
      });
      if (subscription) {
        try {
          console.log("Enter in web push", subscription);
          await webpush.sendNotification(
            subscription,
            JSON.stringify({ title, description })
          );
        } catch (error) {
          console.error("Error sending push notification:", error);
        }
      }
    });
  } catch (err) {
    console.log(`while listen draw event `, err);
    throw err;
  }
};

const listenDrawEvent = (socket) => {
  try {
    socket.on(EVENTS.DRAW, async (socketReq, request) => {
      const { userInfo } = socketReq;
      const toUserSocketId = MemCache.getDetail(
        process.env.SOCKET_CONFIG,
        userInfo?.to_user
      );
      // Broadcast the offer to the other connected peers
      // console.log(`toUserSocketId --- `, toUserSocketId);
      // console.log(`socket req ==== `, socketReq, socket.id)
      socket.to(toUserSocketId).emit(EVENTS.EMIT_DRAWING_CORDS, socketReq);
    });
  } catch (err) {
    console.log(`while listen draw event `, err);
    throw err;
  }
};

const stopDrawEvent = (socket) => {
  try {
    socket.on(EVENTS.STOP_DRAWING, async (socketReq, request) => {
      const { userInfo } = socketReq;
      const toUserSocketId = MemCache.getDetail(
        process.env.SOCKET_CONFIG,
        userInfo?.to_user
      );

      socket.to(toUserSocketId).emit(EVENTS.EMIT_STOP_DRAWING, socketReq);
    });
  } catch (err) {
    console.log(`while stop draw event `, err);
    throw err;
  }
};

const listenVideoShowEvent = (socket) => {
  try {
    socket.on(EVENTS.ON_VIDEO_SHOW, async (socketReq, request) => {
      const { userInfo } = socketReq;
      const toUserSocketId = MemCache.getDetail(
        process.env.SOCKET_CONFIG,
        userInfo?.to_user
      );
      socket.to(toUserSocketId).emit(EVENTS.ON_VIDEO_SHOW, socketReq);
    });
  } catch (err) {
    console.log(`while listen video show event `, err);
    throw err;
  }
};

const listenDrawingModeToggle = (socket) => {
  try {
    socket.on(EVENTS.TOGGLE_DRAWING_MODE, async (socketReq, request) => {
      const { userInfo } = socketReq;
      const toUserSocketId = MemCache.getDetail(
        process.env.SOCKET_CONFIG,
        userInfo?.to_user
      );
      socket.to(toUserSocketId).emit(EVENTS.TOGGLE_DRAWING_MODE, socketReq);
    });
  } catch (err) {
    console.log(`while listen drawing mode toggle `, err);
    throw err;
  }
};

const listenFullscreenToggle = (socket) => {
  try {
    socket.on(EVENTS.TOGGLE_FULL_SCREEN, async (socketReq, request) => {
      const { userInfo } = socketReq;
      const toUserSocketId = MemCache.getDetail(
        process.env.SOCKET_CONFIG,
        userInfo?.to_user
      );
      socket.to(toUserSocketId).emit(EVENTS.TOGGLE_FULL_SCREEN, socketReq);
    });
  } catch (err) {
    console.log(`while listen fullscreen toggle `, err);
    throw err;
  }
};

const listenLockModeToggle = (socket) => {
  try {
    socket.on(EVENTS.TOGGLE_LOCK_MODE, async (socketReq, request) => {
      const { userInfo } = socketReq;
      const toUserSocketId = MemCache.getDetail(
        process.env.SOCKET_CONFIG,
        userInfo?.to_user
      );
      socket.to(toUserSocketId).emit(EVENTS.TOGGLE_LOCK_MODE, socketReq);
    });
  } catch (err) {
    console.log(`while listen lock mode toggle `, err);
    throw err;
  }
};



const listenVideoPositionEvent = (socket) => {
  try {
    socket.on(EVENTS.ON_VIDEO_ZOOM_PAN, async (socketReq, request) => {
      const { userInfo } = socketReq;
      const toUserSocketId = MemCache.getDetail(
        process.env.SOCKET_CONFIG,
        userInfo?.to_user
      );
      socket.to(toUserSocketId).emit(EVENTS.ON_VIDEO_ZOOM_PAN, socketReq);
    });
  } catch (err) {
    console.log(`while listen draw event `, err);
    throw err;
  }
};

const listenShowVideoEvent = (socket) => {
  try {
    socket.on(EVENTS.ON_VIDEO_SELECT, async (socketReq, request) => {
      const { userInfo } = socketReq;
      const toUserSocketId = MemCache.getDetail(
        process.env.SOCKET_CONFIG,
        userInfo?.to_user
      );
      socket.to(toUserSocketId).emit(EVENTS.ON_VIDEO_SELECT, socketReq);
    });
  } catch (err) {
    console.log(`while listen draw event `, err);
    throw err;
  }
};

const listenPlayPauseVideoEvent = (socket) => {
  try {
    socket.on(EVENTS.ON_VIDEO_PLAY_PAUSE, async (socketReq, request) => {
      const { userInfo } = socketReq;
      const toUserSocketId = MemCache.getDetail(
        process.env.SOCKET_CONFIG,
        userInfo?.to_user
      );
      socket.to(toUserSocketId).emit(EVENTS.ON_VIDEO_PLAY_PAUSE, socketReq);
    });
  } catch (err) {
    console.log(`while listen draw event `, err);
    throw err;
  }
};
const listenVideoTimeEvent = (socket) => {
  try {
    socket.on(EVENTS.ON_VIDEO_TIME, async (socketReq, request) => {
      const { userInfo } = socketReq;
      const toUserSocketId = MemCache.getDetail(
        process.env.SOCKET_CONFIG,
        userInfo?.to_user
      );
      socket.to(toUserSocketId).emit(EVENTS.ON_VIDEO_TIME, socketReq);
    });
  } catch (err) {
    console.log(`while listen draw event `, err);
    throw err;
  }
};

const generatePreSignedPutUrl = async (fileName, fileType) => {
  const params = {
    Bucket: bucketName,
    Key: fileName,
    Expires: 60,
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

const chunks = []; // Array to store received chunks
let videoData: any;
let ffmpegProcess: any;

const listenVideoChunksEvent = (socket) => {
  socket.on("chunk", (chunkData) => {
    const actualChunk = Buffer.from(chunkData?.data); // Assuming chunkData.data is the correct field

    // chunks.push(actualChunk);
    chunks.push(...chunkData?.data); // Push the buffers directly

    console.log("Received chunk:", actualChunk);
  });

  socket.on("videoUploadData", (data) => {
    videoData = data;
  });


  // socket.on(EVENTS.ON_DISCONNECT, () => {
  //   console.log(`socket disconnected`);
  //   try {
  //     console.log("All chunks received", chunks);

  //     // Ensure that chunks array is defined
  //     if (!Array.isArray(chunks)) {
  //       console.log("Invalid chunks array");
  //       return;
  //     }

  //     // Concatenate all chunks into a single buffer
  //     const combinedBuffer = Buffer.concat(chunks);

  //     // Write the buffer to a file
  //     const fileName = `webcam-${Date.now()}.mp4`;

  //     //const writable = fs.createWriteStream(fileName);
  //     //const readable = Readable.from([combinedBuffer]);
  //     //readable.pipe(writable);

  //     // writable.on("finish", () => {
  //     //   console.log("Video file saved:", fileName);
  //     // });

  //     const ffmpegArgs = [
  //       "-i",
  //       "pipe:0",
  //       "-c:v",
  //       "libx264",
  //       "-crf",
  //       "18",
  //       "-c:a",
  //       "aac",
  //       "-b:a",
  //       "128k",
  //       "-movflags",
  //       "frag_keyframe+empty_moov",
  //       "-f",
  //       "mp4",
  //       "pipe:1"
  //     ];
  //     // ffmpegArgs.push("-v", "debug");
  //     ffmpegProcess = spawn("ffmpeg", ffmpegArgs);
  //     ffmpegProcess.stdin.write(combinedBuffer);
  //     ffmpegProcess.stdin.end();
  //     // ffmpegProcess.stdout.on("data", (data) => {
  //     //   console.log(`child stdout:\n${data.toString()}`);
  //     // });
  //     ffmpegProcess.stderr.on("data", (data) => {
  //       console.log("ffmpeg stdout:", data.toString());
  //     });

  //     ffmpegProcess.on("exit", function (code, signal) {
  //       console.log(
  //         "child process exited with " + `code ${code} and signal ${signal}`
  //       );
  //     });

  //     const outputFilePath = fileName;
  //     const fileStream = fs.createWriteStream(outputFilePath);
  //     ffmpegProcess.stdout.pipe(fileStream);

  //     const payload = {
  //       file_name: fileName,
  //       fileType: "video/mp4",
  //       title: "Meeting recording",
  //       category: "Recording",
  //       sessions: videoData?.sessions,
  //       trainer: videoData?.trainer,
  //       trainee: videoData?.trainee,
  //       user_id: videoData?.user_id,
  //       trainee_name: videoData?.trainee_name,
  //       trainer_name: videoData?.trainer_name
  //     };

  //     ffmpegProcess.on("close", (code) => {
  //       if (code !== 0) {
  //         console.error("FFmpeg exited with non-zero code:", code);
  //         // Handle conversion failure - e.g., notify user, log error, retry
  //       } else {
  //         console.log("Conversion successful!");
  //         console.log("Stream readable:", ffmpegProcess.stdout.readable);
  //         const fileData = fs.readFileSync(fileName);
  //         generatePreSignedPutUrl(fileName, "video/mp4").then(async (url) => {
  //           await axios
  //             .put(url, fileData, {
  //               headers: { "Content-Type": "video/*" }
  //             })
  //             .then(async (response) => {
  //               const savedSessionObj = new savedSession(payload);
  //               var savedSessionData = await savedSessionObj.save();
  //               console.log("SaveSession ", savedSessionData);
  //               console.log(`response while uploading video `, response);
  //               fs.unlink(fileName, (err) => {
  //                 if (err)
  //                   console.error("Error deleting file after upload:", err);
  //               });
  //             })
  //             .catch((error) => {
  //               console.log(`error while uploading video `, error);
  //             });
  //         });
  //         // ... (S3 upload logic as before) ...
  //       }
  //     });
  //     if (chunks.length > 0) {
  //       console.log("Called");
  //     }

  //     // Write the buffer to a file
  //     //   const fileName = `output-${Date.now()}.webm`;
  //     //   const writable = fs.createWriteStream(fileName);
  //     //   const readable = Readable.from([combinedBuffer]);
  //     //   readable.pipe(writable);

  //     //   writable.on('finish', () => {
  //     //       console.log('Video file saved:', fileName);
  //     //   });

  //     // const myHeaders = new Headers({ "Content-Type": "video/*" });
  //     // const fileName = `webcam-${Date.now()}.webm`;

  //     // const payload = {
  //     //   file_name: fileName,
  //     //   fileType: "video/webm",
  //     //   title: "Meeting recording",
  //     //   category: "Recording",
  //     //   sessions: videoData?.sessions,
  //     //   trainer: videoData?.trainer,
  //     //   trainee: videoData?.trainee,
  //     //   user_id: videoData?.user_id,
  //     //   trainee_name: videoData?.trainee_name,
  //     //   trainer_name: videoData?.trainer_name
  //     // };
  //     // if (chunks.length > 0) {
  //     //   generatePreSignedPutUrl(fileName, "video/webm").then(async (url) => {
  //     //     await axios
  //     //       .put(url, combinedBuffer, {
  //     //         headers: myHeaders
  //     //       })
  //     //       .then(async (response) => {
  //     //         const savedSessionObj = new savedSession(payload);
  //     //         var savedSessionData = await savedSessionObj.save();
  //     //         console.log("SaveSession ", savedSessionData);
  //     //         console.log(`response while uploading video `, response);
  //     //       })
  //     //       .catch((error) => {
  //     //         console.log(`error while uploading video `, error);
  //     //       });
  //     //   });
  //     // }

  //     chunks.length = 0;
  //   } catch (error) {
  //     console.log("Error processing chunks:", error);
  //   }
  // });
};

/**
  * Position:
  * The basic syntax is overlay=x:y, where x and y are the coordinates for the top-left corner of the watermark.

  * Top-left corner: overlay=0:0
  * Top-right corner: overlay=main_w-overlay_w:0
  * Bottom-left corner: overlay=0:main_h-overlay_h
  * Bottom-right corner: overlay=main_w-overlay_w:main_h-overlay_h
  * Center: overlay=(main_w-overlay_w)/2:(main_h-overlay_h)/2

  * You can also add or subtract pixels for fine-tuning, e.g., overlay=main_w-overlay_w-10:main_h-overlay_h-10
  Transparency:
  * Add transparency to the watermark: overlay=x:y:alpha=0.5
  * This sets the watermark to 50% opacity. Adjust the value (0.0 to 1.0) as needed.
  * Scaling:
  * Scale the watermark: overlay=x:y:scale=0.5
  * This scales the watermark to 50% of its original size.
  * Timing:
  * Apply watermark after 5 seconds: overlay=x:y:enable='gte(t,5)'
  * Remove watermark after 15 seconds: overlay=x:y:enable='between(t,5,15)'
  * Combining options:
  * You can combine these options. For example:
  * overlay=(main_w-overlay_w)/2:(main_h-overlay_h)/2:alpha=0.7:scale=0.5
  * 
  * const watermarkX = "(main_w-overlay_w)/2";  // Center horizontally
  * const watermarkY = "(main_h-overlay_h)/2";  // Center vertically
  * const watermarkOpacity = 0.7;  // 70% opacity

  * const ffmpegArgs = [
    "-filter_complex", `overlay=${watermarkX}:${watermarkY}:alpha=${watermarkOpacity}`,
  ];
 */
