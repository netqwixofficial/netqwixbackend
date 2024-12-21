"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cronjobs = void 0;
const cron = require("node-cron");
const constance_1 = require("../config/constance");
const booked_sessions_schema_1 = require("../model/booked_sessions.schema");
const Utils_1 = require("../Utils/Utils");
const sendEmail_1 = require("../Utils/sendEmail");
const online_user_schema_1 = require("../model/online_user.schema");
const cronjobs = async () => {
    const job = cron.schedule("* * * * *", () => {
        try {
            meetingConfirmationJob();
            cleanupInactiveUsers();
        }
        catch (err) {
            console.log("err on cron job running", err);
        }
    });
    await job.start();
};
exports.cronjobs = cronjobs;
const meetingConfirmationJob = async () => {
    try {
        const currentHourAndMinute = Utils_1.Utils.getCurrentHourAndMinute();
        const { currentDateTime, currentHour, currentMinute } = currentHourAndMinute;
        const formattedDate = Utils_1.Utils.formatDateTime(currentDateTime);
        console.log(` --- currentHourAndMinute ---`, JSON.stringify(currentHourAndMinute));
        console.log(` --- formattedDate --- `, JSON.stringify(formattedDate));
        const formattedDateTime = Utils_1.Utils.formatDateWithTimeStamp(formattedDate);
        await processBookedSessions(formattedDateTime, currentHour, currentMinute);
    }
    catch (err) {
        console.log("Error on cron job run", err);
    }
};
const processBookedSessions = async (formattedDateTime, currentHour, currentMinute) => {
    const targetTime = Utils_1.Utils.formatTime(currentHour, currentMinute);
    const booked_date = new Date(formattedDateTime);
    const pipeline = [
        {
            $match: {
                status: constance_1.BOOKED_SESSIONS_STATUS.confirm,
                booked_date: booked_date,
                session_start_time: targetTime,
            },
        },
        {
            $lookup: {
                from: "users",
                let: {
                    trainerid: "$trainer_id",
                    traineeid: "$trainee_id",
                },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $or: [
                                    { $eq: ["$_id", "$$trainerid"] },
                                    { $eq: ["$_id", "$$traineeid"] },
                                ],
                            },
                        },
                    },
                ],
                as: "userDetails",
            },
        },
    ];
    const matchedSessions = await booked_sessions_schema_1.default.aggregate(pipeline);
    sendSessionReminderEmails(matchedSessions);
};
const sendSessionReminderEmails = (matchedSessions) => {
    const sessionReminders = matchedSessions.map((session) => {
        const { userDetails } = session;
        const formateSessionStartTime = Utils_1.Utils.convertToAmPm(session.session_start_time);
        const formateSessionEndTime = Utils_1.Utils.convertToAmPm(session.session_end_time);
        const bookedTime = `${formateSessionStartTime} To ${formateSessionEndTime}`;
        const bookedDate = session.booked_date;
        const formateBookedDate = Utils_1.Utils.formattedDateMonthDateYear(bookedDate);
        const trainees = userDetails.filter((user) => user.account_type.includes(constance_1.AccountType.Trainee));
        trainees.forEach((traineeUser) => {
            const { email, fullname } = traineeUser;
            sendEmail_1.SendEmail.sendRawEmail(null, null, [email], `REMINDER: Your NetQwix Training Session Starts in ${constance_1.SessionReminderMinutes.FIFTEEN} minutes at ${bookedTime}`, null, `<div style="font-family: Verdana,Arial,Helvetica,sans-serif;font-size: 18px;line-height: 30px;">
      <i  style='color:#ff0000'>${fullname},</i>
      <br/><br/>
      This is your ${constance_1.SessionReminderMinutes.FIFTEEN} minute reminder that your Training Session will begin in ${constance_1.SessionReminderMinutes.FIFTEEN} minutes.
      ${formateBookedDate} ${bookedTime} EST
      <br/><br/>
      Team NetQwix recommends logging in 2-5 minutes prior to your scheduled session.<br/><br/>
      Thank You For Booking the Slot in NetQwix.
      <br/><br/>
      From,  <br/>
      NetQwix Team. <br/>
      <img src=${constance_1.NetquixImage.logo} style="object-fit: contain; width: 180px;"/>
       </div> `);
        });
    });
    return sessionReminders;
};
async function cleanupInactiveUsers() {
    console.log("=====>JOBS RUN ONLINE USER");
    const inactiveThreshold = 10 * 60 * 1000;
    try {
        await online_user_schema_1.default.deleteMany({
            last_activity_time: { $lt: Date.now() - inactiveThreshold },
        });
    }
    catch (error) {
        console.error('Error cleaning up inactive users:', error);
    }
}
//# sourceMappingURL=index.js.map