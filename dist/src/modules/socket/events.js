"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Events = void 0;
const logger_1 = require("./../../../logger");
const constance_1 = require("../../config/constance");
class Events {
    constructor() {
        this.logger = logger_1.log.getLogger();
    }
    initSocketEvents(socket, io, nsp) {
        try {
            this.socket = socket;
            this.io = io;
            this.eventListener();
        }
        catch (err) {
            socket.emit(constance_1.EVENTS.ON_ERROR, { msg: JSON.stringify(err) });
        }
    }
    // listening all the events
    eventListener() { }
}
exports.Events = Events;
//# sourceMappingURL=events.js.map