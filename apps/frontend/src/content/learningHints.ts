import { LearningHintContent } from '../components/LearningHint';

export const learningHints = {
  overview: {
    title: 'Overview connects the whole app',
    body: 'This page reads live document, chat, and agent counts with React Query so you can see what the knowledge base contains.',
    bullets: [
      'Ready documents are available for RAG search.',
      'Indexed chunks are the pieces used for citations.',
      'Agent runs are saved workflows you can inspect later.',
    ],
  },
  documents: {
    title: 'Documents are the knowledge base',
    body: 'Each uploaded file becomes a document row. When processing finishes, it has chunks that RAG can retrieve.',
    bullets: [
      'Pending means upload was accepted.',
      'Processing means the worker is extracting and embedding text.',
      'Ready means chat and agents can retrieve its chunks.',
    ],
  },
  upload: {
    title: 'Upload starts the indexing pipeline',
    body: 'Upload saves the file, queues a BullMQ job, extracts text, chunks it, embeds chunks, and stores vectors in Postgres.',
    bullets: [
      'The UI polls while status is pending or processing.',
      'PDF, txt, and md files are supported.',
      'Failed documents keep an error message for debugging.',
    ],
  },
  chat: {
    title: 'Chat uses grounded RAG',
    body: 'Normal chat embeds your question, searches pgvector for similar chunks, sends those chunks to Cloudflare AI, then saves the answer.',
    bullets: [
      'Citations point back to retrieved chunks.',
      'Confidence is parsed from the model answer.',
      'Agent mode runs a multi-step graph instead of one RAG call.',
    ],
  },
  agents: {
    title: 'Agents wrap RAG in steps',
    body: 'Agent mode runs classify, rewrite, retrieve, evaluate, retry, generate, verify, and final response nodes.',
    bullets: [
      'Each run stores final answer, confidence, and retry count.',
      'Each step stores input, output, order, and latency.',
      'Use details to debug why the agent answered that way.',
    ],
  },
  agentRun: {
    title: 'Run details show the agent trace',
    body: 'This page reads one saved AgentRun and its ordered AgentStep rows so you can inspect the graph execution.',
    bullets: [
      'Timeline shows every node that ran.',
      'Retries show when context or verification was weak.',
      'Final output is what the API returned to chat.',
    ],
  },
  sessions: {
    title: 'Sessions are saved conversations',
    body: 'A session groups user and assistant messages. Reopening it loads persisted chat history from the backend.',
    bullets: [
      'Normal RAG messages are saved to sessions.',
      'Assistant messages include citations and confidence.',
      'Agent mode creates agent runs; it is not saved as normal chat history.',
    ],
  },
  settings: {
    title: 'Settings explains runtime config',
    body: 'These cards show how the app is configured. Model names and secrets stay on the backend, not in the browser.',
    bullets: [
      'Cloudflare credentials never reach frontend code.',
      'Retrieval uses pgvector chunks from ready documents.',
      'Theme choice is local UI state.',
    ],
  },
  login: {
    title: 'Auth creates a protected workspace',
    body: 'Register hashes your password and creates a user. Login verifies the password and stores a JWT for protected API calls.',
    bullets: [
      'Backend guards validate the JWT on protected routes.',
      'Frontend stores the token and redirects into the app.',
      'Passwords are never stored as plain text.',
    ],
  },
} satisfies Record<string, LearningHintContent>;

