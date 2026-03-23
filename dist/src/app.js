"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = void 0;
const database_1 = require("./Utils/database");
const routes_1 = require("./../routes");
const logger_1 = require("./../logger");
const cors = require("cors");
const l10n = require("jm-ez-l10n");
const express = require("express");
const socketio = require("socket.io");
const bodyParser = require("body-parser");
const dotEnv = require("dotenv");
const init_1 = require("./modules/socket/init");
const cronjob_1 = require("./cronjob");
dotEnv.config();
class App {
    constructor() {
        this.socketEvents = new init_1.SocketInit();
        this.logger = logger_1.log.getLogger();
        this.PORT = process.env.PORT;
        this.app = express();
        this.app.use("/public/assets", express.static("uploads"));
        const route = new routes_1.Routes();
        this.app.use(bodyParser.json());
        // Global CORS configuration for REST API
        this.app.use(cors({
            origin: "*",
            methods: ["GET", "POST", "DELETE", "PUT", "PATCH", "OPTIONS"],
            allowedHeaders: [
                "Content-Type",
                "Authorization",
                "X-Requested-With",
                "Origin",
                "Accept",
                // Frontend currently (incorrectly) sends this as a request header.
                // Including it here allows preflight to succeed without breaking clients.
                "Access-Control-Allow-Origin",
            ],
        }));
        this.app.options("*", cors());
        this.app.use(bodyParser.json({ limit: '50mb' }));
        this.app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
        this.app.use("/", route.routePath());
        l10n.setTranslationsFile("en", "src/language/translation.en.json");
        this.app.use(l10n.enableL10NExpress);
        const server = this.app.listen(this.PORT, () => {
            this.logger.info(`The server is running in port localhost: ${process.env.PORT}`);
            // connecting to the Database
            new database_1.DatabaseInit();
        });
        // it's a function to execute all cron jobs
        (0, cronjob_1.cronjobs)();
        const io = socketio(server, {
            maxHttpBufferSize: 1e8,
            transports: ['websocket', 'polling'],
            allowEIO3: true,
            cors: {
                origin: "*",
                // or with an array of origins
                // origin: ["https://netquix-ui.vercel.app", "https://hwus.us", "http://localhost:3000"],
                methods: ["*"],
                credentials: true, // Enable credentials for WebSocket
            },
            pingTimeout: 60000,
            pingInterval: 25000, // Increase ping interval
        });
        this.socketEvents.init(io, this.app);
        // Example route to get connected users
        this.app.get('/connected-users', (req, res) => {
            const connectedUsers = this.socketEvents.getConnectedUsers();
            res.json({ connectedUsers });
        });
    }
}
exports.App = App;
//# sourceMappingURL=app.js.map