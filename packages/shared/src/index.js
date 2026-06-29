"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentStepName = exports.Confidence = exports.ChatRole = exports.DocumentStatus = void 0;
var DocumentStatus;
(function (DocumentStatus) {
    DocumentStatus["PENDING"] = "pending";
    DocumentStatus["PROCESSING"] = "processing";
    DocumentStatus["READY"] = "ready";
    DocumentStatus["FAILED"] = "failed";
})(DocumentStatus || (exports.DocumentStatus = DocumentStatus = {}));
var ChatRole;
(function (ChatRole) {
    ChatRole["USER"] = "user";
    ChatRole["ASSISTANT"] = "assistant";
    ChatRole["SYSTEM"] = "system";
})(ChatRole || (exports.ChatRole = ChatRole = {}));
var Confidence;
(function (Confidence) {
    Confidence["HIGH"] = "High";
    Confidence["MEDIUM"] = "Medium";
    Confidence["LOW"] = "Low";
})(Confidence || (exports.Confidence = Confidence = {}));
var AgentStepName;
(function (AgentStepName) {
    AgentStepName["CLASSIFY"] = "classifyQuestion";
    AgentStepName["REWRITE"] = "rewriteQuery";
    AgentStepName["RETRIEVE"] = "retrieveContext";
    AgentStepName["EVALUATE"] = "evaluateContext";
    AgentStepName["RETRY"] = "retryRetrieval";
    AgentStepName["GENERATE"] = "generateAnswer";
    AgentStepName["VERIFY"] = "verifyAnswer";
    AgentStepName["FINAL"] = "finalResponse";
})(AgentStepName || (exports.AgentStepName = AgentStepName = {}));
//# sourceMappingURL=index.js.map