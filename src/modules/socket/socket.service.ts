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
import booked_session from "../../model/booked_sessions.schema";
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
let ioInstance: any = null; // Store io instance for emitting events from services

// Set the io instance (called from socket init)
export const setIoInstance = (io: any) => {
  ioInstance = io;
};

// Lesson session state tracking - backend is authoritative for timer start
type LessonSessionState = {
  sessionId: string; // booked_session._id
  coachJoined: boolean;
  userJoined: boolean;
  startedAt: number | null; // unix timestamp (ms) - authoritative backend time
  duration: number; // in seconds, calculated from session_start_time and session_end_time
  warningTimeoutId?: NodeJS.Timeout | null;
  endTimeoutId?: NodeJS.Timeout | null;
};

const lessonSessions: Map<string, LessonSessionState> = new Map();

// Update user's activity status
async function updateUserActivity(socket) {
  try {
    const userId = socket.user._id;

    // Add the current user to the active users list

    if (socket?.user?._doc?.account_type === "Trainer") {
      activeUsers[userId] = { ...socket.user._doc };
      if (socket.user._doc._id) {
        const checkIfUserIsAlreadyAdded = await onlineUser.findOne({
          trainer_id: socket.user._doc._id,
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
          const createNewOnlineUser = await new onlineUser({
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

      // Clean up timer state if user disconnects during a session
      // Reset their join status but don't stop the timer if it's already started
      const accountType = socket?.user?._doc?.account_type || socket?.user?.account_type;
      for (const [sessionId, session] of lessonSessions.entries()) {
        if (accountType === "Trainer" && session.coachJoined) {
          session.coachJoined = false;
          console.log(`[TIMER] Trainer ${userId} disconnected from session ${sessionId}`);
        } else if (accountType !== "Trainer" && session.userJoined) {
          session.userJoined = false;
          console.log(`[TIMER] Trainee ${userId} disconnected from session ${sessionId}`);
        }
      }
    });

    // Listen for any event to update the user's last activity time
    socket.on("userInteraction", () => {
      if (activeUsers[userId]) {
        activeUsers[userId].lastActivityTime = Date.now();
      }
    });
  } catch (error) {
    console.error("Error for online Users", error)
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
    socket.to(toUserId).emit("offer", offer);
    // TODO:for now broadcasting the event, it needs to send to specific user.
    // socket.broadcast.emit('offer', offer);
  });

  socket.on(EVENTS.VIDEO_CALL.ON_CALL_JOIN, async ({ userInfo }) => {
    const toUserId = MemCache.getDetail(
      process.env.SOCKET_CONFIG,
      userInfo?.to_user
    );
    
    // Track join state for timer logic - sessionId is booked_session._id
    const sessionId = userInfo?.sessionId || userInfo?.meetingId || userInfo?.lessonId;
    if (sessionId && mongoose.isValidObjectId(sessionId)) {
      let session = lessonSessions.get(sessionId);
      if (!session) {
        // Fetch booked session to get duration
        try {
          const bookedSession = await booked_session.findById(sessionId);
          if (bookedSession) {
            // Calculate duration from start_time and end_time (Date objects) if available
            // Otherwise calculate from session_start_time and session_end_time (string HH:mm)
            let durationSeconds = 30 * 60; // default 30 minutes
            if (bookedSession.start_time && bookedSession.end_time) {
              durationSeconds = Math.floor((bookedSession.end_time.getTime() - bookedSession.start_time.getTime()) / 1000);
            } else if (bookedSession.session_start_time && bookedSession.session_end_time) {
              // Parse HH:mm strings and calculate duration
              const [startH, startM] = bookedSession.session_start_time.split(':').map(Number);
              const [endH, endM] = bookedSession.session_end_time.split(':').map(Number);
              const startMinutes = startH * 60 + startM;
              const endMinutes = endH * 60 + endM;
              durationSeconds = (endMinutes - startMinutes) * 60; // convert to seconds
            }
            
            session = {
              sessionId,
              coachJoined: false,
              userJoined: false,
              startedAt: null,
              duration: durationSeconds > 0 ? durationSeconds : 30 * 60,
              warningTimeoutId: null,
              endTimeoutId: null,
            };
            lessonSessions.set(sessionId, session);
            console.log(`[TIMER] Session ${sessionId} initialized with duration ${session.duration}s`);
          }
        } catch (err) {
          console.error("Error fetching booked session for timer:", err);
        }
      }
      
      if (session) {
        // Determine if this is coach (Trainer) or user (Trainee) based on account_type
        const accountType = socket?.user?._doc?.account_type || socket?.user?.account_type;
        const userId = socket?.user?._doc?._id || socket?.user?._id;
        
        if (accountType === "Trainer") {
          session.coachJoined = true;
          console.log(`[TIMER] Trainer ${userId} joined session ${sessionId}. Coach joined: ${session.coachJoined}, User joined: ${session.userJoined}`);
        } else {
          session.userJoined = true;
          console.log(`[TIMER] Trainee ${userId} joined session ${sessionId}. Coach joined: ${session.coachJoined}, User joined: ${session.userJoined}`);
        }
        
        // Check if both parties have joined - if so, start the timer immediately
        if (session.coachJoined && session.userJoined && session.startedAt === null) {
          const now = Date.now();
          session.startedAt = now;
          
          const roomName = `session:${sessionId}`;
          socket.join(roomName);
          const otherSocketId = MemCache.getDetail(process.env.SOCKET_CONFIG, userInfo?.to_user);
          if (otherSocketId) {
            const otherSocket = socket.nsp.sockets.get(otherSocketId);
            if (otherSocket) {
              otherSocket.join(roomName);
            }
          }
          
          // Emit timer start event immediately when both join
          const timerPayload = {
            sessionId: session.sessionId,
            startedAt: session.startedAt,
            duration: session.duration,
          };
          
          console.log(`[TIMER] [${new Date().toISOString()}] Both parties joined! Starting timer for session ${sessionId} at ${new Date(session.startedAt).toISOString()}, duration: ${session.duration}s`);
          
          socket.nsp.to(roomName).emit(EVENTS.LESSON_TIMER.STARTED, timerPayload);
          
          // Schedule warning at 30 seconds remaining
          const totalMs = session.duration * 1000;
          const warningMs = totalMs - 30 * 1000;
          if (warningMs > 0) {
            session.warningTimeoutId = setTimeout(() => {
              // Calculate session end time
              const sessionEndTime = new Date(session.startedAt + totalMs);
              socket.nsp.to(roomName).emit(EVENTS.LESSON_TIMER.WARNING, {
                sessionId: session.sessionId,
                remainingSeconds: 30,
                sessionEndTime: sessionEndTime.toISOString(),
              });
              console.log(`[TIMER] [${new Date().toISOString()}] Warning: 30 seconds remaining for session ${sessionId} at ${sessionEndTime.toISOString()}`);
            }, warningMs);
          }
          
          // Schedule time ended
          session.endTimeoutId = setTimeout(() => {
            const endedAt = new Date(session.startedAt + totalMs);
            socket.nsp.to(roomName).emit(EVENTS.LESSON_TIMER.ENDED, {
              sessionId: session.sessionId,
              endedAt: endedAt.toISOString(),
            });
            console.log(`[TIMER] [${new Date().toISOString()}] Time ended for session ${sessionId} at ${endedAt.toISOString()}`);
            
            // Clean up
            const current = lessonSessions.get(sessionId);
            if (current && current.endTimeoutId === session.endTimeoutId) {
              if (current.warningTimeoutId) clearTimeout(current.warningTimeoutId);
              lessonSessions.delete(sessionId);
            }
          }, totalMs);
        }
      }
    }
    
    socket.to(toUserId).emit(EVENTS.VIDEO_CALL.ON_CALL_JOIN, { userInfo });
  });

  socket.on(EVENTS.VIDEO_CALL.ON_BOTH_JOIN, async (socketReq) => {
    const toUserId = MemCache.getDetail(
      process.env.SOCKET_CONFIG,
      socketReq.userInfo?.to_user
    );
    
    // Check if timer has already started - if so, send timer info to the newly joined party
    const sessionId = socketReq?.sessionId || socketReq?.userInfo?.sessionId || socketReq?.userInfo?.meetingId || socketReq?.userInfo?.lessonId;
    if (sessionId && mongoose.isValidObjectId(sessionId)) {
      const session = lessonSessions.get(sessionId);
      if (session && session.startedAt !== null) {
        // Timer already started - send current timer state to the joining party
        const timerPayload = {
          sessionId: session.sessionId,
          startedAt: session.startedAt,
          duration: session.duration,
        };
        socket.emit(EVENTS.LESSON_TIMER.STARTED, timerPayload);
        console.log(`[TIMER] [${new Date().toISOString()}] Sending existing timer state to newly joined party for session ${sessionId}, started at ${new Date(session.startedAt).toISOString()}`);
      }
    }
    
    // Forward the ON_BOTH_JOIN event (for other UI purposes, not timer)
    socket.to(toUserId).emit(EVENTS.VIDEO_CALL.ON_BOTH_JOIN, { socketReq });
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
  listenCallEndEvent(socket);
  listenVideoPositionEvent(socket)
  listenPlayPauseVideoEvent(socket);
  listenVideoTimeEvent(socket);
  listenVideoShowEvent(socket);
  listenDrawingModeToggle(socket);
  listenFullscreenToggle(socket);
  listenLockModeToggle(socket);
  listenVideoChunksEvent(socket);
  listenNotificationEvents(socket);
  listenInstantLessonEvents(socket);
  listenBookingEvents(socket);
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
    console.error(`Error while listening to notification event:`, err);
    throw err;
  }
};

// Instant Lesson Event Handlers
const listenInstantLessonEvents = (socket) => {
  try {
    // Handle instant lesson request
    socket.on(EVENTS.INSTANT_LESSON.REQUEST, async (payload: any) => {
      try {
        const { lessonId, coachId, traineeId, traineeInfo, duration, expiresAt, lessonType } = payload;
        
        // Validate required fields
        if (!lessonId || !coachId || !traineeId) {
          console.error("[INSTANT_LESSON] Missing required fields in request:", payload);
          return;
        }

        const coachSocketId = MemCache.getDetail(process.env.SOCKET_CONFIG, coachId);
        if (coachSocketId) {
          socket.to(coachSocketId).emit(EVENTS.INSTANT_LESSON.REQUEST, {
            lessonId,
            coachId,
            traineeId,
            traineeInfo,
            duration,
            expiresAt,
            lessonType,
          });
          console.log(`[INSTANT_LESSON] [${new Date().toISOString()}] Request sent to coach ${coachId} for lesson ${lessonId}, expires at ${expiresAt}`);
        } else {
          console.warn(`[INSTANT_LESSON] Coach ${coachId} not connected`);
        }
      } catch (err) {
        console.error(`[INSTANT_LESSON] Error handling request:`, err);
      }
    });

    // Handle instant lesson accept
    socket.on(EVENTS.INSTANT_LESSON.ACCEPT, async (payload: any) => {
      try {
        const { lessonId, coachId, traineeId } = payload;
        
        if (!lessonId || !coachId || !traineeId) {
          console.error("[INSTANT_LESSON] Missing required fields in accept:", payload);
          return;
        }

        // Emit to both parties
        const coachSocketId = MemCache.getDetail(process.env.SOCKET_CONFIG, coachId);
        const traineeSocketId = MemCache.getDetail(process.env.SOCKET_CONFIG, traineeId);

        if (coachSocketId) {
          socket.to(coachSocketId).emit(EVENTS.INSTANT_LESSON.ACCEPT, {
            lessonId,
            coachId,
            traineeId,
          });
        }
        if (traineeSocketId) {
          socket.to(traineeSocketId).emit(EVENTS.INSTANT_LESSON.ACCEPT, {
            lessonId,
            coachId,
            traineeId,
          });
        }

        console.log(`[INSTANT_LESSON] [${new Date().toISOString()}] Lesson ${lessonId} accepted by coach ${coachId} for trainee ${traineeId}`);
      } catch (err) {
        console.error(`[INSTANT_LESSON] Error handling accept:`, err);
      }
    });

    // Handle instant lesson decline
    socket.on(EVENTS.INSTANT_LESSON.DECLINE, async (payload: any) => {
      try {
        const { lessonId, coachId, traineeId } = payload;
        
        if (!lessonId || !coachId || !traineeId) {
          console.error("[INSTANT_LESSON] Missing required fields in decline:", payload);
          return;
        }

        const traineeSocketId = MemCache.getDetail(process.env.SOCKET_CONFIG, traineeId);
        if (traineeSocketId) {
          socket.to(traineeSocketId).emit(EVENTS.INSTANT_LESSON.DECLINE, {
            lessonId,
            coachId,
            traineeId,
          });
          console.log(`[INSTANT_LESSON] [${new Date().toISOString()}] Lesson ${lessonId} declined by coach ${coachId} for trainee ${traineeId}`);
        }
      } catch (err) {
        console.error(`[INSTANT_LESSON] Error handling decline:`, err);
      }
    });

    // Handle instant lesson expire
    socket.on(EVENTS.INSTANT_LESSON.EXPIRE, async (payload: any) => {
      try {
        const { lessonId, coachId, traineeId } = payload;
        
        if (!lessonId) {
          console.error("[INSTANT_LESSON] Missing lessonId in expire:", payload);
          return;
        }

        const coachSocketId = coachId ? MemCache.getDetail(process.env.SOCKET_CONFIG, coachId) : null;
        const traineeSocketId = traineeId ? MemCache.getDetail(process.env.SOCKET_CONFIG, traineeId) : null;

        if (coachSocketId) {
          socket.to(coachSocketId).emit(EVENTS.INSTANT_LESSON.EXPIRE, {
            lessonId,
            coachId,
            traineeId,
          });
        }
        if (traineeSocketId) {
          socket.to(traineeSocketId).emit(EVENTS.INSTANT_LESSON.EXPIRE, {
            lessonId,
            coachId,
            traineeId,
          });
        }

        console.log(`[INSTANT_LESSON] [${new Date().toISOString()}] Lesson ${lessonId} expired`);
      } catch (err) {
        console.error(`[INSTANT_LESSON] Error handling expire:`, err);
      }
    });
  } catch (err) {
    console.error(`[INSTANT_LESSON] Error setting up instant lesson event listeners:`, err);
  }
};

// Booking Event Handlers
const listenBookingEvents = (socket) => {
  try {
    // This handler is for receiving booking events from other services
    // The actual emission happens in booking creation/update services
    socket.on(EVENTS.BOOKING.CREATED, async (payload: any) => {
      console.log(`[BOOKING] Booking created event received:`, payload);
    });

    socket.on(EVENTS.BOOKING.STATUS_UPDATED, async (payload: any) => {
      console.log(`[BOOKING] Booking status updated event received:`, payload);
    });
  } catch (err) {
    console.error(`[BOOKING] Error setting up booking event listeners:`, err);
  }
};

// Helper functions to emit booking events from services
export const emitBookingCreated = async (bookingData: any, bookingType: 'instant' | 'scheduled' = 'scheduled') => {
  try {
    if (!ioInstance) {
      console.warn("[BOOKING] ioInstance not set, cannot emit BOOKING_CREATED event");
      return;
    }

    const { _id: bookingId, trainer_id, trainee_id, createdAt } = bookingData;
    const trainerId = trainer_id?.toString ? trainer_id.toString() : trainer_id;
    const traineeId = trainee_id?.toString ? trainee_id.toString() : trainee_id;

    const payload = {
      bookingId: bookingId?.toString ? bookingId.toString() : bookingId,
      trainerId,
      traineeId,
      type: bookingType,
      createdAt: createdAt || new Date().toISOString(),
    };

    // Emit to trainer
    const trainerSocketId = MemCache.getDetail(process.env.SOCKET_CONFIG, trainerId);
    if (trainerSocketId && ioInstance) {
      ioInstance.to(trainerSocketId).emit(EVENTS.BOOKING.CREATED, payload);
      console.log(`[BOOKING] BOOKING_CREATED event emitted to trainer ${trainerId}`);
    }

    // Emit to trainee
    const traineeSocketId = MemCache.getDetail(process.env.SOCKET_CONFIG, traineeId);
    if (traineeSocketId && ioInstance) {
      ioInstance.to(traineeSocketId).emit(EVENTS.BOOKING.CREATED, payload);
      console.log(`[BOOKING] BOOKING_CREATED event emitted to trainee ${traineeId}`);
    }

    console.log(`[BOOKING] [${new Date().toISOString()}] Booking created: ${payload.bookingId}, type: ${bookingType}, trainer: ${trainerId}, trainee: ${traineeId}`);
  } catch (err) {
    console.error(`[BOOKING] Error emitting BOOKING_CREATED event:`, err);
  }
};

export const emitBookingStatusUpdated = async (bookingData: any) => {
  try {
    if (!ioInstance) {
      console.warn("[BOOKING] ioInstance not set, cannot emit BOOKING_STATUS_UPDATED event");
      return;
    }

    const { _id: bookingId, trainer_id, trainee_id, status, updatedAt } = bookingData;
    const trainerId = trainer_id?.toString ? trainer_id.toString() : trainer_id;
    const traineeId = trainee_id?.toString ? trainee_id.toString() : trainee_id;

    const payload = {
      bookingId: bookingId?.toString ? bookingId.toString() : bookingId,
      status,
      updatedAt: updatedAt || new Date().toISOString(),
    };

    // Emit to trainer
    const trainerSocketId = MemCache.getDetail(process.env.SOCKET_CONFIG, trainerId);
    if (trainerSocketId && ioInstance) {
      ioInstance.to(trainerSocketId).emit(EVENTS.BOOKING.STATUS_UPDATED, payload);
      console.log(`[BOOKING] BOOKING_STATUS_UPDATED event emitted to trainer ${trainerId}`);
    }

    // Emit to trainee
    const traineeSocketId = MemCache.getDetail(process.env.SOCKET_CONFIG, traineeId);
    if (traineeSocketId && ioInstance) {
      ioInstance.to(traineeSocketId).emit(EVENTS.BOOKING.STATUS_UPDATED, payload);
      console.log(`[BOOKING] BOOKING_STATUS_UPDATED event emitted to trainee ${traineeId}`);
    }

    console.log(`[BOOKING] [${new Date().toISOString()}] Booking status updated: ${payload.bookingId}, status: ${status}, trainer: ${trainerId}, trainee: ${traineeId}`);
  } catch (err) {
    console.error(`[BOOKING] Error emitting BOOKING_STATUS_UPDATED event:`, err);
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
    console.error(`Error while listening to draw event:`, err);
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
    console.error(`Error while listening to stop draw event:`, err);
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
    console.error(`Error while listening to video show event:`, err);
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
    console.error(`Error while listening to drawing mode toggle:`, err);
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
    console.error(`Error while listening to fullscreen toggle:`, err);
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
    console.error(`Error while listening to lock mode toggle:`, err);
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
    console.error(`Error while listening to video position event:`, err);
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
    console.error(`Error while listening to show video event:`, err);
    throw err;
  }
};

const listenCallEndEvent = (socket) => {
  try {
    socket.on(EVENTS.CALL_END, async (socketReq, request) => {
      const { userInfo } = socketReq;
      const toUserSocketId = MemCache.getDetail(
        process.env.SOCKET_CONFIG,
        userInfo?.to_user
      );
      socket.to(toUserSocketId).emit(EVENTS.CALL_END, socketReq);
    });
  } catch (err) {
    console.error(`Error while listening to call end event:`, err);
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
    console.error(`Error while listening to play pause video event:`, err);
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
    console.error(`Error while listening to video time event:`, err);
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
    console.error("Error generating pre-signed URL:", err);
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