import { log } from "./../../../logger";
import { CONSTANCE, Message } from "./../../config/constance";
import { ResponseBuilder } from "./../../helpers/responseBuilder";
import { Request, Response } from "express";
import { UserService } from "./userService";
import { updateBookedStatusModal } from "./userValidator";
import booked_session from "../../model/booked_sessions.schema";

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
