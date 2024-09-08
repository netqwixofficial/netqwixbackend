import { Router } from "express";
import { AdminController } from "./adminController";
import { AuthorizeMiddleware } from "../../middleware/authorize.middleware";

const route: Router = Router();
const authorizeMiddleware = new AuthorizeMiddleware();
const adminController = new AdminController();

route.use([
  (req, res, next) => {
    req.byPassRoute = [];
    next();
  },
  authorizeMiddleware.authorizeUser,
]);

route.post("/update-global-commission", adminController.updateGlobalCommission);
route.get("/get-global-commission", adminController.getGlobalCommission);

export const adminRoute: Router = route;
