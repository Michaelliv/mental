/**
 * API client for fetching mental model data
 *
 * This abstraction allows:
 * - Type-safe API calls
 * - Consistent error handling
 * - Easy mocking for tests
 *
 * Dual-mode support:
 * - mental view: Local server mode (default)
 * - mental publish: Static GitHub Pages mode (detected via window globals)
 */

import type { MentalModel, GitHubConfig, StaticMentalModel, EmbeddedDoc } from '@mentalmodel/shared';

// Extend window type for static mode globals
declare global {
  interface Window {
    __MENTAL_STATIC_MODE__?: boolean;
    __MENTAL_GITHUB__?: GitHubConfig;
    __MENTAL_BASE_PATH__?: string;
  }
}

/**
 * File content response from the file API
 */
export interface FileContent {
  content: string;
  language: string;
}

/**
 * Doc content response from the doc API
 */
export interface DocContent {
  content?: string;
  url?: string;
  isMarkdown?: boolean;
  isExternal: boolean;
  error?: string;
}

/**
 * API client interface for fetching mental model data
 */
export interface ApiClient {
  /** Fetch the current mental model state */
  getModel(): Promise<MentalModel>;
  /** Fetch file contents by path */
  getFile(path: string): Promise<FileContent>;
  /** Fetch doc contents by path */
  getDoc(path: string): Promise<DocContent>;
  /** Check if running in static mode */
  isStaticMode(): boolean;
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
 * Detect language from file extension
 */
function detectLanguage(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() || '';
  const languageMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'tsx',
    js: 'javascript',
    jsx: 'jsx',
    py: 'python',
    go: 'go',
    rs: 'rust',
    java: 'java',
    rb: 'ruby',
    php: 'php',
    c: 'c',
    cpp: 'cpp',
    cs: 'csharp',
    swift: 'swift',
    kt: 'kotlin',
    json: 'json',
    yaml: 'yaml',
    yml: 'yaml',
    md: 'markdown',
    html: 'html',
    css: 'css',
    sql: 'sql',
  };
  return languageMap[ext] || 'plaintext';
}

/**
 * Check if running in static mode (GitHub Pages)
 */
function isStaticMode(): boolean {
  return typeof window !== 'undefined' && window.__MENTAL_STATIC_MODE__ === true;
}

/**
 * Get the base path for static assets
 */
function getBasePath(): string {
  if (typeof window !== 'undefined' && window.__MENTAL_BASE_PATH__) {
    return window.__MENTAL_BASE_PATH__.replace(/\/$/, '');
  }
  return '';
}

// Cache for static model to avoid multiple fetches
let cachedStaticModel: StaticMentalModel | null = null;

/**
 * Create a static API client for GitHub Pages deployment
 * Fetches model from model.json and files from raw.githubusercontent.com
 */
function createStaticApiClient(): ApiClient {
  return {
    isStaticMode: () => true,

    async getModel(): Promise<MentalModel> {
      if (cachedStaticModel) {
        return cachedStaticModel;
      }

      const basePath = getBasePath();
      const res = await fetch(`${basePath}/model.json`);
      if (!res.ok) {
        throw new ApiError(`Failed to fetch model: ${res.statusText}`, res.status);
      }
      cachedStaticModel = await res.json();
      return cachedStaticModel!;
    },

    async getFile(path: string): Promise<FileContent> {
      const github = window.__MENTAL_GITHUB__;
      if (!github) {
        throw new ApiError('GitHub configuration not found for static mode', 500);
      }

      const url = `https://raw.githubusercontent.com/${github.owner}/${github.repo}/${github.branch}/${path}`;
      const res = await fetch(url);

      if (!res.ok) {
        if (res.status === 404) {
          throw new ApiError(`File not found: ${path}`, 404);
        }
        throw new ApiError(`Failed to fetch file from GitHub: ${res.statusText}`, res.status);
      }

      const content = await res.text();
      return {
        content,
        language: detectLanguage(path),
      };
    },

    async getDoc(path: string): Promise<DocContent> {
      // Check if it's an external URL
      if (path.startsWith('http://') || path.startsWith('https://')) {
        return { url: path, isExternal: true };
      }

      // For static mode, check if we have embedded doc content
      if (!cachedStaticModel) {
        await this.getModel();
      }

      const embeddedDoc = cachedStaticModel?.embeddedDocs?.[path];
      if (embeddedDoc) {
        return embeddedDoc;
      }

      // Fallback: try to fetch from GitHub
      try {
        const fileContent = await this.getFile(path);
        const ext = path.split('.').pop()?.toLowerCase() || '';
        return {
          content: fileContent.content,
          isMarkdown: ext === 'md' || ext === 'mdx',
          isExternal: false,
        };
      } catch (error) {
        return {
          error: `Document not found: ${path}`,
          isExternal: false,
        };
      }
    },
  };
}

/**
 * Create the real API client that fetches from the local server
 */
export function createApiClient(baseUrl: string = ''): ApiClient {
  return {
    isStaticMode: () => false,

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

    async getDoc(path: string): Promise<DocContent> {
      const res = await fetch(`${baseUrl}/api/doc?path=${encodeURIComponent(path)}`);
      if (!res.ok) {
        throw new ApiError(`Failed to fetch doc: ${res.statusText}`, res.status);
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
    isStaticMode: () => false,

    async getModel(): Promise<MentalModel> {
      return model;
    },

    async getFile(): Promise<FileContent> {
      return {
        content: '// Mock file content',
        language: 'typescript',
      };
    },

    async getDoc(): Promise<DocContent> {
      return {
        content: '# Mock Document',
        isMarkdown: true,
        isExternal: false,
      };
    },
  };
}

/**
 * Default API client instance - picks implementation based on mode
 * - mental view: window.__MENTAL_STATIC_MODE__ is undefined → uses local server
 * - mental publish: window.__MENTAL_STATIC_MODE__ = true → uses static files + raw GitHub
 */
export const api: ApiClient = isStaticMode() ? createStaticApiClient() : createApiClient();

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

  /**
   * Fetch doc content for SWR
   */
  doc: async (path: string): Promise<DocContent> => {
    return api.getDoc(path);
  },
};

