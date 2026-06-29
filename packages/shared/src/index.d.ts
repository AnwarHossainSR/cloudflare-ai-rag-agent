export declare enum DocumentStatus {
    PENDING = "pending",
    PROCESSING = "processing",
    READY = "ready",
    FAILED = "failed"
}
export declare enum ChatRole {
    USER = "user",
    ASSISTANT = "assistant",
    SYSTEM = "system"
}
export declare enum Confidence {
    HIGH = "High",
    MEDIUM = "Medium",
    LOW = "Low"
}
export declare enum AgentStepName {
    CLASSIFY = "classifyQuestion",
    REWRITE = "rewriteQuery",
    RETRIEVE = "retrieveContext",
    EVALUATE = "evaluateContext",
    RETRY = "retryRetrieval",
    GENERATE = "generateAnswer",
    VERIFY = "verifyAnswer",
    FINAL = "finalResponse"
}
export interface SourceCitation {
    documentId: string;
    documentName: string;
    chunkIndex: number;
    score: number;
    snippet: string;
}
export interface RagQueryResponse {
    answer: string;
    citations: SourceCitation[];
    confidence: Confidence;
}
