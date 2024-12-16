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
        this.connectedUsers = new Map(); // Updated to store userId and complete user data
        this.init = (io, app) => {
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
                    // Store the complete user data
                    this.connectedUsers.set(socket.user._id, { socketId: socket.id, userData: socket.user });
                    memCache_1.MemCache.setDetail(process.env.SOCKET_CONFIG, socket.user._id, socket.id);
                    // Handle socket events
                    (0, socket_service_1.handleSocketEvents)(socket);
                    // Handle disconnect event
                    onDisconnect(socket);
                    // Optional: Log all connected users
                    this.logger.info(`Currently connected users: ${Array.from(this.connectedUsers.keys())}`);
                }
                catch (err) {
                    this.logger.info(`After Connection getting ERR -> ${err}`);
                    socket.emit(constance_1.EVENTS.ON_ERROR, { msg: JSON.stringify(err) });
                }
            });
            const onDisconnect = (socket) => {
                socket.on(constance_1.EVENTS.ON_DISCONNECT, async () => {
                    const userId = socket.user._id;
                    this.logger.info(`User Disconnected ---> ${userId}`);
                    // Remove the user from the connected users map
                    this.connectedUsers.delete(userId);
                    memCache_1.MemCache.deleteDetail(process.env.SOCKET_CONFIG, userId);
                    // Optional: Log remaining connected users
                    this.logger.info(`Currently connected users: ${Array.from(this.connectedUsers.keys())}`);
                });
            };
        };
        // Method to retrieve the list of connected users with complete data
        this.getConnectedUsers = () => {
            return Array.from(this.connectedUsers.values()); // Return an array of user data objects
        };
    }
}
exports.SocketInit = SocketInit;
//# sourceMappingURL=init.js.map