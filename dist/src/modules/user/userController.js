"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userController = void 0;
const logger_1 = require("./../../../logger");
const constance_1 = require("./../../config/constance");
const userService_1 = require("./userService");
const booked_sessions_schema_1 = require("../../model/booked_sessions.schema");
const user_schema_1 = require("../../model/user.schema");
const sendEmail_1 = require("../../Utils/sendEmail");
class userController {
    constructor() {
        this.userService = new userService_1.UserService();
        this.logger = logger_1.log.getLogger();
        this.createNewUser = async (req, res) => {
            try {
                const result = await this.userService.createNewUser(req.model);
                return res
                    .status(result.code)
                    .send({ status: constance_1.CONSTANCE.SUCCESS, data: result.result });
            }
            catch (err) {
                this.logger.error(err);
                return res.status(500).send({ status: constance_1.CONSTANCE.FAIL, error: err.error });
            }
        };
        this.updateBookedSession = async (req, res) => {
            try {
                const { id } = req["params"];
                const result = await this.userService.updateBookedSession(req.body, id, req?.authUser?.account_type);
                if (result.status !== constance_1.CONSTANCE.FAIL) {
                    res.status(result.code).json(result.result);
                }
                else {
                    res.status(result.code).json({
                        status: result.status,
                        error: result.error,
                        code: constance_1.CONSTANCE.RES_CODE.error.badRequest,
                    });
                }
            }
            catch (err) {
                return res.status(500).send({ status: constance_1.CONSTANCE.FAIL, error: err.error });
            }
        };
        this.getScheduledMeetings = async (req, res) => {
            try {
                const result = await this.userService.getScheduledMeetings(req);
                if (result.status !== constance_1.CONSTANCE.FAIL) {
                    res.status(result.code).json(result.result);
                }
                else {
                    res.status(result.code).json({
                        status: result.status,
                        error: result.error,
                        code: constance_1.CONSTANCE.RES_CODE.error.badRequest,
                    });
                }
            }
            catch (err) {
                return res.status(500).send({ status: constance_1.CONSTANCE.FAIL, error: err.error });
            }
        };
        this.getMe = async (req, res) => {
            try {
                if (req["authUser"]) {
                    const result = await this.userService.getMe(req.authUser);
                    var newResult = JSON.parse(JSON.stringify(result.result));
                    if (result.status !== constance_1.CONSTANCE.FAIL) {
                        if (req?.authUser?.account_type === "Trainer") {
                            var ratings = await booked_sessions_schema_1.default.find({
                                trainer_id: req?.authUser?._id,
                            });
                            newResult.userInfo.ratings = ratings;
                        }
                        res.status(result.code).json(newResult);
                    }
                    else {
                        res.status(result.code).json({
                            status: result.status,
                            error: result.error,
                            code: constance_1.CONSTANCE.RES_CODE.error.badRequest,
                        });
                    }
                }
            }
            catch (err) {
                return res.status(500).send({ status: constance_1.CONSTANCE.FAIL, error: err.error });
            }
        };
        this.shareClips = async (req, res) => {
            try {
                if (req["authUser"]) {
                    const result = await this.userService.shareClips({
                        ...req.body,
                        ...req.authUser,
                    });
                    if (result.status !== constance_1.CONSTANCE.FAIL) {
                        res.status(result.code).json(result.result);
                    }
                    else {
                        res.status(result.code).json({
                            status: result.status,
                            error: result.error,
                            code: constance_1.CONSTANCE.RES_CODE.error.badRequest,
                        });
                    }
                }
            }
            catch (err) {
                return res.status(500).send({ status: constance_1.CONSTANCE.FAIL, error: err.error });
            }
        };
        this.inviteFriend = async (req, res) => {
            try {
                if (req["authUser"]) {
                    const result = await this.userService.inviteFriend({
                        ...req.body,
                        ...req.authUser,
                    });
                    if (result.status !== constance_1.CONSTANCE.FAIL) {
                        res.status(result.code).json(result.result);
                    }
                    else {
                        res.status(result.code).json({
                            status: result.status,
                            error: result.error,
                            code: constance_1.CONSTANCE.RES_CODE.error.badRequest,
                        });
                    }
                }
            }
            catch (err) {
                return res.status(500).send({ status: constance_1.CONSTANCE.FAIL, error: err.error });
            }
        };
        this.updateRatings = async (req, res) => {
            try {
                const result = await this.userService.updateRatings(req.authUser, req["model"], req["booked_session_info"]);
                if (result.status !== constance_1.CONSTANCE.FAIL) {
                    res.status(result.code).json(result.result);
                }
                else {
                    res.status(result.code).json({
                        status: result.status,
                        error: result.error,
                        code: constance_1.CONSTANCE.RES_CODE.error.badRequest,
                    });
                }
            }
            catch (err) {
                return res.status(500).send({ status: constance_1.CONSTANCE.FAIL, error: err.error });
            }
        };
        this.addTraineeClip = async (req, res) => {
            try {
                const { id } = req["params"];
                const result = await this.userService.addTraineeClip(req.body, id);
                if (result.status !== constance_1.CONSTANCE.FAIL)
                    res.status(result.code).json(result.result);
                else
                    res.status(result.code).json({
                        status: result.status,
                        error: result.error,
                        code: constance_1.CONSTANCE.RES_CODE.error.badRequest,
                    });
            }
            catch (err) {
                return res.status(500).send({ status: constance_1.CONSTANCE.FAIL, error: err.error });
            }
        };
        this.getAllTrainee = async (req, res) => {
            try {
                if (req["authUser"]) {
                    const result = await this.userService.getAllTrainee(req.authUser);
                    if (result.status !== constance_1.CONSTANCE.FAIL) {
                        res.status(result.code).json(result);
                    }
                    else {
                        res.status(result.code).json({
                            status: result.status,
                            error: result.error,
                            code: constance_1.CONSTANCE.RES_CODE.error.badRequest,
                        });
                    }
                }
            }
            catch (err) {
                return res.status(500).send({ status: constance_1.CONSTANCE.FAIL, error: err.error });
            }
        };
        this.getAllTrainers = async (req, res) => {
            try {
                if (req["authUser"]) {
                    const result = await this.userService.getAllTrainers(req.authUser);
                    if (result.status !== constance_1.CONSTANCE.FAIL) {
                        res.status(result.code).json(result);
                    }
                    else {
                        res.status(result.code).json({
                            status: result.status,
                            error: result.error,
                            code: constance_1.CONSTANCE.RES_CODE.error.badRequest,
                        });
                    }
                }
            }
            catch (err) {
                return res.status(500).send({ status: constance_1.CONSTANCE.FAIL, error: err.error });
            }
        };
        this.getAllUsers = async (req, res) => {
            try {
                if (req["authUser"]) {
                    // Extract the search term from the query parameter
                    const searchTerm = req?.query?.search;
                    const result = await this.userService.getAllUsers(req.authUser, searchTerm);
                    if (result.status !== constance_1.CONSTANCE.FAIL) {
                        res.status(result.code).json(result);
                    }
                    else {
                        res.status(result.code).json({
                            status: result.status,
                            error: result.error,
                            code: constance_1.CONSTANCE.RES_CODE.error.badRequest,
                        });
                    }
                }
            }
            catch (err) {
                return res.status(500).send({ status: constance_1.CONSTANCE.FAIL, error: err.error });
            }
        };
        this.updateTrainerCommossion = async (req, res) => {
            try {
                if (req["authUser"]) {
                    const result = await this.userService.updateTrainerCommossion(req.body);
                    if (result.status !== constance_1.CONSTANCE.FAIL) {
                        res.status(result.code).json(result);
                    }
                    else {
                        res.status(result.code).json({
                            status: result.status,
                            error: result.error,
                            code: constance_1.CONSTANCE.RES_CODE.error.badRequest,
                        });
                    }
                }
            }
            catch (err) {
                return res.status(500).send({ status: constance_1.CONSTANCE.FAIL, error: err.error });
            }
        };
        this.updateIsRegisteredWithStript = async (req, res) => {
            try {
                if (req["authUser"]) {
                    const result = await this.userService.updateIsRegisteredWithStript(req.authUser, req.body);
                    if (result.status !== constance_1.CONSTANCE.FAIL) {
                        res.status(result.code).json(result);
                    }
                    else {
                        res.status(result.code).json({
                            status: result.status,
                            error: result.error,
                            code: constance_1.CONSTANCE.RES_CODE.error.badRequest,
                        });
                    }
                }
            }
            catch (err) {
                return res.status(500).send({ status: constance_1.CONSTANCE.FAIL, error: err.error });
            }
        };
        this.updateIsKYCCompleted = async (req, res) => {
            try {
                if (req["authUser"]) {
                    const result = await this.userService.updateIsKYCCompleted(req.authUser);
                    if (result.status !== constance_1.CONSTANCE.FAIL) {
                        res.status(result.code).json(result);
                    }
                    else {
                        res.status(result.code).json({
                            status: result.status,
                            error: result.error,
                            code: constance_1.CONSTANCE.RES_CODE.error.badRequest,
                        });
                    }
                }
            }
            catch (err) {
                return res.status(500).send({ status: constance_1.CONSTANCE.FAIL, error: err.error });
            }
        };
        this.sendFriendRequest = async (req, res) => {
            const { receiverId } = req.body;
            const senderId = req.authUser._id.toString();
            if (senderId === receiverId) {
                return res
                    .status(400)
                    .json({ error: "You cannot send a friend request to yourself." });
            }
            console.log("senderId", senderId);
            console.log("receiverId", receiverId);
            try {
                const receiver = await user_schema_1.default.findById(receiverId);
                const sender = await user_schema_1.default.findById(senderId);
                if (sender.isPrivate) {
                    return res.status(400).json({
                        error: "Your account is private,you cannot send a friend request.",
                    });
                }
                if (!receiver) {
                    return res.status(404).json({ error: "User not found." });
                }
                // Check if a request already exists
                const existingRequest = receiver.friendRequests.find((request) => request.senderId.toString() === senderId);
                if (existingRequest) {
                    return res.status(400).json({ error: "Friend request already sent." });
                }
                // Add friend request
                receiver.friendRequests.push({ senderId, receiverId });
                await receiver.save();
                // Send emails to both the trainee and trainer
                sendEmail_1.SendEmail.sendRawEmail(null, null, [receiver.email], `Received Friend Request`, null, `<div style="font-family: Verdana,Arial,Helvetica,sans-serif;font-size: 18px;line-height: 30px;">
                      <i  style='color:#ff0000'>${receiver.fullname},</i>
                      <br/><br/>
                     You have received a friend request from ${sender.fullname}.<br/><br/>
                      <br/><br/>
                     
                      From,  <br/>
                      NetQwix Team. <br/>
                      <img src=${constance_1.NetquixImage.logo} style="object-fit: contain; width: 180px;"/>
                    </div>`);
                res.status(200).json({ message: "Friend request sent successfully." });
            }
            catch (error) {
                console.error(error);
                res.status(500).json({ error: "Server error." });
            }
        };
        this.acceptFriendRequest = async (req, res) => {
            const { requestId } = req.body;
            const userId = req.authUser._id;
            try {
                const userDoc = await user_schema_1.default.findById(userId);
                if (!userDoc) {
                    return res.status(404).json({ error: "User not found." });
                }
                if (userDoc.isPrivate) {
                    return res.status(400).json({
                        error: "Your account is private,you cannot send a friend request.",
                    });
                }
                // Find the request
                const requestIndex = userDoc.friendRequests.findIndex((request) => request._id.toString() === requestId);
                if (requestIndex === -1) {
                    return res.status(400).json({ error: "Friend request not found." });
                }
                const senderId = userDoc.friendRequests[requestIndex].senderId;
                // Add each other as friends
                userDoc.friends.push(senderId);
                const senderDoc = await user_schema_1.default.findById(senderId);
                senderDoc.friends.push(userId);
                // Remove the friend request
                userDoc.friendRequests.splice(requestIndex, 1);
                await userDoc.save();
                await senderDoc.save();
                res.status(200).json({ message: "Friend request accepted." });
            }
            catch (error) {
                console.error(error);
                res.status(500).json({ error: "Server error." });
            }
        };
        this.cancelFriendRequest = async (req, res) => {
            const { receiverId } = req.body;
            const senderId = req.authUser._id.toString();
            try {
                const receiver = await user_schema_1.default.findById(receiverId);
                if (!receiver) {
                    return res.status(404).json({ error: "User not found." });
                }
                // Find the request
                const requestIndex = receiver.friendRequests.findIndex((request) => request.senderId.toString() === senderId);
                if (requestIndex === -1) {
                    return res.status(400).json({ error: "Friend request not found." });
                }
                // Remove the request
                receiver.friendRequests.splice(requestIndex, 1);
                await receiver.save();
                res
                    .status(200)
                    .json({ message: "Friend request canceled successfully." });
            }
            catch (error) {
                console.error(error);
                res.status(500).json({ error: "Server error." });
            }
        };
        this.rejectFriendRequest = async (req, res) => {
            const { requestId } = req.body;
            const userId = req.authUser._id;
            try {
                const userDoc = await user_schema_1.default.findById(userId);
                if (!userDoc) {
                    return res.status(404).json({ error: "User not found." });
                }
                // Find the request
                const requestIndex = userDoc.friendRequests.findIndex((request) => request._id.toString() === requestId);
                if (requestIndex === -1) {
                    return res.status(400).json({ error: "Friend request not found." });
                }
                // Remove the request
                userDoc.friendRequests.splice(requestIndex, 1);
                await userDoc.save();
                res.status(200).json({ message: "Friend request rejected." });
            }
            catch (error) {
                console.error(error);
                res.status(500).json({ error: "Server error." });
            }
        };
        this.getFriendRequests = async (req, res) => {
            try {
                const tempUser = await user_schema_1.default
                    .findById(req.authUser._id)
                    .populate("friendRequests.senderId", "fullname email profile_picture account_type")
                    .populate("friendRequests.receiverId", "fullname email profile_picture account_type");
                if (!tempUser) {
                    return res.status(404).json({ error: "User not found." });
                }
                res.status(200).json({ friendRequests: tempUser.friendRequests });
            }
            catch (error) {
                console.error(error);
                res.status(500).json({ error: "Server error." });
            }
        };
        this.removeFriend = async (req, res) => {
            const { friendId } = req.body;
            const userId = req.authUser._id;
            try {
                const userDoc = await user_schema_1.default.findById(userId);
                const friendDoc = await user_schema_1.default.findById(friendId);
                console.log("userDoc", userId);
                console.log("friendDoc", friendId);
                if (!userDoc || !friendDoc) {
                    return res.status(404).json({ error: "User not found." });
                }
                // Remove friend from user's friend list
                userDoc.friends = userDoc.friends.filter((friend) => friend.toString() !== friendId);
                // Remove user from friend's friend list
                friendDoc.friends = friendDoc.friends.filter((friend) => friend.toString() !== userId.toString());
                console.log("userDoc", userDoc.friends);
                console.log("friendDoc", friendDoc.friends);
                await userDoc.save();
                await friendDoc.save();
                res.status(200).json({ message: "Friend removed successfully." });
            }
            catch (error) {
                console.error(error);
                res.status(500).json({ error: "Server error." });
            }
        };
        this.getFriends = async (req, res) => {
            try {
                const userId = req.authUser._id;
                const userDoc = await user_schema_1.default
                    .findById(userId)
                    .populate("friends", "fullname email profile_picture account_type");
                if (!userDoc) {
                    return res.status(404).json({ error: "User not found." });
                }
                res.status(200).json({ friends: userDoc.friends });
            }
            catch (error) {
                console.error(error);
                res.status(500).json({ error: "Server error." });
            }
        };
        this.updateIsPrivate = async (req, res) => {
            try {
                if (req["authUser"]) {
                    const { isPrivate } = req.body;
                    const userId = req.authUser._id;
                    const result = await this.userService.updateIsPrivate(userId, isPrivate);
                    if (result.status !== constance_1.CONSTANCE.FAIL) {
                        res.status(result.code).json(result);
                    }
                    else {
                        res.status(result.code).json({
                            status: result.status,
                            error: result.error,
                            code: constance_1.CONSTANCE.RES_CODE.error.badRequest,
                        });
                    }
                }
            }
            catch (err) {
                return res.status(500).send({ status: constance_1.CONSTANCE.FAIL, error: err.error });
            }
        };
        /**
         * Stripe User KYC
         */
        this.createVerificationSessionStripeKYC = async (req, res) => {
            try {
                if (req["authUser"]) {
                    const result = await this.userService.createVerificationSessionStripeKYC(req.authUser);
                    return res.status(constance_1.CONSTANCE.RES_CODE.success).json({ data: result });
                }
            }
            catch (error) {
                res.status(constance_1.CONSTANCE.RES_CODE.error.internalServerError).json({
                    success: 0,
                    message: constance_1.Message.internal,
                });
            }
        };
        this.getAllBooking = async (req, res) => {
            try {
                if (req["authUser"]) {
                    const result = await this.userService.getAllBooking();
                    return res.status(constance_1.CONSTANCE.RES_CODE.success).json({ data: result });
                }
            }
            catch (error) {
                res.status(constance_1.CONSTANCE.RES_CODE.error.internalServerError).json({
                    success: 0,
                    message: constance_1.Message.internal,
                });
            }
        };
        this.getAllBookingById = async (req, res) => {
            try {
                if (req["authUser"]) {
                    const trainer_id = req["authUser"]?._id;
                    const account_type = req["authUser"]?.account_type;
                    const page = req?.query?.page ?? 1;
                    const limit = req?.query?.limit ?? 2000;
                    const result = await this.userService.getAllBookingById(trainer_id, account_type, page, limit);
                    return res.status(constance_1.CONSTANCE.RES_CODE.success).json({ data: result });
                }
            }
            catch (error) {
                res.status(constance_1.CONSTANCE.RES_CODE.error.internalServerError).json({
                    success: 0,
                    message: constance_1.Message.internal,
                });
            }
        };
        this.createStripeAccountVarificationUrl = async (req, res) => {
            try {
                // if (req["authUser"]) {
                const result = await this.userService.createStripeAccountVarificationUrl(req.body);
                return res.status(constance_1.CONSTANCE.RES_CODE.success).json({ data: result });
                // }
            }
            catch (error) {
                res.status(constance_1.CONSTANCE.RES_CODE.error.internalServerError).json({
                    success: 0,
                    message: constance_1.Message.internal,
                });
            }
        };
        this.checkIsKycCompleted = async (req, res) => {
            try {
                if (req["authUser"]) {
                    const stripe_account_id = req["authUser"].stripe_account_id;
                    const result = await this.userService.checkIsKycCompleted(req["authUser"], stripe_account_id);
                    return res.status(constance_1.CONSTANCE.RES_CODE.success).json({ data: result });
                }
            }
            catch (error) {
                res.status(constance_1.CONSTANCE.RES_CODE.error.internalServerError).json({
                    success: 0,
                    message: constance_1.Message.internal,
                });
            }
        };
        this.updateRefundStatus = async (req, res) => {
            try {
                if (req["authUser"]) {
                    const result = await this.userService.updateRefundStatus(req.body);
                    if (result.status !== constance_1.CONSTANCE.FAIL) {
                        res.status(result.code).json(result);
                    }
                    else {
                        res.status(result.code).json({
                            status: result.status,
                            error: result.error,
                            code: constance_1.CONSTANCE.RES_CODE.error.badRequest,
                        });
                    }
                }
            }
            catch (err) {
                return res.status(500).send({ status: constance_1.CONSTANCE.FAIL, error: err.error });
            }
        };
        this.captureWriteUs = async (req, res) => {
            try {
                if (req["authUser"]) {
                    const id = req["authUser"]._id;
                    const result = await this.userService.captureWriteUs(id, req.body);
                    if (result.status !== constance_1.CONSTANCE.FAIL) {
                        res.status(result.code).json(result);
                    }
                    else {
                        res.status(result.code).json({
                            status: result.status,
                            error: result.error,
                            code: constance_1.CONSTANCE.RES_CODE.error.badRequest,
                        });
                    }
                }
            }
            catch (err) {
                return res.status(500).send({ status: constance_1.CONSTANCE.FAIL, error: err.error });
            }
        };
        this.createRaiseConcern = async (req, res) => {
            try {
                if (req["authUser"]) {
                    const id = req["authUser"]._id;
                    const result = await this.userService.createRaiseConcern(id, req.body);
                    if (result.status !== constance_1.CONSTANCE.FAIL) {
                        res.status(result.code).json(result);
                    }
                    else {
                        res.status(result.code).json({
                            status: result.status,
                            error: result.error,
                            code: constance_1.CONSTANCE.RES_CODE.error.badRequest,
                        });
                    }
                }
            }
            catch (err) {
                return res.status(500).send({ status: constance_1.CONSTANCE.FAIL, error: err.error });
            }
        };
        this.getCaptureWriteUs = async (req, res) => {
            try {
                if (req["authUser"]) {
                    const id = req["authUser"]._id;
                    const result = await this.userService.getCaptureWriteUs();
                    if (result.status !== constance_1.CONSTANCE.FAIL) {
                        res.status(result.code).json(result);
                    }
                    else {
                        res.status(result.code).json({
                            status: result.status,
                            error: result.error,
                            code: constance_1.CONSTANCE.RES_CODE.error.badRequest,
                        });
                    }
                }
            }
            catch (err) {
                return res.status(500).send({ status: constance_1.CONSTANCE.FAIL, error: err.error });
            }
        };
        this.getRaiseConcern = async (req, res) => {
            try {
                if (req["authUser"]) {
                    const id = req["authUser"]._id;
                    const result = await this.userService.getRaiseConcern();
                    if (result.status !== constance_1.CONSTANCE.FAIL) {
                        res.status(result.code).json(result);
                    }
                    else {
                        res.status(result.code).json({
                            status: result.status,
                            error: result.error,
                            code: constance_1.CONSTANCE.RES_CODE.error.badRequest,
                        });
                    }
                }
            }
            catch (err) {
                return res.status(500).send({ status: constance_1.CONSTANCE.FAIL, error: err.error });
            }
        };
        this.updateWriteUsTicketStatus = async (req, res) => {
            try {
                if (req["authUser"]) {
                    const result = await this.userService.updateWriteUsTicketStatus(req.body);
                    if (result.status !== constance_1.CONSTANCE.FAIL) {
                        res.status(result.code).json(result);
                    }
                    else {
                        res.status(result.code).json({
                            status: result.status,
                            error: result.error,
                            code: constance_1.CONSTANCE.RES_CODE.error.badRequest,
                        });
                    }
                }
            }
            catch (err) {
                return res.status(500).send({ status: constance_1.CONSTANCE.FAIL, error: err.error });
            }
        };
        this.updateRaiseConcernTicketStatus = async (req, res) => {
            try {
                if (req["authUser"]) {
                    const result = await this.userService.updateRaiseConcernTicketStatus(req.body);
                    if (result.status !== constance_1.CONSTANCE.FAIL) {
                        res.status(result.code).json(result);
                    }
                    else {
                        res.status(result.code).json({
                            status: result.status,
                            error: result.error,
                            code: constance_1.CONSTANCE.RES_CODE.error.badRequest,
                        });
                    }
                }
            }
            catch (err) {
                return res.status(500).send({ status: constance_1.CONSTANCE.FAIL, error: err.error });
            }
        };
        this.getAllLatestOnlineUser = async (req, res) => {
            try {
                const result = await this.userService.getAllLatestOnlineUser();
                if (result.status !== constance_1.CONSTANCE.FAIL) {
                    res.status(result.code).json(result);
                }
                else {
                    res.status(result.code).json({
                        status: result.status,
                        error: result.error,
                        code: constance_1.CONSTANCE.RES_CODE.error.badRequest,
                    });
                }
            }
            catch (err) {
                return res.status(500).send({ status: constance_1.CONSTANCE.FAIL, error: err.error });
            }
        };
    }
}
exports.userController = userController;
//# sourceMappingURL=userController.js.map