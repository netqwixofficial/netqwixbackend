import { log } from "./../../../logger";
import { CONSTANCE, Message } from "./../../config/constance";
import { ResponseBuilder } from "./../../helpers/responseBuilder";
import { Request, Response } from "express";
import { UserService } from "./userService";
import { updateBookedStatusModal } from "./userValidator";
import booked_session from "../../model/booked_sessions.schema";
import user from "../../model/user.schema";

export class userController {
  public userService = new UserService();
  public logger = log.getLogger();
  public createNewUser = async (req: any, res: Response) => {
    try {
      const result: ResponseBuilder = await this.userService.createNewUser(
        req.model
      );
      return res
        .status(result.code)
        .send({ status: CONSTANCE.SUCCESS, data: result.result });
    } catch (err) {
      this.logger.error(err);
      return res
        .status(500)
        .send({ status: CONSTANCE.FAIL, error: err.error });
    }
  };

  public updateBookedSession = async (req, res) => {
    try {
      const { id } = req["params"];
      const result: ResponseBuilder =
        await this.userService.updateBookedSession(
          req.body as updateBookedStatusModal,
          id, req?.authUser?.account_type
        );
      if (result.status !== CONSTANCE.FAIL) {
        res.status(result.code).json(result.result);
      } else {
        res.status(result.code).json({
          status: result.status,
          error: result.error,
          code: CONSTANCE.RES_CODE.error.badRequest,
        });
      }
    } catch (err) {
      return res
        .status(500)
        .send({ status: CONSTANCE.FAIL, error: err.error });
    }
  };

  public getScheduledMeetings = async (req, res) => {
    try {
      const result: ResponseBuilder =
        await this.userService.getScheduledMeetings(req);
      if (result.status !== CONSTANCE.FAIL) {
        res.status(result.code).json(result.result);
      } else {
        res.status(result.code).json({
          status: result.status,
          error: result.error,
          code: CONSTANCE.RES_CODE.error.badRequest,
        });
      }
    } catch (err) {
      return res
        .status(500)
        .send({ status: CONSTANCE.FAIL, error: err.error });
    }
  };

  public getMe = async (req, res) => {
    try {
      if (req["authUser"]) {
        const result: ResponseBuilder = await this.userService.getMe(
          req.authUser
        );
        var newResult = JSON.parse(JSON.stringify(result.result))
        if (result.status !== CONSTANCE.FAIL) {
          if (req?.authUser?.account_type === "Trainer") {
            var ratings = await booked_session.find({ trainer_id: req?.authUser?._id });
            newResult.userInfo.ratings = ratings;
          }
          res.status(result.code).json(newResult);
        } else {
          res.status(result.code).json({
            status: result.status,
            error: result.error,
            code: CONSTANCE.RES_CODE.error.badRequest,
          });
        }
      }
    } catch (err) {
      return res
        .status(500)
        .send({ status: CONSTANCE.FAIL, error: err.error });
    }
  };

  public shareClips = async (req, res) => {
    try {
      if (req["authUser"]) {
        const result: ResponseBuilder = await this.userService.shareClips({ ...req.body, ...req.authUser });
        if (result.status !== CONSTANCE.FAIL) { res.status(result.code).json(result.result) }
        else {
          res.status(result.code).json({
            status: result.status,
            error: result.error,
            code: CONSTANCE.RES_CODE.error.badRequest,
          });
        }
      }
    } catch (err) {
      return res
        .status(500)
        .send({ status: CONSTANCE.FAIL, error: err.error });
    }
  };

  public inviteFriend = async (req, res) => {
    try {
      if (req["authUser"]) {
        const result: ResponseBuilder = await this.userService.inviteFriend({ ...req.body, ...req.authUser });
        if (result.status !== CONSTANCE.FAIL) { res.status(result.code).json(result.result) }
        else {
          res.status(result.code).json({
            status: result.status,
            error: result.error,
            code: CONSTANCE.RES_CODE.error.badRequest,
          });
        }
      }
    } catch (err) {
      return res
        .status(500)
        .send({ status: CONSTANCE.FAIL, error: err.error });
    }
  };

  public updateRatings = async (req, res) => {
    try {
      const result: ResponseBuilder = await this.userService.updateRatings(
        req.authUser,
        req["model"],
        req["booked_session_info"]
      );
      if (result.status !== CONSTANCE.FAIL) {
        res.status(result.code).json(result.result);
      } else {
        res.status(result.code).json({
          status: result.status,
          error: result.error,
          code: CONSTANCE.RES_CODE.error.badRequest,
        });
      }
    } catch (err) {
      return res
        .status(500)
        .send({ status: CONSTANCE.FAIL, error: err.error });
    }
  };

  public addTraineeClip = async (req, res) => {
    try {
      const { id } = req["params"];
      const result: ResponseBuilder = await this.userService.addTraineeClip(req.body, id);
      if (result.status !== CONSTANCE.FAIL) res.status(result.code).json(result.result);
      else res.status(result.code).json({ status: result.status, error: result.error, code: CONSTANCE.RES_CODE.error.badRequest });
    } catch (err) {
      return res.status(500).send({ status: CONSTANCE.FAIL, error: err.error });
    }
  };

  public getAllTrainee = async (req, res) => {
    try {
      if (req["authUser"]) {
        const result: ResponseBuilder = await this.userService.getAllTrainee(
          req.authUser
        );
        if (result.status !== CONSTANCE.FAIL) {
          res.status(result.code).json(result);
        } else {
          res.status(result.code).json({
            status: result.status,
            error: result.error,
            code: CONSTANCE.RES_CODE.error.badRequest,
          });
        }
      }
    } catch (err) {
      return res
        .status(500)
        .send({ status: CONSTANCE.FAIL, error: err.error });
    }
  };

  public getAllTrainers = async (req, res) => {
    try {
      if (req["authUser"]) {
        const result: ResponseBuilder = await this.userService.getAllTrainers(
          req.authUser
        );
        if (result.status !== CONSTANCE.FAIL) {
          res.status(result.code).json(result);
        } else {
          res.status(result.code).json({
            status: result.status,
            error: result.error,
            code: CONSTANCE.RES_CODE.error.badRequest,
          });
        }
      }
    } catch (err) {
      return res
        .status(500)
        .send({ status: CONSTANCE.FAIL, error: err.error });
    }
  };

  public getAllUsers = async (req, res) => {
    try {
      if (req["authUser"]) {
        // Extract the search term from the query parameter
        const searchTerm = req?.query?.search;
        const result: ResponseBuilder = await this.userService.getAllUsers(
          req.authUser,searchTerm
        );
        if (result.status !== CONSTANCE.FAIL) {
          res.status(result.code).json(result);
        } else {
          res.status(result.code).json({
            status: result.status,
            error: result.error,
            code: CONSTANCE.RES_CODE.error.badRequest,
          });
        }
      }
    } catch (err) {
      return res
        .status(500)
        .send({ status: CONSTANCE.FAIL, error: err.error });
    }
  };

  public updateTrainerCommossion = async (req, res) => {
    try {
      if (req["authUser"]) {
        const result: ResponseBuilder = await this.userService.updateTrainerCommossion(
          req.body
        );
        if (result.status !== CONSTANCE.FAIL) {
          res.status(result.code).json(result);
        } else {
          res.status(result.code).json({
            status: result.status,
            error: result.error,
            code: CONSTANCE.RES_CODE.error.badRequest,
          });
        }
      }
    } catch (err) {
      return res
        .status(500)
        .send({ status: CONSTANCE.FAIL, error: err.error });
    }
  };

  public updateIsRegisteredWithStript = async (req, res) => {
    try {
      if (req["authUser"]) {
        const result: ResponseBuilder = await this.userService.updateIsRegisteredWithStript(req.authUser, req.body);
        if (result.status !== CONSTANCE.FAIL) {
          res.status(result.code).json(result);
        } else {
          res.status(result.code).json({
            status: result.status,
            error: result.error,
            code: CONSTANCE.RES_CODE.error.badRequest,
          });
        }
      }
    } catch (err) {
      return res
        .status(500)
        .send({ status: CONSTANCE.FAIL, error: err.error });
    }
  };

  public updateIsKYCCompleted = async (req, res) => {
    try {
      if (req["authUser"]) {
        const result: ResponseBuilder = await this.userService.updateIsKYCCompleted(req.authUser);
        if (result.status !== CONSTANCE.FAIL) {
          res.status(result.code).json(result);
        } else {
          res.status(result.code).json({
            status: result.status,
            error: result.error,
            code: CONSTANCE.RES_CODE.error.badRequest,
          });
        }
      }
    } catch (err) {
      return res
        .status(500)
        .send({ status: CONSTANCE.FAIL, error: err.error });
    }
  };

  public sendFriendRequest = async (req, res) => {
    const { receiverId } = req.body;
  
    const senderId = req.authUser._id.toString();
    if (senderId === receiverId) {
      return res.status(400).json({ error: "You cannot send a friend request to yourself." });
    }
    console.log("senderId",senderId)
    console.log("receiverId",receiverId)

    try {
      const receiver = await user.findById(receiverId);
      const sender = await user.findById(senderId);

      if(sender.isPrivate){
        return res.status(400).json({ error: "Your account is private,you cannot send a friend request." });
      }
      if (!receiver) {
        return res.status(404).json({ error: "User not found." });
      }
  
      // Check if a request already exists
      const existingRequest = receiver.friendRequests.find(
        (request) => request.senderId.toString() === senderId
      );
  
      if (existingRequest) {
        return res.status(400).json({ error: "Friend request already sent." });
      }
  
      // Add friend request
      receiver.friendRequests.push({ senderId,receiverId });
      await receiver.save();
  
      res.status(200).json({ message: "Friend request sent successfully." });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server error." });
    }
  };

  public acceptFriendRequest = async (req, res) => {
    const { requestId } = req.body;
    const userId = req.authUser._id;
    try {
      const userDoc = await user.findById(userId);
      if (!userDoc) {
        return res.status(404).json({ error: "User not found." });
      }

      if(userDoc.isPrivate){
        return res.status(400).json({ error: "Your account is private,you cannot send a friend request." });
      }

      // Find the request
      const requestIndex = userDoc.friendRequests.findIndex(
        (request) => request._id.toString() === requestId
      );

      if (requestIndex === -1) {
        return res.status(400).json({ error: "Friend request not found." });
      }

      const senderId = userDoc.friendRequests[requestIndex].senderId;

      // Add each other as friends
      userDoc.friends.push(senderId);
      const senderDoc = await user.findById(senderId);
      senderDoc.friends.push(userId);

      // Remove the friend request
      userDoc.friendRequests.splice(requestIndex, 1);

      await userDoc.save();
      await senderDoc.save();

      res.status(200).json({ message: "Friend request accepted." });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server error." });
    }
  };
  
  public rejectFriendRequest = async (req, res) => {
    const { requestId } = req.body;
    const userId = req.authUser._id;
    try {
      const userDoc = await user.findById(userId);
      if (!userDoc) {
        return res.status(404).json({ error: "User not found." });
      }

      // Find the request
      const requestIndex = userDoc.friendRequests.findIndex(
        (request) => request._id.toString() === requestId
      );

      if (requestIndex === -1) {
        return res.status(400).json({ error: "Friend request not found." });
      }

      // Remove the request
      userDoc.friendRequests.splice(requestIndex, 1);
      await userDoc.save();

      res.status(200).json({ message: "Friend request rejected." });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server error." });
    }
  };

  public getFriendRequests = async (req, res) => {
    try {
      const tempUser = await user.findById(req.authUser._id).populate('friendRequests.senderId', 'fullname email profile_picture account_type').populate('friendRequests.receiverId', 'fullname email profile_picture account_type');;
  
      if (!tempUser) {
        return res.status(404).json({ error: "User not found." });
      }
  
      res.status(200).json({ friendRequests: tempUser.friendRequests });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server error." });
    }
  };

  public removeFriend = async (req, res) => {
    const { friendId } = req.body;
    const userId = req.authUser._id;
    try {
      const userDoc = await user.findById(userId);
      const friendDoc = await user.findById(friendId);
      console.log("userDoc",userId)
      console.log("friendDoc",friendId)

      if (!userDoc || !friendDoc) {
        return res.status(404).json({ error: "User not found." });
      }

      // Remove friend from user's friend list
      userDoc.friends = userDoc.friends.filter(
        (friend) => friend.toString() !== friendId
      );

      // Remove user from friend's friend list
      friendDoc.friends = friendDoc.friends.filter(
        (friend) => friend.toString() !== userId.toString()
      );
      console.log("userDoc",userDoc.friends)
      console.log("friendDoc",friendDoc.friends)

      await userDoc.save();
      await friendDoc.save();

      res.status(200).json({ message: "Friend removed successfully." });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server error." });
    }
  };
  
  public getFriends = async (req, res) => {
    try {
      const userId = req.authUser._id;
      const userDoc = await user.findById(userId).populate('friends', 'fullname email profile_picture account_type');

      if (!userDoc) {
        return res.status(404).json({ error: "User not found." });
      }

      res.status(200).json({ friends: userDoc.friends });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Server error." });
    }
  };

  public updateIsPrivate = async (req, res) => {
    try {
      if (req["authUser"]) {
        const { isPrivate } = req.body;
        const userId = req.authUser._id;

        const result: ResponseBuilder = await this.userService.updateIsPrivate(userId, isPrivate);
        if (result.status !== CONSTANCE.FAIL) {
          res.status(result.code).json(result);
        } else {
          res.status(result.code).json({
            status: result.status,
            error: result.error,
            code: CONSTANCE.RES_CODE.error.badRequest,
          });
        }
      }
    } catch (err) {
      return res
        .status(500)
        .send({ status: CONSTANCE.FAIL, error: err.error });
    }
  };

  /**
   * Stripe User KYC
   */

  public createVerificationSessionStripeKYC = async (req: any, res: Response) => {
    try {
      if (req["authUser"]) {
      const result: ResponseBuilder = await this.userService.createVerificationSessionStripeKYC(req.authUser);
      return res.status(CONSTANCE.RES_CODE.success).json({ data: result });
      }
    } catch (error) {
      res.status(CONSTANCE.RES_CODE.error.internalServerError).json({
        success: 0,
        message: Message.internal,
      });
    }
  }

  public getAllBooking = async (req: any, res: Response) => {
    try {
      if (req["authUser"]) {
      const result: ResponseBuilder = await this.userService.getAllBooking();
      return res.status(CONSTANCE.RES_CODE.success).json({ data: result });
      }
    } catch (error) {
      res.status(CONSTANCE.RES_CODE.error.internalServerError).json({
        success: 0,
        message: Message.internal,
      });
    }
  }

  public getAllBookingById = async (req: any, res: Response) => {
    try {
      if (req["authUser"]) {

        const trainer_id = req["authUser"]?._id;
        const account_type = req["authUser"]?.account_type;
        const page = req?.query?.page ?? 1;
        const limit = req?.query?.limit ?? 2000;

        const result: ResponseBuilder = await this.userService.getAllBookingById(trainer_id,account_type, page, limit);
        
        return res.status(CONSTANCE.RES_CODE.success).json({ data: result });
      }
    } catch (error) {
      res.status(CONSTANCE.RES_CODE.error.internalServerError).json({
        success: 0,
        message: Message.internal,
      });
    }
  }

  public createStripeAccountVarificationUrl = async (req: any, res: Response) => {
    try {
      // if (req["authUser"]) {
        const result: ResponseBuilder = await this.userService.createStripeAccountVarificationUrl(req.body);
        return res.status(CONSTANCE.RES_CODE.success).json({ data: result });
      // }
    } catch (error) {
      res.status(CONSTANCE.RES_CODE.error.internalServerError).json({
        success: 0,
        message: Message.internal,
      });
    }
  }

  public checkIsKycCompleted = async (req: any, res: Response) => {
    try {
      if (req["authUser"]) {
       const stripe_account_id = req["authUser"].stripe_account_id;
        const result: ResponseBuilder = await this.userService.checkIsKycCompleted(req["authUser"],stripe_account_id);
        return res.status(CONSTANCE.RES_CODE.success).json({ data: result });
      }
    } catch (error) {
      res.status(CONSTANCE.RES_CODE.error.internalServerError).json({
        success: 0,
        message: Message.internal,
      });
    }
  }

  public updateRefundStatus = async (req, res) => {
    try {
      if (req["authUser"]) {
        const result: ResponseBuilder = await this.userService.updateRefundStatus(req.body);
        if (result.status !== CONSTANCE.FAIL) {
          res.status(result.code).json(result);
        } else {
          res.status(result.code).json({
            status: result.status,
            error: result.error,
            code: CONSTANCE.RES_CODE.error.badRequest,
          });
        }
      }
    } catch (err) {
      return res
        .status(500)
        .send({ status: CONSTANCE.FAIL, error: err.error });
    }
  };

  public captureWriteUs = async (req, res) => {
    try {
      if (req["authUser"]) {
        const id = req["authUser"]._id
        const result: ResponseBuilder = await this.userService.captureWriteUs(id,req.body);
        if (result.status !== CONSTANCE.FAIL) {
          res.status(result.code).json(result);
        } else {
          res.status(result.code).json({
            status: result.status,
            error: result.error,
            code: CONSTANCE.RES_CODE.error.badRequest,
          });
        }
      }
    } catch (err) {
      return res
        .status(500)
        .send({ status: CONSTANCE.FAIL, error: err.error });
    }
  };

  public createRaiseConcern = async (req, res) => {
    try {
      if (req["authUser"]) {
        const id = req["authUser"]._id
        const result: ResponseBuilder = await this.userService.createRaiseConcern(id,req.body);
        if (result.status !== CONSTANCE.FAIL) {
          res.status(result.code).json(result);
        } else {
          res.status(result.code).json({
            status: result.status,
            error: result.error,
            code: CONSTANCE.RES_CODE.error.badRequest,
          });
        }
      }
    } catch (err) {
      return res
        .status(500)
        .send({ status: CONSTANCE.FAIL, error: err.error });
    }
  };

  public getCaptureWriteUs = async (req, res) => {
    try {
      if (req["authUser"]) {
        const id = req["authUser"]._id
        const result: ResponseBuilder = await this.userService.getCaptureWriteUs();
        if (result.status !== CONSTANCE.FAIL) {
          res.status(result.code).json(result);
        } else {
          res.status(result.code).json({
            status: result.status,
            error: result.error,
            code: CONSTANCE.RES_CODE.error.badRequest,
          });
        }
      }
    } catch (err) {
      return res
        .status(500)
        .send({ status: CONSTANCE.FAIL, error: err.error });
    }
  };

  public getRaiseConcern = async (req, res) => {
    try {
      if (req["authUser"]) {
        const id = req["authUser"]._id
        const result: ResponseBuilder = await this.userService.getRaiseConcern();
        if (result.status !== CONSTANCE.FAIL) {
          res.status(result.code).json(result);
        } else {
          res.status(result.code).json({
            status: result.status,
            error: result.error,
            code: CONSTANCE.RES_CODE.error.badRequest,
          });
        }
      }
    } catch (err) {
      return res
        .status(500)
        .send({ status: CONSTANCE.FAIL, error: err.error });
    }
  };

  public updateWriteUsTicketStatus = async (req, res) => {
    try {
      if (req["authUser"]) {
        const result: ResponseBuilder = await this.userService.updateWriteUsTicketStatus(req.body);
        if (result.status !== CONSTANCE.FAIL) {
          res.status(result.code).json(result);
        } else {
          res.status(result.code).json({
            status: result.status,
            error: result.error,
            code: CONSTANCE.RES_CODE.error.badRequest,
          });
        }
      }
    } catch (err) {
      return res
        .status(500)
        .send({ status: CONSTANCE.FAIL, error: err.error });
    }
  };

  public updateRaiseConcernTicketStatus = async (req, res) => {
    try {
      if (req["authUser"]) {
        const result: ResponseBuilder = await this.userService.updateRaiseConcernTicketStatus(req.body);
        if (result.status !== CONSTANCE.FAIL) {
          res.status(result.code).json(result);
        } else {
          res.status(result.code).json({
            status: result.status,
            error: result.error,
            code: CONSTANCE.RES_CODE.error.badRequest,
          });
        }
      }
    } catch (err) {
      return res
        .status(500)
        .send({ status: CONSTANCE.FAIL, error: err.error });
    }
  };

  public getAllLatestOnlineUser = async (req, res) => {
    try {
        const result: ResponseBuilder = await this.userService.getAllLatestOnlineUser();
        if (result.status !== CONSTANCE.FAIL) {
          res.status(result.code).json(result);
        } else {
          res.status(result.code).json({
            status: result.status,
            error: result.error,
            code: CONSTANCE.RES_CODE.error.badRequest,
          });
        }
    } catch (err) {
      return res
        .status(500)
        .send({ status: CONSTANCE.FAIL, error: err.error });
    }
  };

}
