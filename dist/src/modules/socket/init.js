"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketInit = void 0;
const logger_1 = require("../../../logger");
const socket_service_1 = require("./socket.service");
const constance_1 = require("../../config/constance");
const authMiddleware_1 = require("../auth/authMiddleware");
const memCache_1 = require("../../Utils/memCache");
class SocketInit {
    constructor() {
        this.logger = logger_1.log.getLogger();
        this.middleware = new authMiddleware_1.AuthMiddleware();
        this.init = (io, app) => {
            // storing connection in one object for now with their room and socket id.
            // on new connection
            io.use(async (socket, next) => {
                const token = socket.handshake.query.authorization;
                if (token) {
                    const userInfo = await this.middleware.loadSocketUser(token);
                    if (userInfo.user) {
                        this.logger.info(`User Connected --> ${userInfo?.user?._id}`);
                        socket.user = userInfo.user;
                        next();
                    }
                    else {
                        this.logger.info(`After Connection getting ERR -> ${JSON.stringify(userInfo)}`);
                        this.logger.info(`token --- , ${JSON.stringify(token)}`);
                        socket.emit(constance_1.EVENTS.ON_ERROR, { msg: JSON.stringify(userInfo.error) });
                    }
                }
            })
                .on("connection", async (socket, request) => {
                try {
                    socket.emit(constance_1.EVENTS.ON_CONNECT, {
                        msg: "Welcome, Socket Connect Successfully, socket",
                    });
                    // console.log("=========>user details",socket.user )
                    memCache_1.MemCache.setDetail(process.env.SOCKET_CONFIG, socket.user._id, socket.id);
                    // mentioning all pending events
                    (0, socket_service_1.handleSocketEvents)(socket);
                    // on disconnect
                    onDisconnect(socket);
                }
                catch (err) {
                    this.logger.info(`After Connection getting ERR -> ${err}`);
                    socket.emit(constance_1.EVENTS.ON_ERROR, { msg: JSON.stringify(err) });
                }
            });
            const onDisconnect = (socket) => {
                socket.on(constance_1.EVENTS.ON_DISCONNECT, async () => {
                    const me = socket.user._id;
                    this.logger.info(`User Disconnected ---> ${socket.user._id}`);
                    memCache_1.MemCache.deleteDetail(process.env.SOCKET_CONFIG, me);
                });
            };
        };
    }
}
exports.SocketInit = SocketInit;
//# sourceMappingURL=init.js.map