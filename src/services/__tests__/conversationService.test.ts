import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ConversationService } from '../conversationService';
import {
  mockConversationSession,
  mockUserMessage,
  mockConversationContext,
  mockCustomer,
  mockInvoice,
  mockExpense,
  mockItem
} from '../../test/fixtures/conversationFixtures';
import {
  setupTest,
  cleanupTest,
  createSuccessResponse,
  createErrorResponse,
  expectValidConversation,
  expectValidMessage,
  expectToBeValidUUID
} from '../../test/utils/testUtils';

// Create mock supabase with proper chaining
const createMockSupabaseClient = () => {
  const mockChain = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null
      })
    }
  };
  return mockChain;
};

// Mock the Supabase module
vi.mock('@/integrations/supabase/client', () => ({
  supabase: createMockSupabaseClient()
}));

// Get reference to mocked supabase
import { supabase } from '@/integrations/supabase/client';
const mockSupabase = supabase as any;

describe('ConversationService', () => {
  let conversationService: ConversationService;
  let testMocks: ReturnType<typeof setupTest>;

  beforeEach(() => {
    testMocks = setupTest();
    conversationService = new ConversationService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanupTest(testMocks);
  });

  describe('createConversation', () => {
    it('should create a new conversation with default context', async () => {
      const mockResponse = {
        id: 'conversation-1',
        user_id: 'user-1',
        title: null,
        context: mockConversationContext,
        status: 'active',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      // Reset mocks and set up the chain for this test
      vi.clearAllMocks();
      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.insert.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.single.mockResolvedValue(createSuccessResponse(mockResponse));

      const result = await conversationService.createConversation('user-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('conversations');
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        user_id: 'user-1',
        context: expect.objectContaining({
          recentEntities: expect.any(Object),
          userPreferences: expect.any(Object)
        }),
        status: 'active'
      });

      expectValidConversation(result);
      expect(result.userId).toBe('user-1');
      expect(result.status).toBe('active');
    });

    it('should create conversation with custom initial context', async () => {
      const customContext = {
        ...mockConversationContext,
        userPreferences: {
          ...mockConversationContext.userPreferences,
          currency: 'EUR'
        }
      };

      const mockResponse = {
        id: 'conversation-1',
        user_id: 'user-1',
        title: null,
        context: customContext,
        status: 'active',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      mockSupabase.insert.mockResolvedValue(createSuccessResponse(mockResponse));

      const result = await conversationService.createConversation('user-1', customContext);

      expect(mockSupabase.insert).toHaveBeenCalledWith({
        user_id: 'user-1',
        context: customContext,
        status: 'active'
      });

      expect(result.context.userPreferences.currency).toBe('EUR');
    });

    it('should handle database errors when creating conversation', async () => {
      mockSupabase.insert.mockResolvedValue(createErrorResponse('Database error'));

      await expect(
        conversationService.createConversation('user-1')
      ).rejects.toThrow('Failed to create conversation: Database error');
    });
  });

  describe('getConversation', () => {
    it('should retrieve conversation with messages', async () => {
      const mockConversationData = {
        id: 'conversation-1',
        user_id: 'user-1',
        title: 'Test Conversation',
        context: mockConversationContext,
        status: 'active',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        conversation_messages: [
          {
            id: 'message-1',
            conversation_id: 'conversation-1',
            role: 'user',
            content: 'Hello',
            metadata: null,
            created_at: '2024-01-01T00:00:00Z'
          }
        ]
      };

      mockSupabase.eq.mockResolvedValue(createSuccessResponse(mockConversationData));

      const result = await conversationService.getConversation('conversation-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('conversations');
      expect(mockSupabase.select).toHaveBeenCalledWith(expect.stringContaining('conversation_messages'));
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'conversation-1');

      expect(result).toBeTruthy();
      if (result) {
        expectValidConversation(result);
        expect(result.messages).toHaveLength(1);
        expectValidMessage(result.messages[0]);
      }
    });

    it('should return null for non-existent conversation', async () => {
      mockSupabase.eq.mockResolvedValue(createErrorResponse('PGRST116'));

      const result = await conversationService.getConversation('non-existent-id');

      expect(result).toBeNull();
    });

    it('should handle database errors when getting conversation', async () => {
      mockSupabase.eq.mockResolvedValue(createErrorResponse('Database error'));

      await expect(
        conversationService.getConversation('conversation-1')
      ).rejects.toThrow('Failed to get conversation: Database error');
    });
  });

  describe('getUserConversations', () => {
    it('should retrieve user conversations with default limit', async () => {
      const mockConversations = [
        {
          id: 'conversation-1',
          user_id: 'user-1',
          title: 'Conversation 1',
          context: mockConversationContext,
          status: 'active',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          conversation_messages: []
        },
        {
          id: 'conversation-2',
          user_id: 'user-1',
          title: 'Conversation 2',
          context: mockConversationContext,
          status: 'completed',
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
          conversation_messages: []
        }
      ];

      mockSupabase.limit.mockResolvedValue(createSuccessResponse(mockConversations));

      const result = await conversationService.getUserConversations('user-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('conversations');
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'user-1');
      expect(mockSupabase.limit).toHaveBeenCalledWith(20);

      expect(result).toHaveLength(2);
      result.forEach(conversation => {
        expectValidConversation(conversation);
        expect(conversation.userId).toBe('user-1');
      });
    });

    it('should retrieve user conversations with custom limit', async () => {
      mockSupabase.limit.mockResolvedValue(createSuccessResponse([]));

      await conversationService.getUserConversations('user-1', 5);

      expect(mockSupabase.limit).toHaveBeenCalledWith(5);
    });
  });

  describe('addMessage', () => {
    it('should add a message to conversation', async () => {
      const mockMessageData = {
        id: 'message-1',
        conversation_id: 'conversation-1',
        role: 'user',
        content: 'Test message',
        metadata: { intent: 'test' },
        created_at: '2024-01-01T00:00:00Z'
      };

      mockSupabase.insert.mockResolvedValue(createSuccessResponse(mockMessageData));

      const result = await conversationService.addMessage(
        'conversation-1',
        'user',
        'Test message',
        { intent: 'test' }
      );

      expect(mockSupabase.from).toHaveBeenCalledWith('conversation_messages');
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        conversation_id: 'conversation-1',
        role: 'user',
        content: 'Test message',
        metadata: { intent: 'test' }
      });

      expectValidMessage(result);
      expect(result.content).toBe('Test message');
      expect(result.role).toBe('user');
    });

    it('should handle database errors when adding message', async () => {
      mockSupabase.insert.mockResolvedValue(createErrorResponse('Database error'));

      await expect(
        conversationService.addMessage('conversation-1', 'user', 'Test message')
      ).rejects.toThrow('Failed to add message: Database error');
    });
  });

  describe('updateConversationContext', () => {
    it('should update conversation context', async () => {
      const currentContext = mockConversationContext;
      const updateContext = {
        userPreferences: {
          ...mockConversationContext.userPreferences,
          currency: 'EUR'
        }
      };

      // Mock getting current context
      mockSupabase.eq.mockResolvedValueOnce(createSuccessResponse({ context: currentContext }));
      // Mock updating context
      mockSupabase.eq.mockResolvedValueOnce(createSuccessResponse({}));

      await conversationService.updateConversationContext('conversation-1', updateContext);

      expect(mockSupabase.from).toHaveBeenCalledWith('conversations');
      expect(mockSupabase.update).toHaveBeenCalledWith({
        context: expect.objectContaining({
          userPreferences: expect.objectContaining({
            currency: 'EUR'
          })
        }),
        updated_at: expect.any(String)
      });
    });
  });

  describe('buildContextFromCurrentData', () => {
    it('should build context from current user data', async () => {
      // Mock parallel Supabase calls
      mockSupabase.limit
        .mockResolvedValueOnce(createSuccessResponse([mockCustomer])) // customers
        .mockResolvedValueOnce(createSuccessResponse([mockInvoice])) // invoices
        .mockResolvedValueOnce(createSuccessResponse([mockExpense])) // expenses
        .mockResolvedValueOnce(createSuccessResponse([mockItem])) // items
        .mockResolvedValueOnce(createSuccessResponse(null)); // business profile

      const result = await conversationService.buildContextFromCurrentData('user-1');

      expect(result).toHaveProperty('recentEntities');
      expect(result).toHaveProperty('userPreferences');
      expect(result.recentEntities.customers).toHaveLength(1);
      expect(result.recentEntities.invoices).toHaveLength(1);
      expect(result.recentEntities.expenses).toHaveLength(1);
      expect(result.recentEntities.items).toHaveLength(1);
    });

    it('should handle errors gracefully and return minimal context', async () => {
      // Mock failed database calls
      mockSupabase.limit.mockRejectedValue(new Error('Database error'));

      const result = await conversationService.buildContextFromCurrentData('user-1');

      expect(result).toHaveProperty('recentEntities');
      expect(result).toHaveProperty('userPreferences');
      expect(result.recentEntities.customers).toHaveLength(0);
      expect(result.recentEntities.invoices).toHaveLength(0);
    });
  });

  describe('addEntityToContext', () => {
    it('should add customer to conversation context', async () => {
      const mockConversation = mockConversationSession;
      
      // Mock getting conversation
      vi.spyOn(conversationService, 'getConversation').mockResolvedValue(mockConversation);
      // Mock updating context
      vi.spyOn(conversationService, 'updateConversationContext').mockResolvedValue();

      await conversationService.addEntityToContext('conversation-1', 'customers', mockCustomer);

      expect(conversationService.updateConversationContext).toHaveBeenCalledWith(
        'conversation-1',
        expect.objectContaining({
          recentEntities: expect.objectContaining({
            customers: expect.arrayContaining([mockCustomer])
          })
        })
      );
    });

    it('should limit entities to 10 items', async () => {
      const mockConversation = {
        ...mockConversationSession,
        context: {
          ...mockConversationContext,
          recentEntities: {
            ...mockConversationContext.recentEntities,
            customers: Array(10).fill(null).map((_, i) => ({ ...mockCustomer, id: `customer-${i}` }))
          }
        }
      };

      vi.spyOn(conversationService, 'getConversation').mockResolvedValue(mockConversation);
      vi.spyOn(conversationService, 'updateConversationContext').mockResolvedValue();

      await conversationService.addEntityToContext('conversation-1', 'customers', mockCustomer);

      expect(conversationService.updateConversationContext).toHaveBeenCalledWith(
        'conversation-1',
        expect.objectContaining({
          recentEntities: expect.objectContaining({
            customers: expect.arrayContaining([mockCustomer])
          })
        })
      );
    });
  });

  describe('updateConversationTitle', () => {
    it('should update conversation title', async () => {
      mockSupabase.eq.mockResolvedValue(createSuccessResponse({}));

      await conversationService.updateConversationTitle('conversation-1', 'New Title');

      expect(mockSupabase.update).toHaveBeenCalledWith({
        title: 'New Title',
        updated_at: expect.any(String)
      });
    });
  });

  describe('updateConversationStatus', () => {
    it('should update conversation status', async () => {
      mockSupabase.eq.mockResolvedValue(createSuccessResponse({}));

      await conversationService.updateConversationStatus('conversation-1', 'completed');

      expect(mockSupabase.update).toHaveBeenCalledWith({
        status: 'completed',
        updated_at: expect.any(String)
      });
    });
  });

  describe('deleteConversation', () => {
    it('should delete conversation', async () => {
      mockSupabase.eq.mockResolvedValue(createSuccessResponse({}));

      await conversationService.deleteConversation('conversation-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('conversations');
      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'conversation-1');
    });

    it('should handle database errors when deleting conversation', async () => {
      mockSupabase.eq.mockResolvedValue(createErrorResponse('Database error'));

      await expect(
        conversationService.deleteConversation('conversation-1')
      ).rejects.toThrow('Failed to delete conversation: Database error');
    });
  });
});