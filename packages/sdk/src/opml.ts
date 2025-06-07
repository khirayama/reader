import { ApiClient } from './client';

export interface ImportOpmlResponse {
  message: string;
  imported: number;
  failed: number;
  errors: string[];
}

export class OpmlService {
  constructor(private client: ApiClient) {}

  async exportOpml(): Promise<Blob> {
    const response = await this.client.request('/opml/export', {
      method: 'GET',
      responseType: 'blob',
    });
    return response.data;
  }

  async importOpml(file: File): Promise<ImportOpmlResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.client.request<ImportOpmlResponse>('/opml/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      data: formData,
    });
    return response.data;
  }
}