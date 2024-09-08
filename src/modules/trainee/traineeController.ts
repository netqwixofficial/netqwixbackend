import { Response, Request } from "express";
import { log } from "../../../logger";
import { CONSTANCE, UPDATE_FIELDS } from "../../config/constance";
import { ResponseBuilder } from "../../helpers/responseBuilder";
import { TraineeService } from "./traineeService";
import { bookSessionModal } from "./traineeValidator";
import * as _ from "lodash";
import { TrainerService } from "../trainer/trainerService";

export class traineeController {
  public logger = log.getLogger();
  public traineeService = new TraineeService();
  public trainerService = new TrainerService();

  public getSlotsOfAllTrainers = async (req: any, res: Response) => {
    try {
      const result: ResponseBuilder =
        await this.traineeService.getSlotsOfAllTrainers(req.query);
      if (result.status === CONSTANCE.FAIL) {
        return res.status(result.code).send({ message: result.error });
      }
      return res
        .status(result.code)
        .send({ status: CONSTANCE.SUCCESS, data: result.result });
    } catch (err) {
      this.logger.error(err);
      return res
        .status(err.code)
        .send({ status: CONSTANCE.FAIL, error: err.error });
    }
  };

  public bookSession = async (req: Request, res: Response) => {
    try {
      const { body } = req;
      const result: ResponseBuilder = await this.traineeService.bookSession(
        body,
        req["authUser"]["_id"]
      );
      if (result.status === CONSTANCE.FAIL) {
        return res.status(result.code).send({ message: result.error });
      }

      if (req?.body?.slot_id) {
        await this.trainerService.updateStot({ _id: req?.body?.slot_id, status: true });
      }
      else {
        var date = new Date(body?.booked_date).toISOString().split("T")[0];
        var dateArr = date?.split("-");
        var start_time = body?.session_start_time;
        var end_time = body?.session_end_time;

        let start_time_date = new Date(Number(dateArr[0]), Number(dateArr[1]) - 1, Number(dateArr[2]), Number(start_time.split(":")[0]), Number(start_time.split(":")[1]), 0, 0).toISOString()
        let end_time_date = new Date(Number(dateArr[0]), Number(dateArr[1]) - 1, Number(dateArr[2]), Number(end_time.split(":")[0]), Number(end_time.split(":")[1]), 0, 0).toISOString()

        await this.trainerService.updateManyStot({
          $and: [
            {
              $or: [
                {
                  start_time: {
                    $gt: start_time_date,
                    $lt: end_time_date,
                  },
                },
                {
                  end_time: {
                    $gt: start_time_date,
                    $lt: end_time_date,
                  },
                },
              ],
            },
            {
              trainer_id: body?.trainer_id
            }
          ]
        }, { $set: { status: true } });
      }

      return res
        .status(result.code)
        .send({ status: CONSTANCE.SUCCESS, data: result.result });
    } catch (err) {
      this.logger.error(err);
      return res
        .status(err.code)
        .send({ status: CONSTANCE.FAIL, error: err.error });
    }
  };

  public bookInstantMeeting = async (req: Request, res: Response) => {
    try {
      const result: ResponseBuilder =
        await this.traineeService.bookInstantMeeting(
          req["body"],
          req["authUser"]["_id"]
        );
      return res
        .status(result.code)
        .send({ status: CONSTANCE.SUCCESS, data: result.result });
    } catch (err) {
      this.logger.error(err);
      return res
        .status(err.code)
        .send({ status: CONSTANCE.FAIL, error: err.error });
    }
  };

  public updateProfile = async (req: any, res: Response) => {
    try {
      const payload = _.pick(req.body, UPDATE_FIELDS.user);
      const result: ResponseBuilder = await this.traineeService.updateProfile(
        payload,
        req.authUser
      );
      return res
        .status(result.code)
        .send({ status: CONSTANCE.SUCCESS, data: result.result });
    } catch (err) {
      this.logger.error(err);
      return res
        .status(err.code)
        .send({ status: CONSTANCE.FAIL, error: err.error });
    }
  };

  public checkSlotExist = async (req: any, res: Response) => {
    try {
      const result: ResponseBuilder = await this.traineeService.checkSlotExist(
        req.body
      );
      if (result.status === CONSTANCE.FAIL) {
        return res.status(result.code).send({ message: result.error });
      }
      return res
        .status(result.code)
        .send({ status: CONSTANCE.SUCCESS, data: result.result });
    } catch (err) {
      this.logger.error(err);
      return res
        .status(err.code)
        .send({ status: CONSTANCE.FAIL, error: err.error });
    }
  };
}
