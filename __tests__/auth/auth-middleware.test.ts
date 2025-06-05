import { NextApiRequest, NextApiResponse } from 'next';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';
import { getAuthenticatedUserId, withAuth, getAuthenticatedUser } from '../../lib/auth-middleware';

// Supabaseのモック
vi.mock('../../lib/supabase', () => {
  const authMock = {
    getUser: vi.fn(),
  };

  return {
    supabase: { auth: authMock },
  };
});

// Prismaのモック
vi.mock('../../lib/prisma', () => {
  return {
    prisma: {
      user: {
        findUnique: vi.fn(),
      },
    },
  };
});

describe('Auth Middleware', () => {
  let mockReq: Partial<NextApiRequest>;
  let mockRes: Partial<NextApiResponse>;
  let getUserMock: Mock;
  let findUniqueMock: Mock;

  beforeEach(() => {
    // リクエスト/レスポンスのモックを設定
    mockReq = {
      headers: {},
    };
    
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    // Supabaseのユーザー取得メソッドをリセット
    const { supabase } = require('../../lib/supabase');
    getUserMock = supabase.auth.getUser;
    getUserMock.mockReset();

    // Prismaのユーザー検索メソッドをリセット
    const { prisma } = require('../../lib/prisma');
    findUniqueMock = prisma.user.findUnique;
    findUniqueMock.mockReset();
  });

  describe('getAuthenticatedUserId', () => {
    it('returns null when no Authorization header is present', async () => {
      const userId = await getAuthenticatedUserId(mockReq as NextApiRequest);
      expect(userId).toBeNull();
    });

    it('returns null when Authorization header is not Bearer format', async () => {
      mockReq.headers = { authorization: 'Basic dXNlcjpwYXNz' };
      const userId = await getAuthenticatedUserId(mockReq as NextApiRequest);
      expect(userId).toBeNull();
    });

    it('returns null when token validation fails', async () => {
      mockReq.headers = { authorization: 'Bearer invalid-token' };
      getUserMock.mockResolvedValueOnce({ data: {}, error: new Error('Invalid token') });

      const userId = await getAuthenticatedUserId(mockReq as NextApiRequest);
      expect(userId).toBeNull();
    });

    it('returns user id when token is valid', async () => {
      mockReq.headers = { authorization: 'Bearer valid-token' };
      getUserMock.mockResolvedValueOnce({ 
        data: { user: { id: 'user-123' } }, 
        error: null 
      });

      const userId = await getAuthenticatedUserId(mockReq as NextApiRequest);
      expect(userId).toBe('user-123');
    });
  });

  describe('withAuth', () => {
    it('returns 401 when no user id is found', async () => {
      mockReq.headers = { authorization: 'Bearer invalid-token' };
      getUserMock.mockResolvedValueOnce({ data: {}, error: new Error('Invalid token') });

      const handler = vi.fn();
      const wrappedHandler = withAuth(handler);

      await wrappedHandler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
      expect(handler).not.toHaveBeenCalled();
    });

    it('calls handler with user id when token is valid', async () => {
      mockReq.headers = { authorization: 'Bearer valid-token' };
      getUserMock.mockResolvedValueOnce({ 
        data: { user: { id: 'user-123' } }, 
        error: null 
      });

      const handler = vi.fn();
      const wrappedHandler = withAuth(handler);

      await wrappedHandler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      expect(handler).toHaveBeenCalledWith(
        mockReq,
        mockRes,
        'user-123'
      );
    });
  });

  describe('getAuthenticatedUser', () => {
    it('returns null when no user id is found', async () => {
      mockReq.headers = { authorization: 'Bearer invalid-token' };
      getUserMock.mockResolvedValueOnce({ data: {}, error: new Error('Invalid token') });

      const user = await getAuthenticatedUser(mockReq as NextApiRequest);
      expect(user).toBeNull();
    });

    it('returns null when database user is not found', async () => {
      mockReq.headers = { authorization: 'Bearer valid-token' };
      getUserMock.mockResolvedValueOnce({ 
        data: { user: { id: 'user-123' } }, 
        error: null 
      });
      
      findUniqueMock.mockResolvedValueOnce(null);

      const user = await getAuthenticatedUser(mockReq as NextApiRequest);
      expect(user).toBeNull();
    });

    it('returns user data when token and database user are valid', async () => {
      mockReq.headers = { authorization: 'Bearer valid-token' };
      getUserMock.mockResolvedValueOnce({ 
        data: { user: { id: 'user-123' } }, 
        error: null 
      });
      
      const mockUser = { 
        id: 'user-123', 
        email: 'test@example.com',
        settings: { theme: 'light', language: 'en' } 
      };
      findUniqueMock.mockResolvedValueOnce(mockUser);

      const user = await getAuthenticatedUser(mockReq as NextApiRequest);
      expect(user).toEqual(mockUser);
    });
  });
});