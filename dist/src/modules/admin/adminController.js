"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const logger_1 = require("./../../../logger");
const constance_1 = require("./../../config/constance");
const adminService_1 = require("./adminService");
const call_diagnostics_schema_1 = require("../../model/call_diagnostics.schema");
class AdminController {
    constructor() {
        this.adminService = new adminService_1.AdminService();
        this.logger = logger_1.log.getLogger();
        this.updateGlobalCommission = async (req, res) => {
            try {
                if (req["authUser"]) {
                    const result = await this.adminService.updateGlobalCommission(req.body, req["authUser"]);
                    if (result.status !== constance_1.CONSTANCE.FAIL) {
                        res.status(result.code).json(result);
                    }
                    else {
                        res.status(result.code).json({
                            status: result.status,
                            error: result.error,
                            code: constance_1.CONSTANCE.RES_CODE.error.badRequest,
                        });
                    }
                }
            }
            catch (err) {
                return res
                    .status(err.code)
                    .send({ status: constance_1.CONSTANCE.FAIL, error: err.error });
            }
        };
        this.getGlobalCommission = async (req, res) => {
            try {
                const result = await this.adminService.getGlobalCommission();
                if (result.status !== constance_1.CONSTANCE.FAIL) {
                    res.status(result.code).json(result);
                }
                else {
                    res.status(result.code).json({
                        status: result.status,
                        error: result.error,
                        code: constance_1.CONSTANCE.RES_CODE.error.badRequest,
                    });
                }
            }
            catch (err) {
                return res
                    .status(err.code)
                    .send({ status: constance_1.CONSTANCE.FAIL, error: err.error });
            }
        };
        // Get call diagnostics for a specific session or user
        this.getCallDiagnostics = async (req, res) => {
            try {
                const { sessionId, userId, eventType, limit = 100, skip = 0 } = req.query;
                const query = {};
                if (sessionId)
                    query.sessionId = sessionId;
                if (userId)
                    query.userId = userId;
                if (eventType)
                    query.eventType = eventType;
                const diagnostics = await call_diagnostics_schema_1.default.find(query)
                    .populate("sessionId", "start_time end_time session_start_time session_end_time")
                    .populate("userId", "fullname email")
                    .sort({ createdAt: -1 })
                    .limit(Number(limit))
                    .skip(Number(skip));
                const total = await call_diagnostics_schema_1.default.countDocuments(query);
                return res.status(200).json({
                    status: constance_1.CONSTANCE.SUCCESS,
                    data: {
                        diagnostics,
                        total,
                        limit: Number(limit),
                        skip: Number(skip),
                    },
                    code: constance_1.CONSTANCE.RES_CODE.success,
                });
            }
            catch (err) {
                this.logger.error("Error fetching call diagnostics:", err);
                return res.status(500).json({
                    status: constance_1.CONSTANCE.FAIL,
                    error: "Failed to fetch call diagnostics",
                    code: constance_1.CONSTANCE.RES_CODE.error.internalServerError,
                });
            }
        };
        // Get call quality summary for a session
        this.getCallQualitySummary = async (req, res) => {
            try {
                const { sessionId } = req.params;
                if (!sessionId) {
                    return res.status(400).json({
                        status: constance_1.CONSTANCE.FAIL,
                        error: "sessionId is required",
                        code: constance_1.CONSTANCE.RES_CODE.error.badRequest,
                    });
                }
                const qualityStats = await call_diagnostics_schema_1.default.find({
                    sessionId,
                    eventType: "CALL_QUALITY_STATS",
                })
                    .select("qualityStats createdAt userId accountType role")
                    .sort({ createdAt: -1 });
                if (qualityStats.length === 0) {
                    return res.status(200).json({
                        status: constance_1.CONSTANCE.SUCCESS,
                        data: {
                            sessionId,
                            message: "No quality stats found for this session",
                            stats: [],
                        },
                        code: constance_1.CONSTANCE.RES_CODE.success,
                    });
                }
                // Calculate averages
                const avgOverall = qualityStats.reduce((sum, s) => sum + (s.qualityStats?.overallScore || 0), 0) / qualityStats.length;
                const avgAudio = qualityStats.reduce((sum, s) => sum + (s.qualityStats?.audioScore || 0), 0) / qualityStats.length;
                const avgVideo = qualityStats.reduce((sum, s) => sum + (s.qualityStats?.videoScore || 0), 0) / qualityStats.length;
                const avgRtt = qualityStats.reduce((sum, s) => sum + (s.qualityStats?.rtt || 0), 0) / qualityStats.length;
                const usingRelayCount = qualityStats.filter(s => s.qualityStats?.usingRelay).length;
                return res.status(200).json({
                    status: constance_1.CONSTANCE.SUCCESS,
                    data: {
                        sessionId,
                        summary: {
                            totalSamples: qualityStats.length,
                            averageOverallScore: Math.round(avgOverall * 100) / 100,
                            averageAudioScore: Math.round(avgAudio * 100) / 100,
                            averageVideoScore: Math.round(avgVideo * 100) / 100,
                            averageRtt: Math.round(avgRtt * 100) / 100,
                            relayUsagePercentage: Math.round((usingRelayCount / qualityStats.length) * 100),
                        },
                        stats: qualityStats,
                    },
                    code: constance_1.CONSTANCE.RES_CODE.success,
                });
            }
            catch (err) {
                this.logger.error("Error fetching call quality summary:", err);
                return res.status(500).json({
                    status: constance_1.CONSTANCE.FAIL,
                    error: "Failed to fetch call quality summary",
                    code: constance_1.CONSTANCE.RES_CODE.error.internalServerError,
                });
            }
        };
    }
}
exports.AdminController = AdminController;
//# sourceMappingURL=adminController.js.map