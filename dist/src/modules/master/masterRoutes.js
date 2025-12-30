"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.masterRoute = void 0;
const express_1 = require("express");
const masterController_1 = require("./masterController");
const route = (0, express_1.Router)();
const masterC = new masterController_1.masterController();
route.get("/master-data", masterC.getMasterData);
exports.masterRoute = route;
//# sourceMappingURL=masterRoutes.js.map