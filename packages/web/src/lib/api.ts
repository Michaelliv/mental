/**
 * API client for fetching mental model data
 *
 * This abstraction allows:
 * - Type-safe API calls
 * - Consistent error handling
 * - Easy mocking for tests
 */

import type { MentalModel } from '@mentalmodel/shared';

/**
 * File content response from the file API
 */
export interface FileContent {
  content: string;
  language: string;
}

/**
 * API client interface for fetching mental model data
 */
export interface ApiClient {
  /** Fetch the current mental model state */
  getModel(): Promise<MentalModel>;
  /** Fetch file contents by path */
  getFile(path: string): Promise<FileContent>;
}

/**
 * API error with status code
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Create the real API client that fetches from the server
 */
export function createApiClient(baseUrl: string = ''): ApiClient {
  return {
    async getModel(): Promise<MentalModel> {
      const res = await fetch(`${baseUrl}/api/model`);
      if (!res.ok) {
        throw new ApiError(`Failed to fetch model: ${res.statusText}`, res.status);
      }
      return res.json();
    },

    async getFile(path: string): Promise<FileContent> {
      const res = await fetch(`${baseUrl}/api/file?path=${encodeURIComponent(path)}`);
      if (!res.ok) {
        throw new ApiError(`Failed to fetch file: ${res.statusText}`, res.status);
      }
      return res.json();
    },
  };
}

/**
 * Create a mock API client for testing
 */
export function createMockApiClient(model: MentalModel): ApiClient {
  return {
    async getModel(): Promise<MentalModel> {
      return model;
    },

    async getFile(): Promise<FileContent> {
      return {
        content: '// Mock file content',
        language: 'typescript',
      };
    },
  };
}

/**
 * Default API client instance
 */
export const api = createApiClient();

/**
 * SWR fetcher functions that use the API client
 */
export const fetchers = {
  /**
   * Fetch model for SWR
   */
  model: async (): Promise<MentalModel> => {
    return api.getModel();
  },

  /**
   * Fetch file content for SWR
   */
  file: async (path: string): Promise<FileContent> => {
    return api.getFile(path);
  },
};

