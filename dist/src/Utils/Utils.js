"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIceServerCredentials = exports.isOverlap = exports.CovertTimeAccordingToTimeZone = exports.getTimeZoneOffset = exports.Utils = void 0;
const moment = require("moment");
const constance_1 = require("../config/constance");
const luxon_1 = require("luxon");
const axios_1 = require("axios");
class Utils {
    static isFutureOrToday(dateString) {
        const inputDate = moment(dateString);
        const today = moment();
        return inputDate.isSameOrAfter(today, "day");
    }
    static generateTimeSlots(availability, availabilityInfo, booked_date, traineeTimeZone) {
        console.log(availability, availabilityInfo);
        const slots = [];
        const trainerTimeZone = availabilityInfo.timeZone;
        const bookedDateTime = luxon_1.DateTime.fromISO(booked_date, {
            zone: "utc",
        }).startOf("day");
        const endOfDay = bookedDateTime.endOf("day");
        const currentTime = luxon_1.DateTime.fromISO(booked_date, {
            zone: "utc",
        });
        availability.forEach((slot) => {
            const { start, end } = slot;
            console.log("slot", slot);
            // Convert the start and end times to Date objects
            let startTime = createDateTime(booked_date, start);
            let endTime = createDateTime(booked_date, end);
            console.log("booked_date", booked_date);
            console.log("startTime", startTime.toISO()); // Log ISO string for clarity
            console.log("endTime", endTime.toISO());
            // Ensure endTime is after startTime, otherwise return an empty array
            if (endTime <= startTime) {
                console.warn(`Invalid time range: start time is later than end time.`);
                return;
            }
            // Check if trainer's and trainee's time zones are different
            if (trainerTimeZone !== traineeTimeZone) {
                // Convert time slots to the trainee's time zone
                startTime = (0, exports.CovertTimeAccordingToTimeZone)(startTime, {
                    to: traineeTimeZone,
                    from: trainerTimeZone,
                });
                endTime = (0, exports.CovertTimeAccordingToTimeZone)(endTime, {
                    to: traineeTimeZone,
                    from: trainerTimeZone,
                });
                console.log("startTime (Trainee's TZ)", startTime);
                console.log("endTime (Trainee's TZ)", endTime);
            }
            console.log("bookedDateTime", startTime >= bookedDateTime && endTime <= endOfDay);
            // Filter out times outside the booked date range (trainee's local day)
            // Generate time slots with the selected duration
            while (startTime < endTime) {
                let endSlotTime = startTime.plus({
                    minutes: availabilityInfo.selectedDuration,
                });
                // Skip the slot if it has already passed
                console.log("currentTime", currentTime);
                console.log("startTime", startTime);
                if (startTime < currentTime) {
                    console.log(`Skipping expired slot: ${startTime.toISO()}`);
                }
                else if (startTime >= bookedDateTime && endSlotTime <= endOfDay) {
                    const formattedStart = startTime.toFormat("h:mm a");
                    const formattedEnd = endSlotTime.toFormat("h:mm a");
                    slots.push({ start: formattedStart, end: formattedEnd });
                }
                // Move the start time forward by the selected duration
                startTime = endSlotTime;
            }
        });
        return slots;
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
    if (durationHours === 0) {
        return `${durationMinutes} minutes`;
    }
    if (durationHours === 1) {
        return `${durationHours} hour`;
    }
    return `${durationHours} hours`;
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
Utils.getTheDay = (inputString) => {
    // Ensure bookedDate is a Date object
    const bookedDate = new Date(inputString); // Example date string, replace with actual value
    const dayOfWeek = bookedDate.toLocaleDateString("en-US", {
        weekday: "short",
    });
    return dayOfWeek; // Should print the day of the week (e.g., 'Thu')
};
Utils.convertTo24HourFormat = (time) => {
    const [hours, minutes, period] = time.split(/[:\s]/);
    let hour = parseInt(hours, 10);
    const minute = minutes;
    // If the time is PM and not 12 PM, add 12 to the hour (e.g., 1 PM becomes 13)
    if (period === "PM" && hour !== 12) {
        hour += 12;
    }
    // If the time is AM and 12 AM, set hour to 0 (midnight)
    if (period === "AM" && hour === 12) {
        hour = 0;
    }
    // Format the hour and minute into 24-hour time format
    const formattedHour = hour.toString().padStart(2, "0"); // Ensure two digits for the hour
    return `${formattedHour}:${minute}`;
};
function formatTimeAMPM(date) {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let period = hours >= 12 ? "PM" : "AM";
    // Convert to 12-hour format
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? "0" + minutes : minutes;
    return `${hours}:${minutes} ${period}`;
}
function createDateTime(dateTime, time) {
    const date = dateTime.split("T")[0];
    return luxon_1.DateTime.fromFormat(`${date} ${time}`, "yyyy-LL-dd h:mm a", {
        zone: "utc",
    });
}
const getTimeZoneOffset = (timeZone) => {
    const dateTime = luxon_1.DateTime.now().setZone(timeZone); // Get current time in that zone
    return dateTime.offset; // Returns offset in minutes
};
exports.getTimeZoneOffset = getTimeZoneOffset;
const CovertTimeAccordingToTimeZone = (time, timeZone) => {
    // If the time zones are different, calculate the offset difference and adjust time
    const fromOffset = (0, exports.getTimeZoneOffset)(timeZone.from); // Get the offset for the provided time zone
    const toOffset = (0, exports.getTimeZoneOffset)(timeZone.to); // Get the offset for the local time zone
    // Calculate the difference in minutes between the time zones
    const offsetDifference = toOffset - fromOffset;
    console.log("Input Time:", time);
    console.log("Time Zones:", timeZone);
    let date;
    // Check if the time is a Date object
    if (time instanceof Date) {
        // If it's a Date object, use fromJSDate
        date = luxon_1.DateTime.fromJSDate(time, { zone: "utc" });
    }
    else {
        // If it's a string, use fromISO
        date = luxon_1.DateTime.fromISO(time, { zone: "utc" });
    }
    console.log("Original DateTime (UTC):", date.toISO());
    // Apply the offset difference (in minutes) to the DateTime object
    const adjustedDate = date.plus({ minutes: offsetDifference });
    console.log("Adjusted DateTime:", adjustedDate.toISO());
    // Return the adjusted DateTime object
    return adjustedDate;
};
exports.CovertTimeAccordingToTimeZone = CovertTimeAccordingToTimeZone;
function isOverlap(slot1, slot2) {
    const parseSlot1Time = (time) => {
        // Parse 'h:mm a' format (e.g., '2:30 PM')
        const today = luxon_1.DateTime.now().set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
        return luxon_1.DateTime.fromFormat(time, 'h:mm a', { zone: 'utc' }).set({
            year: today.year,
            month: today.month,
            day: today.day,
        });
    };
    console.log("slot1 type", typeof slot1.start, typeof slot1.end);
    console.log("slot2 type", typeof slot2.start, typeof slot2.end);
    const start1 = parseSlot1Time(slot1.start);
    const end1 = parseSlot1Time(slot1.end);
    const start2 = luxon_1.DateTime.fromJSDate(slot2.start, { zone: 'utc' });
    const end2 = luxon_1.DateTime.fromJSDate(slot2.end, { zone: 'utc' });
    console.log("start1", start1, "end1", end1);
    console.log("start2", start2, "end2", end2);
    // Check if the time ranges overlap
    return start1 < end2 && end1 > start2;
}
exports.isOverlap = isOverlap;
async function getIceServerCredentials() {
    const TURN_KEY_ID = process.env.TURN_KEY_ID; // Your TURN key ID
    const TURN_KEY_API_TOKEN = process.env.TURN_KEY_API_TOKEN; // Your API token
    // Fallback STUN servers for maximum compatibility
    const fallbackStunServers = [
        { urls: 'stun:stun.cloudflare.com:3478' },
        { urls: 'stun:stun.cloudflare.com:53' },
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
    ];
    try {
        // Call Cloudflare API to generate TURN credentials
        const response = await axios_1.default.post(`https://rtc.live.cloudflare.com/v1/turn/keys/${TURN_KEY_ID}/credentials/generate`, { ttl: 21600 }, {
            headers: {
                Authorization: `Bearer ${TURN_KEY_API_TOKEN}`,
                'Content-Type': 'application/json',
            },
            timeout: 10000, // 10 second timeout
        });
        // Extract the generated ICE servers from the response
        const { iceServers } = response.data;
        console.log("iceServers", iceServers);
        // Build formatted ICE servers with TURN servers
        const formattedIceServers = [];
        // Add STUN servers first (for NAT traversal)
        if (iceServers.urls && Array.isArray(iceServers.urls)) {
            iceServers.urls.forEach((url, index) => {
                if (index < 2) {
                    // First two are usually STUN servers
                    formattedIceServers.push({ urls: url });
                }
                else if (iceServers.username && iceServers.credential) {
                    // Rest are TURN servers with credentials
                    formattedIceServers.push({
                        urls: url,
                        username: iceServers.username,
                        credential: iceServers.credential,
                    });
                }
            });
        }
        // Add fallback STUN servers if we don't have enough
        if (formattedIceServers.length < 3) {
            formattedIceServers.push(...fallbackStunServers);
        }
        // Return the iceServers in the response
        return formattedIceServers;
    }
    catch (error) {
        console.error('Error generating TURN credentials:', error.response?.data || error.message);
        console.warn('Using fallback STUN servers only');
        // Return fallback STUN servers if TURN server fails
        // This ensures basic connectivity even if TURN is unavailable
        return fallbackStunServers;
    }
}
exports.getIceServerCredentials = getIceServerCredentials;
//# sourceMappingURL=Utils.js.map