import { log } from "../../../logger";
import {
  BOOKED_SESSIONS_STATUS,
  CONSTANCE,
  NetquixImage,
  amountType,
  timeRegex,
} from "../../config/constance";
import {
  getSearchRegexQuery,
  isValidMongoObjectId,
} from "../../helpers/mongoose";
import { ResponseBuilder } from "../../helpers/responseBuilder";
import schedule_inventory from "../../model/schedule_inventory.schema";
import * as l10n from "jm-ez-l10n";
import { bookSessionModal, bookInstantMeetingModal } from "./traineeValidator";
import booked_session from "../../model/booked_sessions.schema";
import { PipelineStage } from "mongoose";
import { DateFormat } from "../../Utils/dateFormat";
import { SendEmail } from "../../Utils/sendEmail";
import user from "../../model/user.schema";
import { Utils } from "../../Utils/Utils";
import * as mongoose from "mongoose";
import { Failure } from "../../helpers/error";

export class TraineeService {
  public log = log.getLogger();

  public async getSlotsOfAllTrainers(query): Promise<any> {
    try {
      const {
        search,
        day = null,
        time = JSON.stringify({ from: "00:00", to: "23:59" }),
      } = query;
      if (
        typeof search !== "string" ||
        search.trim() === "" ||
        !isNaN(Number(search))
      ) {
        return ResponseBuilder.badRequest(
          "Search parameter must be a non-empty string",
          400
        );
      }
      let searchQuery = getSearchRegexQuery(
        search,
        CONSTANCE.USERS_SEARCH_KEYS
      );

      // const filteredTrainer =
      //   (day && day.length) || (time && time.length)
      //     ? (
      //         await this.filterTrainersByDayAndTime(
      //           day,
      //           time ? JSON.parse(time) : null
      //         )
      //       ).map((trainer) => trainer.trainer_id)
      //     : [];
      // console.info("searchQuery---", JSON.stringify(searchQuery));
      // const result = await schedule_inventory.aggregate([
      //   {
      //     $match:
      //       Array.isArray(filteredTrainer) && filteredTrainer.length
      //         ? {
      //             trainer_id: { $in: filteredTrainer || [] },
      //           }
      //         : {},
      //   },
      //   {
      //     $lookup: {
      //       from: "users",
      //       localField: "trainer_id",
      //       foreignField: "_id",
      //       as: "trainer",
      //     },
      //   },
      //   {
      //     $match: searchQuery,
      //   },
      //   {
      //     $lookup: {
      //       from: "booked_sessions",
      //       localField: "trainer_id",
      //       foreignField: "trainer_id",
      //       let: {
      //         session_booked_trainer_id: "$trainer_id",
      //         session_booked_status: "$status",
      //         session_ratings: "$ratings",
      //       },
      //       pipeline: [
      //         {
      //           $lookup: {
      //             from: "users",
      //             localField: "trainee_id",
      //             foreignField: "_id",
      //             as: "trainee_info",
      //           },
      //         },
      //         {
      //           $match: {
      //             $or: [
      //               { status: BOOKED_SESSIONS_STATUS.confirm },
      //               { status: BOOKED_SESSIONS_STATUS.completed },
      //             ],
      //           },
      //         },
      //         {
      //           $project: {
      //             status: 1,
      //             trainee_fullname: {
      //               $arrayElemAt: ["$trainee_info.fullname", 0],
      //             },
      //             updatedAt: 1,
      //             ratings: {
      //               trainee: {
      //                 sessionRating: 1,
      //                 recommendRating: 1,
      //                 audioVideoRating: 1,
      //                 title: 1,
      //                 remarksInfo: 1,
      //                 traineeFullname: 1,
      //               },
      //             },
      //           },
      //         },
      //       ],
      //       as: "trainer_ratings",
      //     },
      //   },
      //   {
      //     $project: {
      //       _id: 1,
      //       trainer_ratings: 1,
      //       trainer_id: 1,
      //       available_slots: 1,
      //       extraInfo: { $arrayElemAt: ["$trainer.extraInfo", 0] },
      //       fullname: { $arrayElemAt: ["$trainer.fullname", 0] },
      //       email: { $arrayElemAt: ["$trainer.email", 0] },
      //       category: { $arrayElemAt: ["$trainer.category", 0] },
      //       profilePicture: { $arrayElemAt: ["$trainer.profile_picture", 0] },
      //     },
      //   },
      // ]);
      const pipeline: PipelineStage[] = [
        {
          $match: {
            $and: [{ account_type: "Trainer" }],
            $or: searchQuery.$or,
          },
        },
        {
          $lookup: {
            from: "booked_sessions",
            localField: "_id",
            foreignField: "trainer_id",
            pipeline: [
              {
                $lookup: {
                  from: "users",
                  localField: "trainee_id",
                  foreignField: "_id",
                  as: "trainee_info",
                },
              },
              {
                $match: {
                  $or: [
                    { status: BOOKED_SESSIONS_STATUS.confirm },
                    { status: BOOKED_SESSIONS_STATUS.completed },
                  ],
                },
              },
              {
                $project: {
                  status: 1,
                  trainee_fullname: {
                    $arrayElemAt: ["$trainee_info.fullname", 0],
                  },
                  updatedAt: 1,
                  ratings: 1,
                },
              },
            ],
            as: "trainer_ratings",
          },
        },
        {
          $project: {
            _id: 1,
            available_slots: CONSTANCE.SCHEDULING_SLOTS.available_slots,
            trainer_id: "$_id",
            trainer_ratings: 1,
            extraInfo: 1,
            fullname: 1,
            email: 1,
            category: 1,
            profilePicture: "$profile_picture",
            stripe_account_id: 1,
            is_kyc_completed: 1,
            commission: 1,
          },
        },
      ];
      const result = await user.aggregate(pipeline);
      return ResponseBuilder.data(result, l10n.t("GET_ALL_SLOTS"));
    } catch (err) {
      console.log(`err ---- `, err);
      return ResponseBuilder.error(err, l10n.t("ERR_INTERNAL_SERVER"));
    }
  }

  public filterTrainersByDayAndTime = async (day, time) => {
    try {
      console.log(`filterQuery ---- `, day, time);

      const result = await schedule_inventory
        .aggregate([
          {
            $unwind: "$available_slots",
          },
          {
            $match: day
              ? {
                "available_slots.day": day,
              }
              : {},
          },
          {
            $unwind: "$available_slots.slots",
          },
          {
            $match: {
              "available_slots.slots.start_time": { $ne: "" }, // Exclude slots with empty start_time
              "available_slots.slots.end_time": { $ne: "" }, // Exclude slots with empty start_time
              $expr: {
                $and: [
                  {
                    $gte: ["$available_slots.slots.end_time", time.form],
                  },
                  {
                    $lte: ["$available_slots.slots.start_time", time.to],
                  },
                ],
              },
            },
          },
          {
            $project: {
              _id: 1,
              trainer_id: 1,
              available_slots: 1,
            },
          },
        ])
        .exec();

      console.log(`available_slots ---- `, result);
      return result;
    } catch (err) {
      console.log(`err ---- `, err);
      throw err;
    }
  };

  public async bookSession(
    payload: bookSessionModal,
    _id: string
  ): Promise<ResponseBuilder> {
    try {
      if (
        !payload ||
        !payload.trainer_id ||
        !payload.booked_date ||
        !payload.session_start_time ||
        !payload.session_end_time ||
        !payload.charging_price
      ) {
        const validationError: Failure = {
          type: "BAD_DATA",
          name: "",
          message: "",
          description: "Invalid input data",
          errorStack: "",
          title: "Bad Request",
          data: null,
        };
        return ResponseBuilder.error(validationError, "Invalid input data");
      }
      if (
        !timeRegex.test(
          typeof payload.session_start_time === "string" &&
          payload.session_start_time
        ) ||
        !timeRegex.test(
          typeof payload.session_end_time === "string" &&
          payload.session_end_time
        )
      ) {
        return ResponseBuilder.badRequest(
          "Invalid time format. Please use HH:mm format."
        );
      }
      const sessionObj = new booked_session({ ...payload, trainee_id: _id });
      const trainerId = sessionObj["trainer_id"];
      const trainerDetails = await user.findById({ _id: trainerId });
      const traineeId = sessionObj["trainee_id"];
      const traineeDetails = await user.findById({ _id: traineeId });
      const bookedDate = Utils.formattedDateMonthDateYear(
        sessionObj["booked_date"]
      );
      const startTime = Utils.convertToAmPm(sessionObj["session_start_time"]);
      console.log(startTime);
      const endTime = Utils.convertToAmPm(sessionObj["session_end_time"]);
      console.log(endTime);
      const bookedTime = `${startTime} To ${endTime}`;
      const subject = `NetQwix Training Session Booked for ${bookedDate} at ${bookedTime} EST`;
      const traineeMessageTemplate = `<div style="font-family: Verdana, Arial, Helvetica, sans-serif; font-size: 18px; line-height: 30px;">
        Dear <i style='color:#ff0000'>${traineeDetails.fullname},</i>
        <br/><br/>
        Thank You for booking your NetQwix Training Session with <i style='color:#ff0000'>${trainerDetails.fullname}</i>.
        Your session has been booked for <i style='color:#ff0000'>${bookedDate}</i> at <i style='color:#ff0000'>${bookedTime} EST</i>.
        <br/><br/>
        Team NetQwix.
        <br/>
        <img src=${NetquixImage.logo} width='100px' height='100px'/>
      </div>`;
      const trainerMessageTemplate = `<div style="font-family: Verdana, Arial, Helvetica, sans-serif; font-size: 18px; line-height: 30px;">
        Dear <i style='color:#ff0000'>${trainerDetails.fullname},</i>
        <br/><br/>
        Thank You for booking your NetQwix Training Session with <i style='color:#ff0000'>${traineeDetails.fullname}</i>.
        Your session has been booked for <i style='color:#ff0000'>${bookedDate}</i> at <i style='color:#ff0000'>${bookedTime} EST</i>.
        <br/><br/>
        Team NetQwix.
        <br/>
        <img src=${NetquixImage.logo} width='100px' height='100px'/>
      </div>`;
      const charging_price = `${amountType.USD}${+payload.charging_price}.`;
      const paymentConfirmationSubject = "NetQwix payment confirmed";
      const paymentConfirmationMessage = `<div style="font-family: Verdana,Arial,Helvetica,sans-serif;font-size: 18px;line-height: 30px;">
        	Hello <i  style='color:#ff0000'>${traineeDetails.fullname},</i>
          <br/><br/>
        	 Payment received successfully <b><i style='color:#ff0000'>${charging_price}</i></b>
          <br/><br/>
           Please wait for ${trainerDetails.fullname} to confirm the booking. We'll notify you as soon as its done.
           <br/><br/>
        	Thank You
          <br/>
        	Team NetQwix.
          <br/>
        	<img src=${NetquixImage.logo} width='100px' height='100px'/>
        	 </div>`;
      SendEmail.sendRawEmail(
        null,
        null,
        traineeDetails.email,
        subject,
        null,
        traineeMessageTemplate
      );
      SendEmail.sendRawEmail(
        null,
        null,
        trainerDetails.email,
        subject,
        null,
        trainerMessageTemplate
      );
      if (payload.status === BOOKED_SESSIONS_STATUS["BOOKED"]) {
        SendEmail.sendRawEmail(
          null,
          null,
          [traineeDetails.email],
          paymentConfirmationSubject,
          null,
          paymentConfirmationMessage
        );
      }
      var bookingData = await sessionObj.save();
      await user.updateOne(
        { _id: payload.trainer_id },
        { $inc: { wallet_amount: +payload.charging_price || 0 } }
      );
      return ResponseBuilder.data(bookingData, l10n.t("SESSION_BOOKED"));
    } catch (err) {
      console.log(err);
      const failure: Failure = {
        description: err.message,
        errorStack: err.stack || "",
        title: "Internal Server Error",
        type: "CODE",
        data: null,
        name: "",
        message: "",
      };
      return ResponseBuilder.error(failure, "ERR_INTERNAL_SERVER");
    }
  }

  public async bookInstantMeeting(
    payload: bookInstantMeetingModal,
    _id: string
  ): Promise<ResponseBuilder> {
    const { trainer_id, booked_date } = payload;
    try {
      const session_start_time = DateFormat.addMinutes(
        booked_date,
        10,
        CONSTANCE.INSTANT_MEETING_TIME_FORMAT
      );

      const session_end_time = DateFormat.addMinutes(
        booked_date,
        40,
        CONSTANCE.INSTANT_MEETING_TIME_FORMAT
      );

      const userObj = new booked_session({
        trainer_id,
        trainee_id: _id,
        status: BOOKED_SESSIONS_STATUS.confirm,
        booked_date,
        session_start_time,
        session_end_time,
      });

      await userObj.save();

      const trainerDetails = await user
        .findById(trainer_id)
        .select({ _id: 0, fullname: 1, email: 1 });

      SendEmail.sendRawEmail(
        "meeting",
        {
          "{NAME}": `${trainerDetails.fullname}`,
          "{MEETING_URL}": "https://google.com",
        },
        [trainerDetails.email],
        "Instant Meeting"
      );
      return ResponseBuilder.data({}, l10n.t("INSTANT_MEETING_BOOKED"));
    } catch (err) {
      return ResponseBuilder.error(err, l10n.t("ERR_INTERNAL_SERVER"));
    }
  }

  public async updateProfile(reqBody, authUser): Promise<ResponseBuilder> {
    try {
      await user.findOneAndUpdate(
        { _id: authUser["_id"].toString() },
        { $set: { ...reqBody } },
        { new: true }
      );
      return ResponseBuilder.data({}, l10n.t("PROFILE_UPDATED"));
    } catch (err) {
      throw err;
    }
  }

  public async checkSlotExist(reqBody): Promise<ResponseBuilder> {
    try {
      const { slotTime, trainer_id, booked_date } = reqBody;
      const trainerInfo = await user.findById(trainer_id);
      const { working_hours } = trainerInfo?.extraInfo || {
        from: "00:00",
        to: "23:59",
      };
      const isFutureOrToday = Utils.isFutureOrToday(booked_date);
      const isValidTrainerId = isValidMongoObjectId(trainer_id);
      if (!isValidTrainerId || !trainerInfo) {
        return ResponseBuilder.badRequest("Invalid trainer id", 400);
      }
      if (!isFutureOrToday) {
        return ResponseBuilder.badRequest(
          "Please choose either today's date or a future date",
          400
        );
      }

      const result = await booked_session
        .aggregate([
          {
            $match: {
              trainer_id: new mongoose.Types.ObjectId(trainer_id),
              status: { $ne: BOOKED_SESSIONS_STATUS.cancel },
              $or: [
                {
                  $and: [
                    {
                      session_start_time: {
                        $lte: working_hours?.from || "00:00",
                      },
                    },
                    {
                      session_end_time: {
                        $gte: working_hours?.from || "00:00",
                      },
                    },
                  ],
                },
                {
                  $and: [
                    {
                      session_start_time: {
                        $lte: working_hours?.to || "23:59",
                      },
                    },
                    {
                      session_end_time: {
                        $gte: working_hours?.to || "23:59",
                      },
                    },
                  ],
                },
                {
                  $and: [
                    {
                      session_start_time: {
                        $gte: working_hours?.from || "00:00",
                      },
                    },
                    {
                      session_end_time: {
                        $lte: working_hours?.to || "23:59",
                      },
                    },
                  ],
                },
              ],
              $expr: {
                $eq: [
                  {
                    $dateToString: {
                      format: "%Y-%m-%d",
                      date: "$booked_date",
                    },
                  },
                  booked_date,
                ],
              },
            },
          },
          {
            $project: {
              _id: 1,
              booked_date: 1,
              trainer_id: 1,
              trainee_id: 1,
              session_start_time: 1,
              session_end_time: 1,
            },
          },
        ])
        .exec();

      return ResponseBuilder.data(
        { isAvailable: result && result.length ? false : true, result },

        l10n.t("SLOT_STATUS")
      );
    } catch (err) {
      throw err;
    }
  }
}
