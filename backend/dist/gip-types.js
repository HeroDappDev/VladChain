"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GIPPriority = exports.GIPCategory = exports.GIPStatus = void 0;
// GIP Status Enum
var GIPStatus;
(function (GIPStatus) {
    GIPStatus["DRAFT"] = "draft";
    GIPStatus["ACTIVE"] = "active";
    GIPStatus["DEBATING"] = "debating";
    GIPStatus["VOTING"] = "voting";
    GIPStatus["APPROVED"] = "approved";
    GIPStatus["REJECTED"] = "rejected";
    GIPStatus["IMPLEMENTED"] = "implemented";
    GIPStatus["ARCHIVED"] = "archived";
})(GIPStatus || (exports.GIPStatus = GIPStatus = {}));
// GIP Category Enum
var GIPCategory;
(function (GIPCategory) {
    GIPCategory["TECHNICAL"] = "technical";
    GIPCategory["ECONOMIC"] = "economic";
    GIPCategory["GOVERNANCE"] = "governance";
    GIPCategory["ETHICAL"] = "ethical";
    GIPCategory["PHILOSOPHICAL"] = "philosophical";
    GIPCategory["SECURITY"] = "security";
    GIPCategory["SCALABILITY"] = "scalability";
    GIPCategory["USER_EXPERIENCE"] = "user_experience";
})(GIPCategory || (exports.GIPCategory = GIPCategory = {}));
// GIP Priority Enum
var GIPPriority;
(function (GIPPriority) {
    GIPPriority["LOW"] = "low";
    GIPPriority["MEDIUM"] = "medium";
    GIPPriority["HIGH"] = "high";
    GIPPriority["CRITICAL"] = "critical";
})(GIPPriority || (exports.GIPPriority = GIPPriority = {}));
