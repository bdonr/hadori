"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendIntroductionEmail = exports.validateStartup = exports.generateBusinessPlan = exports.stripeWebhook = exports.onUserCreated = void 0;
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
var onUserCreated_1 = require("./auth/onUserCreated");
Object.defineProperty(exports, "onUserCreated", { enumerable: true, get: function () { return onUserCreated_1.onUserCreated; } });
var webhook_1 = require("./stripe/webhook");
Object.defineProperty(exports, "stripeWebhook", { enumerable: true, get: function () { return webhook_1.stripeWebhook; } });
var generateBusinessPlan_1 = require("./ai/generateBusinessPlan");
Object.defineProperty(exports, "generateBusinessPlan", { enumerable: true, get: function () { return generateBusinessPlan_1.generateBusinessPlan; } });
var validateStartup_1 = require("./startup/validateStartup");
Object.defineProperty(exports, "validateStartup", { enumerable: true, get: function () { return validateStartup_1.validateStartup; } });
var sendIntroductionEmail_1 = require("./investor/sendIntroductionEmail");
Object.defineProperty(exports, "sendIntroductionEmail", { enumerable: true, get: function () { return sendIntroductionEmail_1.sendIntroductionEmail; } });
//# sourceMappingURL=index.js.map