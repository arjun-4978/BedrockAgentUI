import { type User, type InsertUser, type ChatSession, type InsertChatSession, type ChatMessage, type InsertChatMessage, type Report, type InsertReport } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createChatSession(session: InsertChatSession): Promise<ChatSession>;
  getChatSession(sessionId: string): Promise<ChatSession | undefined>;
  
  createChatMessage(sessionId: string, message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessages(sessionId: string): Promise<ChatMessage[]>;
  
  createReport(report: InsertReport): Promise<Report>;
  getReports(): Promise<Report[]>;
  getReport(id: string): Promise<Report | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private chatSessions: Map<string, ChatSession>;
  private chatMessages: Map<string, ChatMessage[]>;
  private reports: Map<string, Report>;

  constructor() {
    this.users = new Map();
    this.chatSessions = new Map();
    this.chatMessages = new Map();
    this.reports = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createChatSession(insertSession: InsertChatSession): Promise<ChatSession> {
    const id = randomUUID();
    const session: ChatSession = { 
      ...insertSession, 
      id, 
      userId: null,
      createdAt: new Date()
    };
    this.chatSessions.set(id, session);
    this.chatMessages.set(id, []);
    return session;
  }

  async getChatSession(sessionId: string): Promise<ChatSession | undefined> {
    return Array.from(this.chatSessions.values()).find(
      (session) => session.sessionId === sessionId,
    );
  }

  async createChatMessage(sessionId: string, insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = randomUUID();
    const session = await this.getChatSession(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    
    const message: ChatMessage = {
      ...insertMessage,
      id,
      sessionId: session.id,
      createdAt: new Date(),
      isFromAgent: insertMessage.isFromAgent || false
    };
    
    const messages = this.chatMessages.get(session.id) || [];
    messages.push(message);
    this.chatMessages.set(session.id, messages);
    
    return message;
  }

  async getChatMessages(sessionId: string): Promise<ChatMessage[]> {
    const session = await this.getChatSession(sessionId);
    if (!session) {
      return [];
    }
    return this.chatMessages.get(session.id) || [];
  }

  async createReport(insertReport: InsertReport): Promise<Report> {
    const id = randomUUID();
    const report: Report = {
      id,
      title: insertReport.title,
      description: insertReport.description || null,
      s3Path: insertReport.s3Path,
      size: insertReport.size || null,
      createdAt: new Date()
    };
    this.reports.set(id, report);
    return report;
  }

  async getReports(): Promise<Report[]> {
    return Array.from(this.reports.values()).sort(
      (a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
    );
  }

  async getReport(id: string): Promise<Report | undefined> {
    return this.reports.get(id);
  }
}

export const storage = new MemStorage();
