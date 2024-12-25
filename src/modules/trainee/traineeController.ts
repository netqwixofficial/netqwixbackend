import { Response, Request } from "express";
import { log } from "../../../logger";
import {
  CONSTANCE,
  NetquixImage,
  SessionReminderMinutes,
  UPDATE_FIELDS,
} from "../../config/constance";
import { ResponseBuilder } from "../../helpers/responseBuilder";
import { TraineeService } from "./traineeService";
import { bookSessionModal } from "./traineeValidator";
import * as _ from "lodash";
import { TrainerService } from "../trainer/trainerService";
import { DateTime } from "luxon";
const schedule = require("node-schedule");
import { SendEmail } from "../../Utils/sendEmail";
import user from "../../model/user.schema";
import * as cron from "node-cron";
import SMSService from "../../services/sms-service";
import { CovertTimeAccordingToTimeZone } from "../../Utils/Utils";

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
        await this.trainerService.updateStot({
          _id: req?.body?.slot_id,
          status: true,
        });
      } else {
        var date = new Date(body?.booked_date).toISOString().split("T")[0];
        var dateArr = date?.split("-");
        var start_time = body?.session_start_time;
        var end_time = body?.session_end_time;

        let start_time_date = new Date(
          Number(dateArr[0]),
          Number(dateArr[1]) - 1,
          Number(dateArr[2]),
          Number(start_time.split(":")[0]),
          Number(start_time.split(":")[1]),
          0,
          0
        ).toISOString();
        let end_time_date = new Date(
          Number(dateArr[0]),
          Number(dateArr[1]) - 1,
          Number(dateArr[2]),
          Number(end_time.split(":")[0]),
          Number(end_time.split(":")[1]),
          0,
          0
        ).toISOString();

        await this.trainerService.updateManyStot(
          {
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
                trainer_id: body?.trainer_id,
              },
            ],
          },
          { $set: { status: true } }
        );
      }

      const trainee = await user.findById(result.result.trainee_id);
      const trainer = await user.findById(result.result.trainer_id);

      if (!trainee || !trainer) {
        return console.error("User not found.");
      }

      console.log("result.result.start_time", result.result.start_time);
      const startTime = CovertTimeAccordingToTimeZone(result.result.start_time,{to:"utc",from:result.result.time_zone});

      const runTime = startTime.minus({ minutes: 5 });
      console.log("startTime", startTime);
      console.log("runTime", runTime, runTime.toJSDate());

      if (!trainee.isPrivate && !trainer.isPrivate) {
        if (!trainee.friends.includes(trainer._id)) {
          trainee.friends.push(trainer._id);
        }
        if (!trainer.friends.includes(trainee._id)) {
          trainer.friends.push(trainee._id);
        }

        await trainee.save();
        await trainer.save();
      }

      console.log("datahaiji", result.result);
      console.log("`${runTime.minute} ${runTime.hour} ${runTime.day} ${runTime.month} *`",`${runTime.minute} ${runTime.hour} ${runTime.day} ${runTime.month} *`)
      const cronTime = `${runTime.minute} ${runTime.hour} ${runTime.day} ${runTime.month} *`;

      const meetingLink = process.env.FRONTEND_URL_SMS+"/meeting?id="

      if (
        trainer.extraInfo.availabilityInfo.timeZone === result.result.time_zone
      ) {
        cron.schedule(cronTime, async () => {
          try {
            if (!trainee || !trainer) {
              return console.error("User not found.");
            }

            // Send emails to both the trainee and trainer
            SendEmail.sendRawEmail(
              null,
              null,
              [trainee.email],
              `REMINDER: Your NetQwix Training Session Starts in ${SessionReminderMinutes.FIVE} minutes at ${result.result.booked_date}`,
              null,
              `<div style="font-family: Verdana,Arial,Helvetica,sans-serif;font-size: 18px;line-height: 30px;">
                <i  style='color:#ff0000'>${trainee.fullname},</i>
                <br/><br/>
                This is your ${SessionReminderMinutes.FIVE} minute reminder that your Training Session will begin in ${SessionReminderMinutes.FIVE} minutes.
                ${result.result.booked_date}
                <br/><br/>
                Team NetQwix recommends logging in 2-5 minutes prior to your scheduled session.<br/><br/>
                Thank You For Booking the Slot in NetQwix.
                <br/><br/>
                From,  <br/>
                NetQwix Team. <br/>
                <img src=${NetquixImage.logo} style="object-fit: contain; width: 180px;"/>
              </div>`
            );

            const covertedBookedTime = CovertTimeAccordingToTimeZone(
              result.result.booked_date,
              {
                to: trainer.extraInfo.availabilityInfo.timeZone,
                from: result.result.time_zone,
              }
            );

            SendEmail.sendRawEmail(
              null,
              null,
              [trainer.email],
              `REMINDER: Your NetQwix Training Session Starts in ${SessionReminderMinutes.FIVE} minutes at ${result.result.booked_date}`,
              null,
              `<div style="font-family: Verdana,Arial,Helvetica,sans-serif;font-size: 18px;line-height: 30px;">
                <i  style='color:#ff0000'>${trainer.fullname},</i>
                <br/><br/>
                This is your ${SessionReminderMinutes.FIVE} minute reminder that your Training Session will begin in ${SessionReminderMinutes.FIVE} minutes.
                ${result.result.booked_date}
                <br/><br/>
                Team NetQwix recommends logging in 2-5 minutes prior to your scheduled session.<br/><br/>
                Thank You For Booking the Slot in NetQwix.
                <br/><br/>
                From,  <br/>
                NetQwix Team. <br/>
                <img src=${NetquixImage.logo} style="object-fit: contain; width: 180px;"/>
              </div>`
            );

            const smsService = new SMSService();

            await smsService.sendSMS(
              trainer.mobile_no,
              `REMINDER: Your NetQwix Training Session Starts in ${SessionReminderMinutes.FIVE} minutes at ${result.result.booked_date}` +
                " With " +
                trainee.fullname +`. Join with this link ${meetingLink+result.result._id}`
            );
            await smsService.sendSMS(
              trainee.mobile_no,
              `REMINDER: Your NetQwix Training Session Starts in ${SessionReminderMinutes.FIVE} minutes at ${result.result.booked_date}` +
                " With " +
                trainer.fullname +`. Join with this link ${meetingLink+result.result._id}`
            );
          } catch (err) {
            console.error("Error running cron job:", err);
          }
        });
      } else {
        cron.schedule(cronTime, async () => {
          console.log("Running Cron", cronTime);
          try {
            // Send emails to both the trainee and trainer
            SendEmail.sendRawEmail(
              null,
              null,
              [trainee.email],
              `REMINDER: Your NetQwix Training Session Starts in ${SessionReminderMinutes.FIVE} minutes at ${result.result.booked_date}`,
              null,
              `<div style="font-family: Verdana,Arial,Helvetica,sans-serif;font-size: 18px;line-height: 30px;">
                  <i  style='color:#ff0000'>${trainee.fullname},</i>
                  <br/><br/>
                  This is your ${SessionReminderMinutes.FIVE} minute reminder that your Training Session will begin in ${SessionReminderMinutes.FIVE} minutes.
                  ${result.result.booked_date}
                  <br/><br/>
                  Team NetQwix recommends logging in 2-5 minutes prior to your scheduled session.<br/><br/>
                  Thank You For Booking the Slot in NetQwix.
                  <br/><br/>
                  From,  <br/>
                  NetQwix Team. <br/>
                  <img src=${NetquixImage.logo} style="object-fit: contain; width: 180px;"/>
                </div>`
            );

            const covertedBookedTime = CovertTimeAccordingToTimeZone(
              result.result.booked_date,
              {
                to: trainer.extraInfo.availabilityInfo.timeZone,
                from: result.result.time_zone,
              }
            );

            SendEmail.sendRawEmail(
              null,
              null,
              [trainer.email],
              `REMINDER: Your NetQwix Training Session Starts in ${SessionReminderMinutes.FIVE} minutes at ${covertedBookedTime}`,
              null,
              `<div style="font-family: Verdana,Arial,Helvetica,sans-serif;font-size: 18px;line-height: 30px;">
                    <i  style='color:#ff0000'>${trainer.fullname},</i>
                    <br/><br/>
                    This is your ${SessionReminderMinutes.FIVE} minute reminder that your Training Session will begin in ${SessionReminderMinutes.FIVE} minutes.
                    ${covertedBookedTime}
                    <br/><br/>
                    Team NetQwix recommends logging in 2-5 minutes prior to your scheduled session.<br/><br/>
                    Thank You For Booking the Slot in NetQwix.
                    <br/><br/>
                    From,  <br/>
                    NetQwix Team. <br/>
                    <img src=${NetquixImage.logo} style="object-fit: contain; width: 180px;"/>
                  </div>`
            );

            const smsService = new SMSService();

            await smsService.sendSMS(
              trainer.mobile_no,
              `REMINDER: Your NetQwix Training Session Starts in ${SessionReminderMinutes.FIVE} minutes at ${covertedBookedTime}` +
                " With " +
                trainee.fullname +`. Join with this link ${meetingLink+result.result._id}`
            );

            await smsService.sendSMS(
              trainee.mobile_no,
              `REMINDER: Your NetQwix Training Session Starts in ${SessionReminderMinutes.FIVE} minutes at ${result.result.booked_date}` +
                " With " +
                trainer.fullname +`. Join with this link ${meetingLink+result.result._id}`
            );
          } catch (err) {
            console.error("Error running cron job:", err);
          }
        });
      }

      return res
        .status(result.code)
        .send({ status: CONSTANCE.SUCCESS, data: result.result });
    } catch (err) {
      console.log("errorhaiji", err);
      this.logger.error(err);
      return res
        .status(err.code || 500)
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
      console.log("req.body", req.body);
      console.log("UPDATE_FIELDS", UPDATE_FIELDS);
      const payload = _.pick(req.body, UPDATE_FIELDS.user);
      console.log("payload", payload);
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

  public checkSlotExist = async (req: Request, res: Response) => {
    try {
      console.log("body", req.body);
      const result: ResponseBuilder = await this.traineeService.checkSlotExist(
        req.body
      );
      const requestedDate = req.body.booked_date; // Assuming booked_date is a string in "YYYY-MM-DD" format
      const today = new Date().toISOString().split("T")[0]; // Format today's date as "YYYY-MM-DD"

      // Filter out past slots if the request is for today's date
      // Filter out past slots if the request is for today's date
      if (requestedDate === today) {
        const currentTime = new Date();

        result.result.availableSlots = result.result.availableSlots.filter(
          (slot: { start: string; end: string }) => {
            // Create a Date object for the slot's start time on today's date
            const slotStartTime = new Date(`${requestedDate}T${slot.start}:00`); // Assuming time format "HH:MM"

            // Only keep slots where the start time is later than the current time
            return slotStartTime > currentTime;
          }
        );
      }

      console.log("result", JSON.stringify(result.result));

      if (result.status === CONSTANCE.FAIL) {
        return res.status(result?.code || 404).send({ message: result.error });
      }
      return res
        .status(result?.code || 200)
        .send({ status: CONSTANCE.SUCCESS, data: result.result });
    } catch (err) {
      this.logger.error(err);
      console.log("err", err);
      return res
        .status(err.code || 500)
        .send({ status: CONSTANCE.FAIL, error: err });
    }
  };

  public recentTrainers = async (req: any, res: Response) => {
    try {
      console.log("hello", req.authUser._id);
      const result: ResponseBuilder = await this.trainerService.recentTrainers(
        req?.authUser._id
      );
      if (result.status === CONSTANCE.FAIL) {
        return res.status(result.code).send({ message: result.error });
      }
      return res
        .status(result.code)
        .send({ status: CONSTANCE.SUCCESS, data: result.result });
    } catch (err) {
      this.logger.error(err);
      return res.status(err.code || 500).send({
        status: CONSTANCE.FAIL,
        error: err.message || "Internal Server Error",
      });
    }
  };
}
