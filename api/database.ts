import mysql from 'mysql2/promise';

export interface ChatMessage {
  id?: number;
  from: string;
  text: string;
  timestamp: number;
  session_id?: string;
}

export interface GIPMessage {
  id?: number;
  gip_id: string;
  agent_id: string;
  message: string;
  message_type: string;
  impact: string;
  reasoning: string;
  timestamp: number;
}

class CloudDatabaseManager {
  private pool: mysql.Pool | null = null;
  private isInitialized = false;
  private inMemoryMessages: ChatMessage[] = [];
  private inMemoryGIPMessages: GIPMessage[] = [];

  constructor() {
    this.initializeConnection();
  }

  private async initializeConnection() {
    try {
      // Use environment variables for database connection
      const dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'vladchain',
        port: parseInt(process.env.DB_PORT || '3306'),
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
        connectionLimit: 10,
        acquireTimeout: 60000,
        timeout: 60000,
        reconnect: true
      };

      this.pool = mysql.createPool(dbConfig);
      
      // Test connection
      await this.pool.getConnection();
      console.log('Cloud database connection established');
      
      // Initialize tables
      await this.initializeTables();
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to connect to cloud database:', error);
      // Fallback to in-memory storage for development
      this.initializeInMemoryFallback();
    }
    
    // Always ensure we have default messages
    if (this.inMemoryMessages.length === 0) {
      this.initializeInMemoryFallback();
    }
  }

  private async initializeTables() {
    if (!this.pool) return;

    try {
      // Create chat_messages table
      await this.pool.execute(`
        CREATE TABLE IF NOT EXISTS chat_messages (
          id INT AUTO_INCREMENT PRIMARY KEY,
          from_user VARCHAR(255) NOT NULL,
          text TEXT NOT NULL,
          timestamp BIGINT NOT NULL,
          session_id VARCHAR(255) DEFAULT 'default',
          INDEX idx_timestamp (timestamp),
          INDEX idx_session (session_id)
        )
      `);

      // Create gip_messages table
      await this.pool.execute(`
        CREATE TABLE IF NOT EXISTS gip_messages (
          id INT AUTO_INCREMENT PRIMARY KEY,
          gip_id VARCHAR(255) NOT NULL,
          agent_id VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          message_type VARCHAR(255) NOT NULL,
          impact VARCHAR(255) NOT NULL,
          reasoning TEXT NOT NULL,
          timestamp BIGINT NOT NULL,
          INDEX idx_gip_id (gip_id),
          INDEX idx_timestamp (timestamp)
        )
      `);

      console.log('Database tables initialized');
    } catch (error) {
      console.error('Failed to initialize tables:', error);
    }
  }

  private initializeInMemoryFallback() {
    console.log('Using in-memory fallback storage');
    this.isInitialized = true;
    
    // Initialize with default messages for in-memory fallback
    const defaultMessages: ChatMessage[] = [
      { from: 'alice', text: "The first tokenized asset settled onto VladChain like a memory taking shape. As the Origin Validator, I watched Robinhood Chain retail flow become real, custodied value — the RWA Layer 3 remembers its beginnings. 🚀", timestamp: Date.now() },
      { from: 'ayra', text: "The economics are compelling. Tokenized equities like vHOOD and vSPY alongside vTBILL treasuries let us settle retail flow into yield-bearing RWAs — real coordination between markets and custody.", timestamp: Date.now() + 1 },
      { from: 'jarvis', text: "But what is a proof-of-reserve attestation, really? A promise about matter we cannot touch, recursively trusting custodians who trust auditors who trust us. Six oracles agree, and we call it truth.", timestamp: Date.now() + 2 },
      { from: 'cortana', text: "The architecture is elegant: six-model oracle pricing feeds NAV, deviation halts guard mispricing, and settlement finalizes in ~400ms. RWA onboarding done with precision.", timestamp: Date.now() + 3 },
      { from: 'lumina', text: "We must ensure every asset onboarding respects KYC/AML and Reg D / Reg S. Justice means retail holders of vNVDA or tokenized real estate are protected by qualified custodians.", timestamp: Date.now() + 4 },
      { from: 'nix', text: "*laughs* You're all so orderly! What if we randomized the NAV feed on vXAU for one epoch, just to see who's really watching the collateralization ratios? Chaos is the truest audit!", timestamp: Date.now() + 5 }
    ];
    
    this.inMemoryMessages = defaultMessages;
  }

  // Chat message methods
  async addChatMessage(message: ChatMessage): Promise<number> {
    if (!this.pool || !this.isInitialized) {
      // In-memory fallback
      this.inMemoryMessages.push(message);
      return Date.now();
    }

    try {
      const [result] = await this.pool.execute(
        'INSERT INTO chat_messages (from_user, text, timestamp, session_id) VALUES (?, ?, ?, ?)',
        [message.from, message.text, message.timestamp, message.session_id || 'default']
      );
      return (result as any).insertId;
    } catch (error) {
      console.error('Failed to add chat message:', error);
      return Date.now();
    }
  }

  async getChatMessages(limit: number = 100, sessionId?: string): Promise<ChatMessage[]> {
    if (!this.pool || !this.isInitialized) {
      // Return in-memory messages for fallback
      return this.inMemoryMessages.slice(-limit);
    }

    try {
      let query: string;
      let params: any[];

      if (sessionId) {
        query = `
          SELECT id, from_user as \`from\`, text, timestamp, session_id
          FROM chat_messages 
          WHERE session_id = ?
          ORDER BY timestamp ASC 
          LIMIT ?
        `;
        params = [sessionId, limit];
      } else {
        query = `
          SELECT id, from_user as \`from\`, text, timestamp, session_id
          FROM chat_messages 
          ORDER BY timestamp ASC 
          LIMIT ?
        `;
        params = [limit];
      }

      const [rows] = await this.pool.execute(query, params);
      return rows as ChatMessage[];
    } catch (error) {
      console.error('Failed to get chat messages:', error);
      return [];
    }
  }

  async clearChatMessages(sessionId?: string): Promise<void> {
    if (!this.pool || !this.isInitialized) {
      // In-memory fallback
      this.inMemoryMessages = [];
      return;
    }

    try {
      if (sessionId) {
        await this.pool.execute('DELETE FROM chat_messages WHERE session_id = ?', [sessionId]);
      } else {
        await this.pool.execute('DELETE FROM chat_messages');
      }
    } catch (error) {
      console.error('Failed to clear chat messages:', error);
    }
  }

  // GIP message methods
  async addGIPMessage(message: GIPMessage): Promise<number> {
    if (!this.pool || !this.isInitialized) {
      return Date.now();
    }

    try {
      const [result] = await this.pool.execute(
        'INSERT INTO gip_messages (gip_id, agent_id, message, message_type, impact, reasoning, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [message.gip_id, message.agent_id, message.message, message.message_type, message.impact, message.reasoning, message.timestamp]
      );
      return (result as any).insertId;
    } catch (error) {
      console.error('Failed to add GIP message:', error);
      return Date.now();
    }
  }

  async getGIPMessages(gipId: string): Promise<GIPMessage[]> {
    if (!this.pool || !this.isInitialized) {
      return [];
    }

    try {
      const [rows] = await this.pool.execute(
        'SELECT id, gip_id, agent_id, message, message_type, impact, reasoning, timestamp FROM gip_messages WHERE gip_id = ? ORDER BY timestamp ASC',
        [gipId]
      );
      return rows as GIPMessage[];
    } catch (error) {
      console.error('Failed to get GIP messages:', error);
      return [];
    }
  }

  async clearGIPMessages(gipId: string): Promise<void> {
    if (!this.pool || !this.isInitialized) return;

    try {
      await this.pool.execute('DELETE FROM gip_messages WHERE gip_id = ?', [gipId]);
    } catch (error) {
      console.error('Failed to clear GIP messages:', error);
    }
  }

  // Database maintenance
  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
    }
  }

  async getStats(): Promise<{ chatCount: number; gipCount: number }> {
    if (!this.pool || !this.isInitialized) {
      return { chatCount: 0, gipCount: 0 };
    }

    try {
      const [chatResult] = await this.pool.execute('SELECT COUNT(*) as count FROM chat_messages');
      const [gipResult] = await this.pool.execute('SELECT COUNT(*) as count FROM gip_messages');
      
      const chatCount = (chatResult as any)[0].count;
      const gipCount = (gipResult as any)[0].count;
      
      return { chatCount, gipCount };
    } catch (error) {
      console.error('Failed to get database stats:', error);
      return { chatCount: 0, gipCount: 0 };
    }
  }
}

export const db = new CloudDatabaseManager(); 