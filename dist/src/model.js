"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.model = void 0;
const class_validator_1 = require("class-validator");
class model {
    static async getModel(model, body, query) {
        // console.log( 'getModel ', body );
        try {
            const m2 = new model(body, query);
            // console.log( 'M2 ', m2 );
            const error = await (0, class_validator_1.validate)(m2);
            if (error.length) {
                throw error;
            }
            return m2;
        }
        catch (err) {
            throw err;
        }
    }
}
exports.model = model;
//# sourceMappingURL=model.js.map