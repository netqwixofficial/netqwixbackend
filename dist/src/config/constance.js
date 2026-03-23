"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Message = exports.MAX_FILE_SIZE_MB = exports.allowedImageExtensions = exports.UPDATE_FIELDS = exports.NetquixImage = exports.amountType = exports.Netquix = exports.AccountType = exports.mongodbDate = exports.SessionReminderMinutes = exports.MONGO_DATE_FORMAT = exports.EVENTS = exports.utcOffset = exports.TimeOffSetRegex = exports.timeRegex = exports.BOOKED_SESSIONS_STATUS = exports.CONSTANCE = void 0;
class CONSTANCE {
}
exports.CONSTANCE = CONSTANCE;
CONSTANCE.SUCCESS = "SUCCESS";
CONSTANCE.FAIL = "FAIL";
CONSTANCE.PENDING = "PENDING";
CONSTANCE.ERROR = "ERROR";
CONSTANCE.CODE = "CODE";
CONSTANCE.BAD_DATA = "BAD_DATA";
CONSTANCE.RES_CODE = {
    success: 200,
    error: {
        internalServerError: 500,
        badRequest: 400,
        unauthorized: 401,
        forbidden: 403,
        notFound: 404,
    },
};
CONSTANCE.supportedCurrencies = ["usd", "eur", "gbp"]; // Add more supported currencies as needed
CONSTANCE.SCHEDULING_SLOTS = {
    trainer_id: "",
    available_slots: [
        {
            day: "monday",
            slots: [],
        },
        {
            day: "tuesday",
            slots: [],
        },
        {
            day: "wednesday",
            slots: [],
        },
        {
            day: "thursday",
            slots: [],
        },
        {
            day: "friday",
            slots: [],
        },
    ],
};
CONSTANCE.TRAINER_SEARCH_KEYS = ["fullname", "category"];
CONSTANCE.TRAINEE_SEARCH_KEYS = [
    "trainer.fullname",
    "trainer.category",
];
CONSTANCE.USERS_SEARCH_KEYS = ["fullname", "category"];
CONSTANCE.INSTANT_MEETING_TIME_FORMAT = "HH:mm";
CONSTANCE.TRAINER_FEE_USD = 10;
var BOOKED_SESSIONS_STATUS;
(function (BOOKED_SESSIONS_STATUS) {
    BOOKED_SESSIONS_STATUS["BOOKED"] = "booked";
    BOOKED_SESSIONS_STATUS["confirm"] = "confirmed";
    BOOKED_SESSIONS_STATUS["cancel"] = "canceled";
    BOOKED_SESSIONS_STATUS["completed"] = "completed";
    BOOKED_SESSIONS_STATUS["upcoming"] = "upcoming";
})(BOOKED_SESSIONS_STATUS || (exports.BOOKED_SESSIONS_STATUS = BOOKED_SESSIONS_STATUS = {}));
exports.timeRegex = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
exports.TimeOffSetRegex = /\+\d+:\d+/; // Regular expression to match the time offset pattern
exports.utcOffset = "+05:30";
class EVENTS {
}
exports.EVENTS = EVENTS;
EVENTS.ON_CONNECT = "connected";
EVENTS.ON_DISCONNECT = "disconnecting";
EVENTS.ON_ERROR = "onSocketError";
EVENTS.JOIN_ROOM = "JOIN_ROOM";
EVENTS.DRAW = "DRAW";
EVENTS.EMIT_DRAWING_CORDS = "EMIT_DRAWING_CORDS";
EVENTS.EMIT_STOP_DRAWING = "EMIT_STOP_DRAWING";
EVENTS.STOP_DRAWING = "STOP_DRAWING";
EVENTS.MOUSE_DOWN = "MOUSE_DOWN";
EVENTS.MOUSE_MOVE = "MOUSE_MOVE";
EVENTS.MOUSE_UP = "MOUSE_UP";
EVENTS.MOUSE_OUT = "MOUSE_OUT";
EVENTS.EMIT_CLEAR_CANVAS = "EMIT_CLEAR_CANVAS";
EVENTS.ON_CLEAR_CANVAS = "ON_CLEAR_CANVAS";
EVENTS.EMIT_UNDO = "EMIT_UNDO";
EVENTS.ON_UNDO = "ON_UNDO";
EVENTS.ON_VIDEO_SELECT = "ON_VIDEO_SELECT";
EVENTS.CALL_END = "CALL_END";
EVENTS.ON_VIDEO_SHOW = "ON_VIDEO_SHOW";
EVENTS.TOGGLE_DRAWING_MODE = "TOGGLE_DRAWING_MODE";
EVENTS.TOGGLE_FULL_SCREEN = "TOGGLE_FULL_SCREEN";
EVENTS.TOGGLE_LOCK_MODE = "TOGGLE_LOCK_MODE";
EVENTS.ON_VIDEO_ZOOM_PAN = "ON_VIDEO_ZOOM_PAN";
EVENTS.ON_VIDEO_PLAY_PAUSE = "ON_VIDEO_PLAY_PAUSE";
EVENTS.ON_VIDEO_TIME = "ON_VIDEO_TIME";
EVENTS.VIDEO_CALL = {
    ON_OFFER: "offer",
    ON_SIGNAL: "signal",
    ON_ANSWER: "answer",
    ON_ICE_CANDIDATE: "ice-candidate",
    ON_STREAM: "stream",
    ON_CONNECT: "connect",
    ON_CLOSE: "close",
    MUTE_ME: "MUTE_ME",
    STOP_FEED: "STOP_FEED",
    ON_CALL_JOIN: "ON_CALL_JOIN",
    ON_BOTH_JOIN: "ON_BOTH_JOIN",
    ON_CALL_LEAVE: "ON_CALL_LEAVE",
};
EVENTS.PUSH_NOTIFICATIONS = {
    ON_SEND: 'send',
    ON_RECEIVE: 'receive'
};
EVENTS.BOOKING = {
    CREATED: 'BOOKING_CREATED',
    STATUS_UPDATED: 'BOOKING_STATUS_UPDATED'
};
EVENTS.INSTANT_LESSON = {
    REQUEST: 'INSTANT_LESSON_REQUEST',
    ACCEPT: 'INSTANT_LESSON_ACCEPT',
    DECLINE: 'INSTANT_LESSON_DECLINE',
    EXPIRE: 'INSTANT_LESSON_EXPIRE',
    CLIPS_SELECTED: 'INSTANT_LESSON_CLIPS_SELECTED',
    TRAINEE_CANCELLED: 'INSTANT_LESSON_TRAINEE_CANCELLED',
};
EVENTS.LESSON_TIMER = {
    WARNING: 'LESSON_TIME_WARNING',
    ENDED: 'LESSON_TIME_ENDED',
    STARTED: 'TIMER_STARTED'
};
exports.MONGO_DATE_FORMAT = {
    YYYY_MM_DD: "YYYY-MM-DD",
};
exports.SessionReminderMinutes = {
    FIFTEEN: 15,
    FIVE: 5
};
exports.mongodbDate = {
    timeStamp: "T00:00:00.000+00:00",
};
exports.AccountType = {
    Trainer: "Trainer",
    Trainee: "Trainee",
};
exports.Netquix = {
    NetQwixEmailLogo: "http://staging.netqwix.com/netqwix/static/media/logo1.208e84f15276975dbb33.png",
    resetPwdUrl: "http://staging.netqwix.com/netqwix/resetpassword",
    stagingAitaHome: "http://staging.netqwix.com/netqwix/home",
    stagingAitaTraineeHome: "http://staging.netqwix.com/netqwix/trainee-schedules",
    stagingAitaTrainerHome: "http://staging.netqwix.com/netqwix/trainer-schedules",
};
exports.amountType = {
    USD: "$",
};
exports.NetquixImage = {
    logo: "https://netquix-ui.vercel.app/assets/images/netquix_logo.png",
};
exports.UPDATE_FIELDS = {
    user: [
        "fullname",
        "mobile_no",
        "profile_picture",
        "category",
        "wallet_amount",
        "extraInfo",
    ],
};
exports.allowedImageExtensions = [".jpg", ".jpeg", ".png"];
exports.MAX_FILE_SIZE_MB = 1024 * 2;
exports.Message = {
    errors: {
        noFileUpload: "No file uploaded.",
        maxFileSizeMB: "File size exceeds the allowed limit (2MB).",
        allowedImageExtensions: "Only image files are allowed.",
    },
    internal: "Internal Server Error",
    notFoundData: "Data not found",
};
//# sourceMappingURL=constance.js.map