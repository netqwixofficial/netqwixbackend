"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSearchRegexQuery = exports.isValidMongoObjectId = void 0;
const mongoose_1 = require("mongoose");
const isValidMongoObjectId = (id) => {
    const objectId = mongoose_1.default.Types.ObjectId;
    if (objectId.isValid(id)) {
        return new objectId(id).toString() === id;
    }
    return false;
};
exports.isValidMongoObjectId = isValidMongoObjectId;
const getSearchRegexQuery = (search, searchKeys) => {
    const regex = { $regex: search, $options: "i" };
    const conditions = searchKeys.map((keys) => {
        return { [keys]: regex };
    });
    return {
        $or: conditions,
    };
};
exports.getSearchRegexQuery = getSearchRegexQuery;
//# sourceMappingURL=mongoose.js.map