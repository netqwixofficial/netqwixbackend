import { DatabaseInit } from "./Utils/database";
import { Routes } from "./../routes";
import { log } from "./../logger";
import * as cors from "cors";
import * as l10n from "jm-ez-l10n";
import * as express from "express";
const socketio = require("socket.io");

import * as bodyParser from "body-parser";
import * as dotEnv from "dotenv";
import { SocketInit } from "./modules/socket/init";
import { cronjobs } from "./cronjob";

dotEnv.config();
export class App {
  protected app: express.Application;
  private socketEvents = new SocketInit();
  private logger = log.getLogger();
  PORT = process.env.PORT;
  constructor() {
    this.app = express();
    this.app.use("/public/assets", express.static("uploads"));
    const route = new Routes();
    this.app.use(bodyParser.json());
    // this.app.use(cors());
    this.app.use(cors({
      origin: "*",
      methods: ["GET", "POST", "DELETE", "UPDATE", "PUT", "PATCH"],
      credentials: true,
      // allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'device-remember-token', 'Access-Control-Allow-Origin', 'Origin', 'Accept']
    })); 
    this.app.use(bodyParser.json({ limit: '50mb' }));
    this.app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
    this.app.use("/", route.routePath());
    l10n.setTranslationsFile("en", "src/language/translation.en.json");
    this.app.use(l10n.enableL10NExpress);
    const server = this.app.listen(this.PORT, () => {
      this.logger.info(
        `The server is running in port localhost: ${process.env.PORT}`
      );
      // connecting to the Database
      new DatabaseInit();
    });
    // it's a function to execute all cron jobs
    cronjobs();
    const io = socketio(server, {
      maxHttpBufferSize: 1e8,
      cors: {
        origin: "*",
        // or with an array of origins
        // origin: ["https://netquix-ui.vercel.app", "https://hwus.us", "http://localhost:3000"],
        methods: ["*"],
        // credentials: true,
      },
    });
    this.socketEvents.init(io, this.app);

  // Example route to get connected users
  this.app.get('/connected-users', (req, res) => {
  const connectedUsers = this.socketEvents.getConnectedUsers();
  res.json({ connectedUsers });
  });
  }
}
