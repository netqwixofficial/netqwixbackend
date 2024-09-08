import { Server } from "ws";
import { log } from "../../../logger";
import { Events } from "./events";
import { handleSocketEvents } from "./socket.service";
import { EVENTS } from "../../config/constance";
import { AuthMiddleware } from "../auth/authMiddleware";
import { MemCache } from "../../Utils/memCache";

export class SocketInit {
  private logger = log.getLogger();
  private middleware: AuthMiddleware = new AuthMiddleware();

  public init = (io: Server, app) => {
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
        } else {
          this.logger.info(`After Connection getting ERR -> ${JSON.stringify(userInfo)}`);
          this.logger.info(`token --- , ${JSON.stringify(token)}`);
          socket.emit(EVENTS.ON_ERROR, { msg: JSON.stringify(userInfo.error) });
        }
      }
    })
      .on("connection", async (socket, request) => {
        try {
          socket.emit(EVENTS.ON_CONNECT, {
            msg: "Welcome, Socket Connect Successfully, socket",
          });
          // console.log("=========>user details",socket.user )
          MemCache.setDetail(process.env.SOCKET_CONFIG, socket.user._id, socket.id);
          // mentioning all pending events
          handleSocketEvents(socket);
          // on disconnect
          onDisconnect(socket);
        } catch (err) {
          this.logger.info(`After Connection getting ERR -> ${err}`);
          socket.emit(EVENTS.ON_ERROR, { msg: JSON.stringify(err) });
        }
      });

      const onDisconnect = (socket) => {
        socket.on(EVENTS.ON_DISCONNECT, async () => {
          const me = socket.user._id;
          this.logger.info(`User Disconnected ---> ${socket.user._id}`);
          MemCache.deleteDetail(process.env.SOCKET_CONFIG, me);
        });
      }
  };
}
