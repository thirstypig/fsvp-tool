// Blueprint reference: javascript_database integration
import { 
  users, 
  vendors,
  products,
  documents,
  digitalSignatures,
  auditLogs,
  type User, 
  type InsertUser,
  type Vendor,
  type InsertVendor,
  type Product,
  type InsertProduct,
  type Document,
  type InsertDocument,
  type DigitalSignature,
  type InsertDigitalSignature,
  type AuditLog,
  type InsertAuditLog,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gte, lte, sql, or } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User>;
  
  // Vendor methods
  getVendor(id: string): Promise<Vendor | undefined>;
  getVendorByUserId(userId: string): Promise<Vendor | undefined>;
  createVendor(vendor: InsertVendor): Promise<Vendor>;
  updateVendor(id: string, updates: Partial<InsertVendor>): Promise<Vendor>;
  getAllVendors(): Promise<Vendor[]>;
  
  // Product methods
  getProduct(id: string): Promise<Product | undefined>;
  getProductBySku(skuNumber: string): Promise<Product | undefined>;
  getProductsByVendor(vendorId: string): Promise<Product[]>;
  getProductsByStatus(status: string): Promise<Product[]>;
  getAllProducts(): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, updates: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Product>;
  
  // Document methods
  getDocument(id: string): Promise<Document | undefined>;
  getDocumentsByProduct(productId: string): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  
  // Digital Signature methods
  createDigitalSignature(signature: InsertDigitalSignature): Promise<DigitalSignature>;
  getSignaturesByProduct(productId: string): Promise<DigitalSignature[]>;
  
  // Audit Log methods
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogsByEntity(entityType: string, entityId: string): Promise<AuditLog[]>;
  getAuditLogsByUser(userId: string): Promise<AuditLog[]>;
  getAllAuditLogs(options?: {
    limit?: number;
    offset?: number;
    action?: string;
    entityType?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{ logs: AuditLog[]; total: number }>;
  getAuditLogsForProduct(productId: string): Promise<AuditLog[]>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user;
  }

  // Vendor methods
  async getVendor(id: string): Promise<Vendor | undefined> {
    const [vendor] = await db.select().from(vendors).where(eq(vendors.id, id));
    return vendor || undefined;
  }

  async getVendorByUserId(userId: string): Promise<Vendor | undefined> {
    const [vendor] = await db.select().from(vendors).where(eq(vendors.userId, userId));
    return vendor || undefined;
  }

  async createVendor(insertVendor: InsertVendor): Promise<Vendor> {
    const [vendor] = await db.insert(vendors).values(insertVendor).returning();
    return vendor;
  }

  async updateVendor(id: string, updates: Partial<InsertVendor>): Promise<Vendor> {
    const updatedData = { ...updates, updatedAt: new Date() };
    const [vendor] = await db.update(vendors).set(updatedData).where(eq(vendors.id, id)).returning();
    return vendor;
  }

  async getAllVendors(): Promise<Vendor[]> {
    return await db.select().from(vendors).orderBy(desc(vendors.createdAt));
  }

  // Product methods
  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async getProductBySku(skuNumber: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.skuNumber, skuNumber));
    return product || undefined;
  }

  async getProductsByVendor(vendorId: string): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.vendorId, vendorId)).orderBy(desc(products.createdAt));
  }

  async getProductsByStatus(status: string): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.status, status as any)).orderBy(desc(products.createdAt));
  }

  async getAllProducts(): Promise<Product[]> {
    return await db.select().from(products).orderBy(desc(products.createdAt));
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db.insert(products).values(insertProduct).returning();
    return product;
  }

  async updateProduct(id: string, updates: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Product> {
    const updatedData = { ...updates, updatedAt: new Date() };
    const [product] = await db.update(products).set(updatedData).where(eq(products.id, id)).returning();
    return product;
  }

  // Document methods
  async getDocument(id: string): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document || undefined;
  }

  async getDocumentsByProduct(productId: string): Promise<Document[]> {
    return await db.select().from(documents).where(eq(documents.productId, productId)).orderBy(desc(documents.uploadedAt));
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const [document] = await db.insert(documents).values(insertDocument).returning();
    return document;
  }

  // Digital Signature methods
  async createDigitalSignature(insertSignature: InsertDigitalSignature): Promise<DigitalSignature> {
    const [signature] = await db.insert(digitalSignatures).values(insertSignature).returning();
    return signature;
  }

  async getSignaturesByProduct(productId: string): Promise<DigitalSignature[]> {
    return await db.select().from(digitalSignatures).where(eq(digitalSignatures.productId, productId)).orderBy(desc(digitalSignatures.timestamp));
  }

  // Audit Log methods
  async createAuditLog(insertLog: InsertAuditLog): Promise<AuditLog> {
    const [log] = await db.insert(auditLogs).values(insertLog).returning();
    return log;
  }

  async getAuditLogsByEntity(entityType: string, entityId: string): Promise<AuditLog[]> {
    return await db.select().from(auditLogs)
      .where(and(eq(auditLogs.entityType, entityType), eq(auditLogs.entityId, entityId)))
      .orderBy(desc(auditLogs.timestamp));
  }

  async getAuditLogsByUser(userId: string): Promise<AuditLog[]> {
    return await db.select().from(auditLogs)
      .where(eq(auditLogs.userId, userId))
      .orderBy(desc(auditLogs.timestamp));
  }

  async getAllAuditLogs(options: {
    limit?: number;
    offset?: number;
    action?: string;
    entityType?: string;
    startDate?: Date;
    endDate?: Date;
  } = {}): Promise<{ logs: AuditLog[]; total: number }> {
    const { 
      limit = 100, 
      offset = 0, 
      action, 
      entityType, 
      startDate, 
      endDate 
    } = options;

    // Build where conditions
    const conditions = [];
    if (action) {
      conditions.push(eq(auditLogs.action, action as any));
    }
    if (entityType) {
      conditions.push(eq(auditLogs.entityType, entityType));
    }
    if (startDate) {
      conditions.push(gte(auditLogs.timestamp, startDate));
    }
    if (endDate) {
      conditions.push(lte(auditLogs.timestamp, endDate));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(auditLogs)
      .where(whereClause);
    const total = countResult[0]?.count || 0;

    // Get logs with pagination
    const logs = await db
      .select()
      .from(auditLogs)
      .where(whereClause)
      .orderBy(desc(auditLogs.timestamp))
      .limit(Math.min(limit, 500))
      .offset(offset);

    return { logs, total };
  }

  async getAuditLogsForProduct(productId: string): Promise<AuditLog[]> {
    // Get all logs related to the product (product itself, documents, signatures)
    return await db.select().from(auditLogs)
      .where(
        or(
          and(eq(auditLogs.entityType, 'product'), eq(auditLogs.entityId, productId)),
          and(eq(auditLogs.entityType, 'document'), sql`${auditLogs.entityId} IN (SELECT id FROM ${documents} WHERE product_id = ${productId})`),
          and(eq(auditLogs.entityType, 'signature'), sql`${auditLogs.entityId} IN (SELECT id FROM ${digitalSignatures} WHERE product_id = ${productId})`)
        )
      )
      .orderBy(desc(auditLogs.timestamp));
  }
}

export const storage = new DatabaseStorage();
