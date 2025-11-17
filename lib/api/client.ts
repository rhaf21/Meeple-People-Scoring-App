/**
 * API Client utility with authentication support
 */

interface FetchOptions extends RequestInit {
  requiresAuth?: boolean;
}

class APIClient {
  private baseURL: string;

  constructor(baseURL: string = '') {
    this.baseURL = baseURL;
  }

  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('authToken');
  }

  private getHeaders(requiresAuth: boolean = false): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (requiresAuth) {
      const token = this.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  async request<T>(
    endpoint: string,
    options: FetchOptions = {}
  ): Promise<T> {
    const { requiresAuth = false, ...fetchOptions } = options;

    const url = `${this.baseURL}${endpoint}`;
    const headers = this.getHeaders(requiresAuth);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers: {
          ...headers,
          ...fetchOptions.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          error: response.statusText,
        }));
        throw new Error(error.error || 'API request failed');
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  // GET request
  async get<T>(endpoint: string, requiresAuth: boolean = false): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'GET',
      requiresAuth,
    });
  }

  // POST request
  async post<T>(
    endpoint: string,
    data: any,
    requiresAuth: boolean = false
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      requiresAuth,
    });
  }

  // PUT request
  async put<T>(
    endpoint: string,
    data: any,
    requiresAuth: boolean = false
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      requiresAuth,
    });
  }

  // DELETE request
  async delete<T>(
    endpoint: string,
    requiresAuth: boolean = false
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      requiresAuth,
    });
  }
}

// Export singleton instance
export const apiClient = new APIClient();

// Export convenience functions
export const api = {
  // Auth endpoints
  sendOTP: (email: string, playerId: string) =>
    apiClient.post('/api/auth/send-otp', { email, playerId }),

  verifyOTP: (email: string, playerId: string, otp: string) =>
    apiClient.post('/api/auth/verify-otp', { email, playerId, otp }),

  getMe: () =>
    apiClient.get('/api/auth/me', true),

  // Player endpoints
  getPlayers: () =>
    apiClient.get('/api/players'),

  getPlayer: (id: string) =>
    apiClient.get(`/api/players/${id}`),

  getPlayerProfile: (id: string) =>
    apiClient.get(`/api/players/${id}/profile`, true),

  updatePlayerProfile: (id: string, data: any) =>
    apiClient.put(`/api/players/${id}/profile`, data, true),

  // BGG endpoints
  searchBGG: (query: string) =>
    apiClient.get(`/api/bgg/search?query=${encodeURIComponent(query)}`),

  getBGGGame: (bggId: number) =>
    apiClient.get(`/api/bgg/game/${bggId}`),

  // Game endpoints
  getGames: () =>
    apiClient.get('/api/games'),

  getGame: (id: string) =>
    apiClient.get(`/api/games/${id}`),

  createGame: (data: any) =>
    apiClient.post('/api/games', data, true),

  updateGame: (id: string, data: any) =>
    apiClient.put(`/api/games/${id}`, data, true),

  deleteGame: (id: string) =>
    apiClient.delete(`/api/games/${id}`, true),

  // Player endpoints
  createPlayer: (data: any) =>
    apiClient.post('/api/players', data, true),

  // Session endpoints
  createSession: (data: any) =>
    apiClient.post('/api/sessions', data, true),

  // Game Night endpoints
  getGameNights: (params?: { status?: string; upcoming?: boolean; playerId?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return apiClient.get(`/api/game-nights${query ? `?${query}` : ''}`);
  },

  createGameNight: (data: any) =>
    apiClient.post('/api/game-nights', data, true),

  getGameNight: (id: string) =>
    apiClient.get(`/api/game-nights/${id}`),

  updateGameNight: (id: string, data: any) =>
    apiClient.put(`/api/game-nights/${id}`, data, true),

  deleteGameNight: (id: string) =>
    apiClient.delete(`/api/game-nights/${id}`, true),

  rsvpGameNight: (id: string, rsvpStatus: 'going' | 'maybe' | 'not-going') =>
    apiClient.post(`/api/game-nights/${id}/rsvp`, { rsvpStatus }, true),

  removeRSVP: (id: string) =>
    apiClient.delete(`/api/game-nights/${id}/rsvp`, true),

  syncGameNightRsvps: (id: string) =>
    apiClient.post(`/api/game-nights/${id}/sync-rsvp`, {}, true),
};
