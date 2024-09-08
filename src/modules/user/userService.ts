import { ResponseBuilder } from "../../helpers/responseBuilder";
import { log } from "../../../logger";
import * as l10n from "jm-ez-l10n";
import user from "../../model/user.schema";
import write_us from "../../model/write_us.schema";
import { signupModel } from "../auth/authValidator/signup";
import { updateBookedStatusModal, updateRatings } from "./userValidator";
import booked_session from "../../model/booked_sessions.schema";
import {
  BOOKED_SESSIONS_STATUS,
  MONGO_DATE_FORMAT,
  Netquix,
  NetquixImage,
  utcOffset,
} from "../../config/constance";
import mongoose, { PipelineStage, Types } from "mongoose";
import { AccountType } from "../auth/authEnum";
import { SendEmail } from "../../Utils/sendEmail";
import { Utils } from "../../Utils/Utils";
import moment = require("moment");
import { DateFormat } from "../../Utils/dateFormat";
import { getSearchRegexQuery } from "../../helpers/mongoose";
import { stripeHelperController } from "../stripe/stripeHelperController";
import raise_concern from "../../model/raise_concern.schema";
import { Constant } from "../../Utils/constant";
import onlineUser from "../../model/online_user.schema";
const stripe = require("stripe")(process.env.STRIPE_SECRET);

export class UserService {
  public log = log.getLogger();
  public async createNewUser(
    createUser: signupModel
  ): Promise<ResponseBuilder> {
    this.log.info(createUser);
    const userObj = new user(createUser);
    await userObj.save();
    return ResponseBuilder.data(createUser, l10n.t("USER_PROFILE_SUCCESS"));
  }

  public async updateBookedSession(
    payload: updateBookedStatusModal,
    bookedSessionId: string,
    account_type
  ) {
    try {
      const bookedSessionDetail = await booked_session.findById(
        bookedSessionId
      );
      if (bookedSessionDetail && bookedSessionDetail._id) {
        if (bookedSessionDetail["status"] === BOOKED_SESSIONS_STATUS.cancel) {
          return ResponseBuilder.badRequest(
            l10n.t("SESSION_STATUS_CAN_NOT_REVERT")
          );
        }
        const result = await booked_session.findByIdAndUpdate(
          { _id: bookedSessionId },
          { status: payload.booked_status },
          { new: true }
        );
        const bookedDate = Utils.formattedDateMonthDateYear(result.booked_date);
        const sessionDuration = Utils.timeDurations(
          result.session_start_time,
          result.session_end_time
        );
        if (payload.booked_status === BOOKED_SESSIONS_STATUS.confirm) {
          const traineeInfo = await user.findById(
            bookedSessionDetail["trainee_id"]
          );
          const trainerInfo = await user.findById(
            bookedSessionDetail["trainer_id"]
          );
          const traineeName = traineeInfo.fullname;
          const trainerName = trainerInfo.fullname;
          SendEmail.sendRawEmail(
            null,
            null,
            [traineeInfo.email],
            `NetQwix Training Session has been ${payload.booked_status}`,
            null,
            `<div style="font-family: Verdana,Arial,Helvetica,sans-serif;font-size: 18px;line-height: 30px;">
          Hello <i  style='color:#ff0000'>${traineeName},</i>
          <br/><br/>
           Your NetQwix Training Session has been ${payload.booked_status} by your trainer <b><i style='color:#ff0000'>${trainerName}</i></b>
            for <b><i style='color:#ff0000'> ${bookedDate}.
           The session will last up to ${sessionDuration}.</i></b>
           <br/>
          Thank You
          <br/>
          Team NetQwix.
          <br/>
          <img src=${NetquixImage.logo} width='100px' height='100px'/>
           </div> `
          );
        }

        if (
          account_type === AccountType.TRAINER &&
          payload.booked_status === BOOKED_SESSIONS_STATUS.cancel
        ) {
          const payment_intent_id = bookedSessionDetail.payment_intent_id;
          const intent = await stripe.paymentIntents.retrieve(
            payment_intent_id
          );

          const latest_charge = intent.latest_charge;

          await stripe.refunds.create({
            charge: latest_charge,
            reverse_transfer: true,
            refund_application_fee: true,
          });

          await booked_session.findByIdAndUpdate(bookedSessionId, {
            refund_status: "refunded",
          });
        }
        return ResponseBuilder.data(
          { result },
          l10n.t("SESSION_STATUS_UPDATED")
        );
      } else {
        return ResponseBuilder.badRequest(l10n.t("INVALID_ID"));
      }
    } catch (err) {
      console.log(err);
      return ResponseBuilder.error(err, l10n.t("ERR_INTERNAL_SERVER"));
    }
  }

  public async getMe(userInfo) {
    try {
      if (!userInfo) {
        return ResponseBuilder.data({ userInfo }, "User not found");
      }
      if (
        userInfo.account_type === AccountType.TRAINER &&
        !userInfo.is_kyc_completed
      ) {
        const result = await stripeHelperController.getAccountByUserId(
          userInfo.stripe_account_id
        );
        if (
          result?.external_accounts?.data?.length > 0 &&
          result?.charges_enabled == true &&
          result?.details_submitted == true
        ) {
          const { _id } = userInfo;
          const updatedUserInfo = await user
            .findByIdAndUpdate(_id, { is_kyc_completed: true })
            .select("-subscriptionId");
          if (!updatedUserInfo) {
            return ResponseBuilder.data({ userInfo }, "User not found");
          }
          return ResponseBuilder.data({ updatedUserInfo }, "KYC completed");
        }
        return ResponseBuilder.data(
          { userInfo },
          "KYC not completed of this user"
        );
      }
      return ResponseBuilder.data({ userInfo }, "");
    } catch (err) {
      return ResponseBuilder.error(err, l10n.t("ERR_INTERNAL_SERVER"));
    }
  }

  public async shareClips(userInfo) {
    try {
      if (!userInfo) {
        return ResponseBuilder.data({ userInfo }, "User not found");
      } else {
        var html = "";

        var clips = userInfo?.clips;

        for (let index = 0; index < clips.length; index++) {
          const element = clips[index];
          html =
            html +
            `
           <div style="margin-bottom: 20px; padding: 10px; border: 1px solid #ccc; background-color: #fff; border-radius: 5px;">
              <div style="font-size: 18px; font-weight: bold; margin-bottom: 10px;">Title : ${element?.title}</div>
              <p><a href="https://pub-fffe76fa8765416caa3d396262faa16a.r2.dev/${element?._id}" target="_blank">https://pub-fffe76fa8765416caa3d396262faa16a.r2.dev/${element?._id}</a></p>
            </div>`;
        }

        SendEmail.sendRawEmail(
          null,
          null,
          [userInfo?.user_email],
          `NetQwix Video Clips`,
          null,
          `<div>
            ${html}
          </div>`
        );

        return ResponseBuilder.data({}, "");
      }
    } catch (err) {
      return ResponseBuilder.error(err, l10n.t("ERR_INTERNAL_SERVER"));
    }
  }

  public async inviteFriend(userInfo) {
    try {
      if (!userInfo) {
        return ResponseBuilder.data({ userInfo }, "User not found");
      } else {
        SendEmail.sendRawEmail(
          null,
          null,
          [userInfo?.user_email],
          `Exclusive Invitation to Join NetQwix Platform!`,
          null,
          `<div>
            <h1>Exclusive Invitation to Join NetQwix Platform!</h1>
            <p>Please <a href="https://dev.netqwix.com"> click here</a> to join NetQwix.</p>
          </div>`
        );

        return ResponseBuilder.data({}, "");
      }
    } catch (err) {
      return ResponseBuilder.error(err, l10n.t("ERR_INTERNAL_SERVER"));
    }
  }

  public async getScheduledMeetings(req) {
    const { authUser, query } = req;
    const { status } = query;
    try {
      let matchCondition = {};
      let statusCondition = {};
      const timeZone = authUser?.extraInfo?.working_hours?.time_zone;
      const extractTimeOffset = timeZone
        ? Utils.extractTimeOffset(timeZone)
        : utcOffset;
      const currentDateTime = moment().utcOffset(
        extractTimeOffset || utcOffset
      );
      const currentDate = currentDateTime.startOf("day").toDate(); // Start of today

      const currentDateObject = new Date();

      const currentTimeString = currentDateObject.toTimeString().slice(0, 5); // HH:MM format

      if (status) {
        if (status === BOOKED_SESSIONS_STATUS.upcoming) {
          statusCondition = {
            $expr: {
              $and: [
                // Check if booked_date is today or in the future
                {
                  $gte: [{ $dateToString: { format: "%Y-%m-%d", date: "$booked_date" } },
                  { $dateToString: { format: "%Y-%m-%d", date: currentDateObject } }]
                },
                // For today's date or future dates, check the session_end_time
                { $gt: ["$session_end_time", currentTimeString] },
                {
                  $in: ["$status", [BOOKED_SESSIONS_STATUS.BOOKED, BOOKED_SESSIONS_STATUS.confirm]]
                }
              ]
            }
          };

        } else if (status === BOOKED_SESSIONS_STATUS.cancel) {
          statusCondition = {
            $or: [
              { status: BOOKED_SESSIONS_STATUS.cancel },
              {
                $and: [
                  { booked_date: { $lt: currentDate } },
                  { status: BOOKED_SESSIONS_STATUS.BOOKED },
                ],
              },
            ],
          };
        } else if (status === BOOKED_SESSIONS_STATUS.completed) {
          statusCondition = {
            $expr: {
              $and: [
                // Check if booked_date is today or in the past
                {
                  $lte: [{ $dateToString: { format: "%Y-%m-%d", date: "$booked_date" } },
                  { $dateToString: { format: "%Y-%m-%d", date: currentDateObject } }]
                },
                // For today's date or past dates, check if the session_end_time has passed
                { $lte: ["$session_end_time", currentTimeString] },
                {
                  $in: ["$status", [BOOKED_SESSIONS_STATUS.BOOKED, BOOKED_SESSIONS_STATUS.confirm]]
                }
              ]
            }
          };

        } else {
          statusCondition["status"] = status;
        }
      }
      if (authUser && authUser.account_type === AccountType.TRAINER) {
        matchCondition = {
          trainer_id: new Types.ObjectId(authUser._id),
        };
      } else {
        matchCondition = {
          trainee_id: new Types.ObjectId(authUser._id),
        };
      }
      
      const result = await booked_session
        .aggregate([
          {
            $match: { ...matchCondition, ...statusCondition },
          },
          {
            $lookup: {
              from: "users",
              localField: "trainer_id",
              foreignField: "_id",
              as: "trainer_info",
              pipeline: [
                {
                  $project: Constant.pipelineUser,
                },
              ],
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "trainee_id",
              foreignField: "_id",
              as: "trainee_info",
              pipeline: [
                {
                  $project: Constant.pipelineUser,
                },
              ],
            },
          },
          {
            $lookup: {
              from: "clips",
              localField: "trainee_clip",
              foreignField: "_id",
              as: "trainee_clips",
            },
          },
          {
            $unwind: {
              path: "$trainer_info",
            },
          },
          {
            $unwind: {
              path: "$trainee_info",
            },
          },
          {
            $project: {
              _id: 1,
              status: 1,
              booked_date: 1,
              session_start_time: 1,
              session_end_time: 1,
              session_link: 1,
              createdAt: 1,
              updatedAt: 1,
              ratings: { $ifNull: ["$ratings", null] },
              trainer_info: 1,
              trainee_info: 1,
              trainee_clips: 1,
              time_zone: 1,
              start_time: 1,
              end_time: 1,
              report: 1,
            },
          },
          {
            $sort: {
              createdAt: -1,
            },
          },
        ])
        .exec();
      return ResponseBuilder.data({ data: result }, l10n.t("MEETING_FETCHED"));
    } catch (err) {
      return ResponseBuilder.error(err, l10n.t("ERR_INTERNAL_SERVER"));
    }
  }

  public async updateRatings(userInfo, payload: updateRatings, bookingInfo) {
    try {
      if (!bookingInfo.ratings) bookingInfo.ratings = {};
      const updatePayload =
        userInfo.account_type === AccountType.TRAINEE
          ? { ...bookingInfo.ratings, trainee: payload }
          : { ...bookingInfo.ratings, trainer: payload };
      if (
        updatePayload &&
        updatePayload.trainer &&
        updatePayload.trainee &&
        updatePayload.trainer.sessionRating &&
        updatePayload.trainee.sessionRating
      ) {
        bookingInfo.status = BOOKED_SESSIONS_STATUS.completed;
      }
      bookingInfo["ratings"] = updatePayload;
      await booked_session.findOneAndUpdate(
        { _id: bookingInfo["_id"] },
        { $set: { ...bookingInfo } },
        { new: true }
      );
      return ResponseBuilder.data({ bookingInfo }, l10n.t("RATING_SUBMITTED"));
    } catch (err) {
      return ResponseBuilder.error(err, l10n.t("ERR_INTERNAL_SERVER"));
    }
  }

  public async addTraineeClip(payload: any, bookedSessionId: string) {
    try {
      const bookedSessionDetail = await booked_session.findById(
        bookedSessionId
      );
      if (bookedSessionDetail && bookedSessionDetail._id) {
        const result = await booked_session.findByIdAndUpdate(
          { _id: bookedSessionId },
          { trainee_clip: payload.trainee_clip },
          { new: true }
        );
        return ResponseBuilder.data(
          { result },
          l10n.t("SESSION_STATUS_UPDATED")
        );
      } else {
        return ResponseBuilder.badRequest(l10n.t("INVALID_ID"));
      }
    } catch (err) {
      console.log(err);
      return ResponseBuilder.error(err, l10n.t("ERR_INTERNAL_SERVER"));
    }
  }

  public async getAllTrainee(userInfo: any) {
    try {
      const { _id } = userInfo;
      var trainee = await user.find({ account_type: AccountType.TRAINEE });
      if (!trainee) {
        return ResponseBuilder.data(trainee, "Trainee not found");
      }
      return ResponseBuilder.data(trainee, l10n.t("GET_ALL_TRAINEES"));
    } catch (err) {
      return ResponseBuilder.error(err, l10n.t("ERR_INTERNAL_SERVER"));
    }
  }

  public async getAllTrainers(userInfo: any) {
    try {
      const { _id } = userInfo;
      var trainer = await user.find({ account_type: AccountType.TRAINER });
      if (!trainer) {
        return ResponseBuilder.data(trainer, "Trainer not found");
      }
      return ResponseBuilder.data(trainer, l10n.t("GET_ALL_TRAINERS"));
    } catch (err) {
      return ResponseBuilder.error(err, l10n.t("ERR_INTERNAL_SERVER"));
    }
  }

  public async updateTrainerCommossion(body) {
    try {
      const { trainer_id, commission } = body;
      if (!trainer_id) {
        return ResponseBuilder.badRequest("Trainer id is required");
      }

      // if (!commission) {
      //   return ResponseBuilder.badRequest("commission id is required");
      // }

      var trainer = await user.findByIdAndUpdate(trainer_id, { commission });

      if (!trainer) {
        return ResponseBuilder.data(trainer, "Trainer not found");
      }
      return ResponseBuilder.data(trainer, "Commission updated successfully");
    } catch (err) {
      return ResponseBuilder.error(err, l10n.t("ERR_INTERNAL_SERVER"));
    }
  }

  public async updateIsRegisteredWithStript(userInfo: any, body: any) {
    try {
      const { _id } = userInfo;
      const { stripe_account_id } = body;

      if (!stripe_account_id) {
        return ResponseBuilder.badRequest("Stripe Account id can't be empty");
      }

      const updatedUserInfo = await user.findByIdAndUpdate(_id, {
        is_registered_with_stript: true,
        stripe_account_id,
      });
      if (!updatedUserInfo) {
        return ResponseBuilder.data([], "User not found");
      }

      return ResponseBuilder.data([], "User Register with stripe successfully");
    } catch (err) {
      return ResponseBuilder.error(err, l10n.t("ERR_INTERNAL_SERVER"));
    }
  }

  public async updateIsKYCCompleted(userInfo: any) {
    try {
      const { _id } = userInfo;
      const updatedUserInfo = await user.findByIdAndUpdate(_id, {
        is_kyc_completed: true,
      });
      if (!updatedUserInfo) {
        return ResponseBuilder.data([], "User not found");
      }

      return ResponseBuilder.data([], "User KYC completed successfully");
    } catch (err) {
      return ResponseBuilder.error(err, l10n.t("ERR_INTERNAL_SERVER"));
    }
  }

  public async createVerificationSessionStripeKYC(userInfo: any) {
    try {
      const session = await stripe.identity.verificationSessions.create({
        type: "document",
        metadata: {
          user_id: "{{USER_ID}}",
        },
        options: {
          document: {
            require_matching_selfie: true,
          },
        },
      });
      if (!session) {
        return ResponseBuilder.data([], "session not found");
      }

      return ResponseBuilder.data(
        { clientSecret: session.client_secret },
        "Session completed successfully"
      );
    } catch (err) {
      return ResponseBuilder.error(err, l10n.t("ERR_INTERNAL_SERVER"));
    }
  }

  public async getAllBooking() {
    try {
      const pipeline: PipelineStage[] = [
        {
          $lookup: {
            from: "users",
            localField: "trainer_id",
            foreignField: "_id",
            as: "trainer_info",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "trainee_id",
            foreignField: "_id",
            as: "trainee_info",
          },
        },
        {
          $addFields: {
            trainer_info: {
              $arrayElemAt: ["$trainer_info", 0],
            },
            trainee_info: {
              $arrayElemAt: ["$trainee_info", 0],
            },
          },
        },
        {
          $project: {
            _id: 1,
            trainer_id: 1,
            trainee_id: 1,
            status: 1,
            booked_date: 1,
            session_start_time: 1,
            session_end_time: 1,
            start_time: 1,
            end_time: 1,
            time_zone: 1,
            payment_intent_id: 1,
            trainee_clip: 1,
            report: 1,
            session_link: 1,
            updatedAt: 1,
            ratings: 1,
            refund_status: 1,
            "trainer_info.fullName": "$trainer_info.fullname",
            "trainer_info.commission": "$trainer_info.commission",
            "trainer_info.email": "$trainer_info.email",
            "trainer_info.category": "$trainer_info.category",
            "trainer_info.profilePicture": "$trainer_info.profile_picture",
            "trainer_info.stripe_account_id": "$trainer_info.stripe_account_id",
            "trainer_info.is_kyc_completed": "$trainer_info.is_kyc_completed",
            "trainee_info.fullName": "$trainee_info.fullname",
            "trainee_info.email": "$trainee_info.email",
            "trainee_info.profilePicture": "$trainee_info.profile_picture",
          },
        },
        {
          $sort: {
            updatedAt: -1, // Sort by updatedAt field in descending order
          },
        },
      ];
      const booking_list = await booked_session.aggregate(pipeline);

      if (!booking_list) {
        return ResponseBuilder.data([], "booking_list not found");
      }

      return ResponseBuilder.data(booking_list, "Booking Fetched successfully");
    } catch (err) {
      return ResponseBuilder.error(err, l10n.t("ERR_INTERNAL_SERVER"));
    }
  }

  public async getAllBookingById(
    trainer_id: any,
    account_type: any,
    page: any,
    limit: any
  ) {
    try {
      const matchObj: any = {};

      if (account_type === "Trainer") {
        matchObj.trainer_id = trainer_id;
      } else {
        matchObj.trainee_id = trainer_id;
      }

      const pipeline: PipelineStage[] = [
        {
          $match: matchObj,
        },
        {
          $lookup: {
            from: "users",
            localField: "trainer_id",
            foreignField: "_id",
            as: "trainer_info",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "trainee_id",
            foreignField: "_id",
            as: "trainee_info",
          },
        },
        {
          $addFields: {
            trainer_info: {
              $arrayElemAt: ["$trainer_info", 0],
            },
            trainee_info: {
              $arrayElemAt: ["$trainee_info", 0],
            },
          },
        },
        {
          $project: {
            _id: 1,
            trainer_id: 1,
            trainee_id: 1,
            status: 1,
            booked_date: 1,
            session_start_time: 1,
            session_end_time: 1,
            start_time: 1,
            end_time: 1,
            time_zone: 1,
            payment_intent_id: 1,
            trainee_clip: 1,
            report: 1,
            session_link: 1,
            updatedAt: 1,
            ratings: 1,
            refund_status: 1,
            amount: 1,
            application_fee_amount: 1,
            "trainer_info.fullName": "$trainer_info.fullname",
            "trainer_info.commission": "$trainer_info.commission",
            "trainer_info.email": "$trainer_info.email",
            "trainer_info.category": "$trainer_info.category",
            "trainer_info.profilePicture": "$trainer_info.profile_picture",
            "trainer_info.stripe_account_id": "$trainer_info.stripe_account_id",
            "trainer_info.is_kyc_completed": "$trainer_info.is_kyc_completed",
            "trainee_info.fullName": "$trainee_info.fullname",
            "trainee_info.email": "$trainee_info.email",
            "trainee_info.profilePicture": "$trainee_info.profile_picture",
          },
        },
        {
          $sort: {
            updatedAt: -1, // Sort by updatedAt field in descending order
          },
        },
        {
          $skip: (Number(page) - 1) * Number(limit), // Skip records based on page and limit
        },
        {
          $limit: Number(limit), // Limit the number of records per page
        },
      ];
      const booking_list = await booked_session.aggregate(pipeline);

      if (!booking_list) {
        return ResponseBuilder.data([], "booking_list not found");
      }

      return ResponseBuilder.data(booking_list, "Booking Fetched successfully");
    } catch (err) {
      return ResponseBuilder.error(err, l10n.t("ERR_INTERNAL_SERVER"));
    }
  }

  public async createStripeAccountVarificationUrl(body) {
    try {
      const { stripe_account_id } = body;

      const path = "dashboard";
      let linkUrl = process.env.CLIENT_URL + "/" + path;
      const generated_url = await stripe.accountLinks
        .create({
          type: "account_onboarding",
          account: stripe_account_id,
          refresh_url: `${linkUrl}?refresh=true`,
          return_url: `${linkUrl}?`,
          collect: "currently_due",
        })
        .then((link) => link.url);

      if (!generated_url) {
        return ResponseBuilder.badRequest(
          "Stripe KYC URL not generated please try again!"
        );
      }

      return ResponseBuilder.data(
        { url: generated_url },
        "KYC link generated successfully"
      );
    } catch (err) {
      return ResponseBuilder.error(err, l10n.t("ERR_INTERNAL_SERVER"));
    }
  }

  public async checkIsKycCompleted(userInfo: any, stripe_account_id: string) {
    try {
      if (!stripe_account_id) {
        return ResponseBuilder.data([], "Stripe Id not found");
      }
      const result = await stripeHelperController.getAccountByUserId(
        stripe_account_id
      );
      if (
        result?.external_accounts?.data?.length > 0 &&
        result?.charges_enabled == true &&
        result?.details_submitted == true
      ) {
        const { _id } = userInfo;
        const updatedUserInfo = await user.findByIdAndUpdate(_id, {
          is_kyc_completed: true,
        });
        if (!updatedUserInfo) {
          return ResponseBuilder.data([], "User not found");
        }
        return ResponseBuilder.data([], "User KYC completed successfully");
      } else {
        return ResponseBuilder.data([], "User KYC not completed successfully");
      }
    } catch (err) {
      return ResponseBuilder.error(err, l10n.t("ERR_INTERNAL_SERVER"));
    }
  }

  public async updateRefundStatus(body) {
    try {
      const { booking_id, refund_status } = body;
      if (!booking_id) {
        return ResponseBuilder.badRequest("Booking id is required");
      }

      if (!refund_status) {
        return ResponseBuilder.badRequest("refund_status id is required");
      }

      var booking = await booked_session.findByIdAndUpdate(booking_id, {
        refund_status,
      });

      if (!booking) {
        return ResponseBuilder.badRequest("Booking not found");
      }

      return ResponseBuilder.data(
        {
          booking,
        },
        "refund_status updated successfully"
      );
    } catch (err) {
      return ResponseBuilder.error(err, l10n.t("ERR_INTERNAL_SERVER"));
    }
  }

  public async captureWriteUs(id, body) {
    try {
      const { reason, description } = body;

      if (!description) {
        return ResponseBuilder.badRequest("Description id is required");
      }

      const writeUs = new write_us({ ...body, user_id: id });
      await writeUs.save();

      return ResponseBuilder.data(writeUs, "Complain has been captured");
    } catch (err) {
      return ResponseBuilder.error(err, l10n.t("ERR_INTERNAL_SERVER"));
    }
  }

  public async createRaiseConcern(id, body) {
    try {
      const { reason, description } = body;
      if (!reason) {
        return ResponseBuilder.badRequest("Reason is required");
      }

      if (!description) {
        return ResponseBuilder.badRequest("Description id is required");
      }

      const raiseConcern = new raise_concern({ ...body, user_id: id });
      await raiseConcern.save();

      return ResponseBuilder.data(raiseConcern, "Complain has been captured");
    } catch (err) {
      return ResponseBuilder.error(err, l10n.t("ERR_INTERNAL_SERVER"));
    }
  }

  public async getCaptureWriteUs() {
    try {
      const pipeline: PipelineStage[] = [
        {
          $lookup: {
            from: "users",
            localField: "user_id",
            foreignField: "_id",
            as: "user_info",
          },
        },
        {
          $addFields: {
            user_info: {
              $arrayElemAt: ["$user_info", 0],
            },
          },
        },
        {
          $project: {
            _id: 1,
            user_id: 1,
            ticket_status: 1,
            name: 1,
            email: 1,
            phone_number: 1,
            subject: 1,
            description: 1,
            updatedAt: 1,
            "user_info.fullName": "$user_info.fullname",
            "user_info.commission": "$user_info.commission",
            "user_info.email": "$user_info.email",
            "user_info.category": "$user_info.category",
            "user_info.profilePicture": "$user_info.profile_picture",
            "user_info.stripe_account_id": "$user_info.stripe_account_id",
            "user_info.is_kyc_completed": "$user_info.is_kyc_completed",
            "user_info.account_type": "$user_info.account_type",
          },
        },
        {
          $sort: {
            updatedAt: -1,
          },
        },
      ];
      const booking_list = await write_us.aggregate(pipeline);

      if (!booking_list) {
        return ResponseBuilder.data([], "booking_list not found");
      }

      return ResponseBuilder.data(booking_list, "Booking Fetched successfully");
    } catch (err) {
      return ResponseBuilder.error(err, l10n.t("ERR_INTERNAL_SERVER"));
    }
  }

  public async getRaiseConcern() {
    try {
      const pipeline: PipelineStage[] = [
        {
          $lookup: {
            from: "users",
            localField: "user_id",
            foreignField: "_id",
            as: "user_info",
          },
        },
        {
          $lookup: {
            from: "booked_sessions",
            localField: "booking_id",
            foreignField: "_id",
            as: "booking_details",
          },
        },
        {
          $addFields: {
            user_info: {
              $arrayElemAt: ["$user_info", 0],
            },
            booking_details: {
              $arrayElemAt: ["$booking_details", 0],
            },
          },
        },
        {
          $project: {
            _id: 1,
            user_id: 1,
            booking_id: 1,
            ticket_status: 1,
            name: 1,
            email: 1,
            phone_number: 1,
            reason: 1,
            subject: 1,
            description: 1,
            updatedAt: 1,
            is_releted_to_refund: 1,
            "user_info.fullName": "$user_info.fullname",
            "user_info.commission": "$user_info.commission",
            "user_info.email": "$user_info.email",
            "user_info.category": "$user_info.category",
            "user_info.profilePicture": "$user_info.profile_picture",
            "user_info.stripe_account_id": "$user_info.stripe_account_id",
            "user_info.is_kyc_completed": "$user_info.is_kyc_completed",
            "user_info.account_type": "$user_info.account_type",
            booking_details: "$booking_details",
          },
        },
        {
          $sort: {
            updatedAt: -1, // Sort by updatedAt field in descending order
          },
        },
      ];
      const booking_list = await raise_concern.aggregate(pipeline);

      if (!booking_list) {
        return ResponseBuilder.data([], "booking_list not found");
      }

      return ResponseBuilder.data(booking_list, "Booking Fetched successfully");
    } catch (err) {
      return ResponseBuilder.error(err, l10n.t("ERR_INTERNAL_SERVER"));
    }
  }

  public async updateWriteUsTicketStatus(body) {
    try {
      const { id, ticket_status } = body;
      if (!id) {
        return ResponseBuilder.badRequest("ID is required");
      }

      if (!ticket_status) {
        return ResponseBuilder.badRequest("ticket_status id is required");
      }

      var contactUsResponse = await write_us.findByIdAndUpdate(id, {
        ticket_status,
      });

      if (!contactUsResponse) {
        return ResponseBuilder.badRequest("Booking not found");
      }

      return ResponseBuilder.data(
        {
          contactUsResponse,
        },
        "Ticket status updated successfully"
      );
    } catch (err) {
      return ResponseBuilder.error(err, l10n.t("ERR_INTERNAL_SERVER"));
    }
  }

  public async updateRaiseConcernTicketStatus(body) {
    try {
      const { id, ticket_status } = body;
      if (!id) {
        return ResponseBuilder.badRequest("ID is required");
      }

      if (!ticket_status) {
        return ResponseBuilder.badRequest("ticket_status id is required");
      }

      var raiseConcernResponse = await raise_concern.findByIdAndUpdate(id, {
        ticket_status,
      });

      if (!raiseConcernResponse) {
        return ResponseBuilder.badRequest("Booking not found");
      }

      return ResponseBuilder.data(
        {
          raiseConcernResponse,
        },
        "Ticket status updated successfully"
      );
    } catch (err) {
      return ResponseBuilder.error(err, l10n.t("ERR_INTERNAL_SERVER"));
    }
  }

  public async getAllLatestOnlineUser() {
    try {
      const pipeline: PipelineStage[] = [
        {
          $lookup: {
            from: "users",
            localField: "trainer_id",
            foreignField: "_id",
            as: "trainer_info",
          },
        },
        {
          $addFields: {
            trainer_info: {
              $arrayElemAt: ["$trainer_info", 0],
            },
          },
        },
        {
          $project: {
            _id: 1,
            last_activity_time: 1,
            updatedAt: 1,
            "trainer_info._id": "$trainer_info._id",
            "trainer_info.fullName": "$trainer_info.fullname",
            "trainer_info.commission": "$trainer_info.commission",
            "trainer_info.email": "$trainer_info.email",
            "trainer_info.category": "$trainer_info.category",
            "trainer_info.profilePicture": "$trainer_info.profile_picture",
            "trainer_info.stripe_account_id": "$trainer_info.stripe_account_id",
            "trainer_info.is_kyc_completed": "$trainer_info.is_kyc_completed",
            "trainer_info.extraInfo": "$trainer_info.extraInfo",
          },
        },
        {
          $sort: {
            updatedAt: -1, // Sort by updatedAt field in descending order
          },
        },
      ];
      const trainer = await onlineUser.aggregate(pipeline);
      if (!trainer) {
        return ResponseBuilder.data(trainer, "online Trainer not found");
      }
      return ResponseBuilder.data(trainer, l10n.t("GET_ALL_TRAINERS"));
    } catch (err) {
      return ResponseBuilder.error(err, l10n.t("ERR_INTERNAL_SERVER"));
    }
  }
}
