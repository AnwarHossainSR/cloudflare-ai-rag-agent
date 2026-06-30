import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/axios';

export type DocumentStatus = 'pending' | 'processing' | 'ready' | 'failed';

export interface DocumentRecord {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  status: DocumentStatus;
  error: string | null;
  chunkCount: number;
  createdAt?: string;
}

export function useDocuments() {
  return useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const { data } = await api.get<DocumentRecord[]>('/documents');
      return data;
    },
    refetchInterval: (query) =>
      query.state.data?.some((doc) => doc.status === 'pending' || doc.status === 'processing')
        ? 3000
        : false,
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append('file', file);
      const { data } = await api.post<DocumentRecord>('/documents/upload', form);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents'] }),
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/documents/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents'] }),
  });
}

export function useReindexDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<DocumentRecord>(`/documents/${id}/reindex`);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents'] }),
  });
}
