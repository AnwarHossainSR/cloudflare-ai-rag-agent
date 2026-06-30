import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/axios';
import { Confidence, SourceCitation } from './rag';

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
}

export interface PersistedChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  citations: SourceCitation[];
  confidence: Confidence | null;
  createdAt: string;
}

export function useSessions() {
  return useQuery({
    queryKey: ['chat', 'sessions'],
    queryFn: async () => {
      const { data } = await api.get<ChatSession[]>('/chat/sessions');
      return data;
    },
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<ChatSession>('/chat/sessions', {});
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chat', 'sessions'] }),
  });
}

export function useMessages(sessionId?: string) {
  return useQuery({
    queryKey: ['chat', 'messages', sessionId],
    enabled: Boolean(sessionId),
    queryFn: async () => {
      const { data } = await api.get<PersistedChatMessage[]>(
        `/chat/sessions/${sessionId}/messages`,
      );
      return data;
    },
  });
}

export function usePostMessage(sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (content: string) => {
      const { data } = await api.post<PersistedChatMessage>(
        `/chat/sessions/${sessionId}/messages`,
        { content },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'messages', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['chat', 'sessions'] });
    },
  });
}
