import moment = require("moment");
import {
  MONGO_DATE_FORMAT,
  SessionReminderMinutes,
  TimeOffSetRegex,
  mongodbDate,
  utcOffset,
} from "../config/constance";

export class Utils {
  public static formatDateWithTimeStamp = (date: string): string => {
    return `${date}${mongodbDate.timeStamp}`;
  };

  public static formatTime = (hour: number, minute: number): string => {
    return `${hour.toString().padStart(2, "0")}:${minute
      .toString()
      .padStart(2, "0")}`;
  };
  public static formatDateTime = (dateTime: moment.Moment): string => {
    return dateTime.format(MONGO_DATE_FORMAT.YYYY_MM_DD);
  };

  public static formattedDateMonthDateYear = (date) => {
    const formattedDate = moment(date).subtract("days").format("MMM Do, YYYY");
    return formattedDate;
  };

  public static timeDurations = (start_time, end_time) => {
    const start = moment(start_time, "h:mm A");
    const end = moment(end_time, "h:mm A");
    const duration = moment.duration(end.diff(start));
    const durationHours = duration.hours();
    const durationMinutes = duration.minutes();
    return `${durationHours} hours and ${durationMinutes} minutes`;
  };

  public static getCurrentHourAndMinute = () => {
    // converting time to IST
    const currentDateTime = moment().utcOffset(utcOffset);
    const currentHour = currentDateTime.hours();
    let currentMinute = currentDateTime.minutes();
    currentMinute += SessionReminderMinutes.FIFTEEN;
    currentDateTime.add(SessionReminderMinutes.FIFTEEN, "minute");
    return {
      currentDateTime,
      currentHour: currentDateTime.hours(),
      currentMinute: currentDateTime.minutes(),
    };
  };

  public static convertToAmPm = (timeString) => {
    const [hours, minutes] = timeString.split(":");
    let formattedHours = parseInt(hours, 10);

    const period = formattedHours >= 12 ? "PM" : "AM";

    if (formattedHours > 12) {
      formattedHours -= 12;
    }

    return `${formattedHours.toString().padStart(2, "0")}:${minutes} ${period}`;
  };

  public static isFutureOrToday(dateString) {
    const inputDate = moment(dateString);
    const today = moment();
    return inputDate.isSameOrAfter(today, "day");
  }
  static hasTimeConflicts = (start_time, end_time) => {
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

  static extractTimeOffset = (inputString) => {
    const extractedOffset = inputString.match(TimeOffSetRegex); // Extract the time offset using regex
    return extractedOffset ? extractedOffset[0] : null; // Return the extracted offset or null if no match found
  };

  static roundedAmount = (amount = 0) => {
    if (amount % 1 !== 0) {
      return Number(amount.toFixed(2));
    }
    return amount;
  };
}
