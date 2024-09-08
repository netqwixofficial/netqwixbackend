"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Utils = void 0;
const moment = require("moment");
const constance_1 = require("../config/constance");
class Utils {
    static isFutureOrToday(dateString) {
        const inputDate = moment(dateString);
        const today = moment();
        return inputDate.isSameOrAfter(today, "day");
    }
}
exports.Utils = Utils;
Utils.formatDateWithTimeStamp = (date) => {
    return `${date}${constance_1.mongodbDate.timeStamp}`;
};
Utils.formatTime = (hour, minute) => {
    return `${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`;
};
Utils.formatDateTime = (dateTime) => {
    return dateTime.format(constance_1.MONGO_DATE_FORMAT.YYYY_MM_DD);
};
Utils.formattedDateMonthDateYear = (date) => {
    const formattedDate = moment(date).subtract("days").format("MMM Do, YYYY");
    return formattedDate;
};
Utils.timeDurations = (start_time, end_time) => {
    const start = moment(start_time, "h:mm A");
    const end = moment(end_time, "h:mm A");
    const duration = moment.duration(end.diff(start));
    const durationHours = duration.hours();
    const durationMinutes = duration.minutes();
    return `${durationHours} hours and ${durationMinutes} minutes`;
};
Utils.getCurrentHourAndMinute = () => {
    // converting time to IST
    const currentDateTime = moment().utcOffset(constance_1.utcOffset);
    const currentHour = currentDateTime.hours();
    let currentMinute = currentDateTime.minutes();
    currentMinute += constance_1.SessionReminderMinutes.FIFTEEN;
    currentDateTime.add(constance_1.SessionReminderMinutes.FIFTEEN, "minute");
    return {
        currentDateTime,
        currentHour: currentDateTime.hours(),
        currentMinute: currentDateTime.minutes(),
    };
};
Utils.convertToAmPm = (timeString) => {
    const [hours, minutes] = timeString.split(":");
    let formattedHours = parseInt(hours, 10);
    const period = formattedHours >= 12 ? "PM" : "AM";
    if (formattedHours > 12) {
        formattedHours -= 12;
    }
    return `${formattedHours.toString().padStart(2, "0")}:${minutes} ${period}`;
};
Utils.hasTimeConflicts = (start_time, end_time) => {
    const parseTime = (time) => {
        const [hours, minutes, seconds] = time.split(":").map(Number);
        return hours * 60 + minutes + seconds / 60;
    };
    const startTimeInMinutes = parseTime(start_time);
    const endTimeInMinutes = parseTime(end_time);
    if (startTimeInMinutes >= endTimeInMinutes) {
        return true;
    }
    if (endTimeInMinutes <= startTimeInMinutes) {
        return true;
    }
    return false;
};
Utils.extractTimeOffset = (inputString) => {
    const extractedOffset = inputString.match(constance_1.TimeOffSetRegex); // Extract the time offset using regex
    return extractedOffset ? extractedOffset[0] : null; // Return the extracted offset or null if no match found
};
Utils.roundedAmount = (amount = 0) => {
    if (amount % 1 !== 0) {
        return Number(amount.toFixed(2));
    }
    return amount;
};
//# sourceMappingURL=Utils.js.map