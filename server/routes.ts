import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { registerSchema, loginSchema, insertVendorSchema, insertProductSchema, insertDocumentSchema, insertDigitalSignatureSchema, reviewSchema } from "@shared/schema";
import { scryptSync, randomBytes, timingSafeEqual, createHash } from "crypto";
import { fromZodError } from "zod-validation-error";
import multer from "multer";
import { Client } from "@replit/object-storage";

// Extend express-session types
declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

// TESTING MODE: Bypass authentication (set to false to re-enable auth)
const BYPASS_AUTH = true;

// Password hashing utilities
function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(":");
  const hashBuffer = Buffer.from(hash, "hex");
  const suppliedHashBuffer = scryptSync(password, salt, 64);
  return timingSafeEqual(hashBuffer, suppliedHashBuffer);
}

// Version increment utility
function incrementMinorVersion(version: string): string {
  const versionMatch = version.match(/^v?(\d+)\.(\d+)\.(\d+)$/);
  if (!versionMatch) return "v1.0.0";
  const [, major, minor, patch] = versionMatch;
  return `v${major}.${parseInt(minor) + 1}.${patch}`;
}

// Configure multer for file uploads (max 10MB, accept PDF, DOCX, XLSX)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    const allowedExtensions = ['.pdf', '.docx', '.xlsx'];
    const fileExtension = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));
    
    if (allowedTypes.includes(file.mimetype) && allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOCX, and XLSX files are allowed.'));
    }
  },
});

// Initialize object storage client with bucket ID
const objectStorageClient = new Client({
  bucketId: process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID
});

export async function registerRoutes(app: Express): Promise<Server> {
  // POST /api/auth/register - Register new user
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const validation = registerSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: fromZodError(validation.error).message 
        });
      }

      const { email, password, name, role } = validation.data;

      // Check for duplicate email
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ 
          message: "Email already registered" 
        });
      }

      // Hash password and create user
      const hashedPassword = hashPassword(password);
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        name,
        role,
        isEmailVerified: false,
      });

      // Create audit log
      await storage.createAuditLog({
        userId: user.id,
        action: "create",
        entityType: "user",
        entityId: user.id,
        description: `User ${user.email} registered with role ${user.role}`,
        ipAddress: req.ip,
      });

      // Auto-create vendor profile for vendor users
      if (role === "vendor") {
        const vendor = await storage.createVendor({
          userId: user.id,
          companyName: name, // Use user's name as initial company name
          country: "",
          contactEmail: email,
          contactPhone: "",
          address: "",
          verificationStatus: "unverified",
        });

        await storage.createAuditLog({
          userId: user.id,
          action: "create",
          entityType: "vendor",
          entityId: vendor.id,
          description: `Vendor profile created for ${user.email}`,
          ipAddress: req.ip,
        });
      }

      // Set session
      req.session.userId = user.id;

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      return res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Register error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // POST /api/auth/login - Login user
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const validation = loginSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: fromZodError(validation.error).message 
        });
      }

      const { email, password } = validation.data;

      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ 
          message: "Invalid email or password" 
        });
      }

      // Verify password
      const isValidPassword = verifyPassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ 
          message: "Invalid email or password" 
        });
      }

      // Create audit log
      await storage.createAuditLog({
        userId: user.id,
        action: "update",
        entityType: "user",
        entityId: user.id,
        description: `User ${user.email} logged in`,
        ipAddress: req.ip,
      });

      // Set session
      req.session.userId = user.id;

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      return res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // POST /api/auth/logout - Logout user
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    if (!BYPASS_AUTH && !req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.clearCookie("connect.sid");
      return res.status(200).json({ message: "Logged out successfully" });
    });
  });

  // GET /api/auth/me - Get current user
  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        req.session.destroy(() => {});
        return res.status(401).json({ message: "User not found" });
      }

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      return res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Get current user error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // POST /api/vendors - Create vendor profile
  app.post("/api/vendors", async (req: Request, res: Response) => {
    try {
      // Check authentication
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Check if user is vendor
      if (user.role !== "vendor") {
        return res.status(403).json({ message: "Only vendors can create vendor profiles" });
      }

      // Check if vendor profile already exists
      const existingVendor = await storage.getVendorByUserId(user.id);
      if (existingVendor) {
        return res.status(409).json({ message: "Vendor profile already exists" });
      }

      // Validate request body
      const validation = insertVendorSchema.safeParse({
        ...req.body,
        userId: user.id, // Ensure userId is set to logged-in user
      });
      
      if (!validation.success) {
        return res.status(400).json({ 
          message: fromZodError(validation.error).message 
        });
      }

      // Create vendor
      const vendor = await storage.createVendor(validation.data);

      // Create audit log
      await storage.createAuditLog({
        userId: user.id,
        action: "create",
        entityType: "vendor",
        entityId: vendor.id,
        description: `Vendor profile created for ${vendor.companyName}`,
        ipAddress: req.ip,
      });

      return res.status(201).json(vendor);
    } catch (error) {
      console.error("Create vendor error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // GET /api/vendors/me - Get current user's vendor profile
  app.get("/api/vendors/me", async (req: Request, res: Response) => {
    try {
      // Check authentication - return empty vendor in test mode
      if (!BYPASS_AUTH && !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      // In bypass mode with no session, return empty vendor data for testing
      if (BYPASS_AUTH && !req.session.userId) {
        return res.status(200).json({
          id: "test-vendor-id",
          userId: "test-user-id",
          companyName: "Test Vendor Company",
          country: "USA",
          contactEmail: "test@vendor.com",
          contactPhone: "",
          address: "",
          verificationStatus: "unverified",
          createdAt: new Date(),
        });
      }

      const vendor = await storage.getVendorByUserId(req.session.userId!);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor profile not found" });
      }

      return res.status(200).json(vendor);
    } catch (error) {
      console.error("Get vendor profile error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // PUT /api/vendors/:id - Update vendor profile
  app.put("/api/vendors/:id", async (req: Request, res: Response) => {
    try {
      // Check authentication
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const vendorId = req.params.id;
      const vendor = await storage.getVendor(vendorId);
      
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Check authorization
      const isOwnProfile = vendor.userId === user.id;
      const canUpdateVerification = user.role === "distributor" || user.role === "auditor" || user.role === "admin";

      if (!isOwnProfile && !canUpdateVerification) {
        return res.status(403).json({ message: "Not authorized to update this vendor profile" });
      }

      // If vendor is updating own profile, remove verificationStatus from request body
      let updateData = { ...req.body };
      if (isOwnProfile && user.role === "vendor" && updateData.verificationStatus) {
        delete updateData.verificationStatus;
      }

      // Validate request body
      const validation = insertVendorSchema.partial().safeParse(updateData);
      if (!validation.success) {
        return res.status(400).json({ 
          message: fromZodError(validation.error).message 
        });
      }

      // Track changes for audit log
      const changes = {
        before: vendor,
        after: { ...vendor, ...validation.data },
      };

      // Update vendor
      const updatedVendor = await storage.updateVendor(vendorId, validation.data);

      // Create audit log
      await storage.createAuditLog({
        userId: user.id,
        action: "update",
        entityType: "vendor",
        entityId: vendorId,
        description: `Vendor profile updated for ${updatedVendor.companyName}`,
        changes: JSON.stringify(changes),
        ipAddress: req.ip,
      });

      return res.status(200).json(updatedVendor);
    } catch (error) {
      console.error("Update vendor error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // GET /api/vendors - Get all vendors
  app.get("/api/vendors", async (req: Request, res: Response) => {
    try {
      // Check authentication - return empty array in test mode
      if (!BYPASS_AUTH && !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      // In bypass mode with no session, return empty vendors for testing
      if (BYPASS_AUTH && !req.session.userId) {
        return res.status(200).json([]);
      }

      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Check authorization - only distributors and auditors can view all vendors
      if (user.role !== "distributor" && user.role !== "auditor" && user.role !== "admin") {
        return res.status(403).json({ message: "Not authorized to view all vendors" });
      }

      const vendors = await storage.getAllVendors();
      return res.status(200).json(vendors);
    } catch (error) {
      console.error("Get all vendors error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // GET /api/vendors/:id - Get specific vendor
  app.get("/api/vendors/:id", async (req: Request, res: Response) => {
    try {
      // Check authentication
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Check authorization - only distributors and auditors can view specific vendors
      if (user.role !== "distributor" && user.role !== "auditor" && user.role !== "admin") {
        return res.status(403).json({ message: "Not authorized to view vendor details" });
      }

      const vendorId = req.params.id;
      const vendor = await storage.getVendor(vendorId);
      
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }

      return res.status(200).json(vendor);
    } catch (error) {
      console.error("Get vendor error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // POST /api/products - Create new product SKU (vendors only)
  app.post("/api/products", async (req: Request, res: Response) => {
    try {
      // Check authentication
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Check if user is vendor
      if (user.role !== "vendor") {
        return res.status(403).json({ message: "Only vendors can create products" });
      }

      // Check if vendor profile exists
      const vendor = await storage.getVendorByUserId(user.id);
      if (!vendor) {
        return res.status(403).json({ message: "Vendor profile required to create products" });
      }

      // Check for duplicate SKU
      if (req.body.skuNumber) {
        const existingProduct = await storage.getProductBySku(req.body.skuNumber);
        if (existingProduct) {
          return res.status(409).json({ message: "SKU number already exists" });
        }
      }

      // Validate request body and set vendorId
      const validation = insertProductSchema.safeParse({
        ...req.body,
        vendorId: vendor.id,
        status: "draft",
      });

      if (!validation.success) {
        return res.status(400).json({ 
          message: fromZodError(validation.error).message 
        });
      }

      // Create product
      const product = await storage.createProduct(validation.data);

      // Update vendor's lastSubmissionDate
      await storage.updateVendor(vendor.id, {
        lastSubmissionDate: new Date(),
      });

      // Create audit log
      await storage.createAuditLog({
        userId: user.id,
        action: "create",
        entityType: "product",
        entityId: product.id,
        description: `Product ${product.skuNumber} created`,
        version: product.version,
        ipAddress: req.ip,
      });

      return res.status(201).json(product);
    } catch (error) {
      console.error("Create product error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // GET /api/products/my - Get vendor's own products
  app.get("/api/products/my", async (req: Request, res: Response) => {
    try {
      // Check authentication - return empty array in test mode
      if (!BYPASS_AUTH && !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      // In bypass mode with no session, return empty products for testing
      if (BYPASS_AUTH && !req.session.userId) {
        return res.status(200).json([]);
      }

      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Check if user is vendor
      if (user.role !== "vendor") {
        return res.status(403).json({ message: "Only vendors can view their products" });
      }

      // Get vendor profile
      const vendor = await storage.getVendorByUserId(user.id);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor profile not found" });
      }

      // Get vendor's products
      const products = await storage.getProductsByVendor(vendor.id);
      return res.status(200).json(products);
    } catch (error) {
      console.error("Get vendor products error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // GET /api/products/pending - Get all products in "pending" status (distributors/auditors only)
  app.get("/api/products/pending", async (req: Request, res: Response) => {
    try {
      // Check authentication
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Check authorization - only distributors and auditors can view pending products
      if (user.role !== "distributor" && user.role !== "auditor") {
        return res.status(403).json({ message: "Not authorized to view pending products" });
      }

      // Get all products with "pending" status
      const products = await storage.getProductsByStatus("pending");
      return res.status(200).json(products);
    } catch (error) {
      console.error("Get pending products error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // GET /api/products/:id - Get specific product
  app.get("/api/products/:id", async (req: Request, res: Response) => {
    try {
      // Check authentication
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const productId = req.params.id;
      const product = await storage.getProduct(productId);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Check authorization
      const isDistributorOrAuditor = user.role === "distributor" || user.role === "auditor" || user.role === "admin";
      
      if (isDistributorOrAuditor) {
        // Distributors and auditors can view any product
        return res.status(200).json(product);
      }

      // For vendors, check if they own the product
      if (user.role === "vendor") {
        const vendor = await storage.getVendorByUserId(user.id);
        if (!vendor || product.vendorId !== vendor.id) {
          return res.status(403).json({ message: "Not authorized to view this product" });
        }
        return res.status(200).json(product);
      }

      return res.status(403).json({ message: "Not authorized to view products" });
    } catch (error) {
      console.error("Get product error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // PUT /api/products/:id - Update product
  app.put("/api/products/:id", async (req: Request, res: Response) => {
    try {
      // Check authentication
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const productId = req.params.id;
      const product = await storage.getProduct(productId);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Check authorization
      const isDistributorOrAuditor = user.role === "distributor" || user.role === "auditor" || user.role === "admin";
      
      let canUpdate = false;
      let updateData = { ...req.body };

      if (isDistributorOrAuditor) {
        // Distributors and auditors can update any product in any status
        canUpdate = true;
      } else if (user.role === "vendor") {
        // Vendors can only update their own products in draft status
        const vendor = await storage.getVendorByUserId(user.id);
        if (vendor && product.vendorId === vendor.id) {
          if (product.status !== "draft") {
            return res.status(403).json({ 
              message: "Can only update products in draft status" 
            });
          }
          canUpdate = true;
          // Vendors cannot change status directly
          delete updateData.status;
          delete updateData.reviewedBy;
          delete updateData.reviewedAt;
          delete updateData.reviewNotes;
        }
      }

      if (!canUpdate) {
        return res.status(403).json({ message: "Not authorized to update this product" });
      }

      // Check for duplicate SKU if changing skuNumber
      if (updateData.skuNumber && updateData.skuNumber !== product.skuNumber) {
        const existingProduct = await storage.getProductBySku(updateData.skuNumber);
        if (existingProduct) {
          return res.status(409).json({ message: "SKU number already exists" });
        }
      }

      // Validate request body
      const validation = insertProductSchema.partial().safeParse(updateData);
      if (!validation.success) {
        return res.status(400).json({ 
          message: fromZodError(validation.error).message 
        });
      }

      // Increment minor version
      const newVersion = incrementMinorVersion(product.version);

      // Track changes for audit log
      const changes = {
        before: product,
        after: { ...product, ...validation.data, version: newVersion },
      };

      // Update product
      const updatedProduct = await storage.updateProduct(productId, {
        ...validation.data,
        version: newVersion,
      });

      // Update vendor's lastSubmissionDate
      await storage.updateVendor(product.vendorId, {
        lastSubmissionDate: new Date(),
      });

      // Create audit log
      await storage.createAuditLog({
        userId: user.id,
        action: "update",
        entityType: "product",
        entityId: productId,
        description: `Product ${updatedProduct.skuNumber} updated to ${newVersion}`,
        changes: JSON.stringify(changes),
        version: newVersion,
        ipAddress: req.ip,
      });

      return res.status(200).json(updatedProduct);
    } catch (error) {
      console.error("Update product error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // POST /api/products/:id/submit - Submit product for review
  app.post("/api/products/:id/submit", async (req: Request, res: Response) => {
    try {
      // Check authentication
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const productId = req.params.id;
      const product = await storage.getProduct(productId);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Check if product is in draft status
      if (product.status !== "draft") {
        return res.status(400).json({ 
          message: "Only draft products can be submitted for review" 
        });
      }

      // Check authorization - only vendor who owns the product can submit
      if (user.role !== "vendor") {
        return res.status(403).json({ message: "Only vendors can submit products" });
      }

      const vendor = await storage.getVendorByUserId(user.id);
      if (!vendor || product.vendorId !== vendor.id) {
        return res.status(403).json({ 
          message: "Not authorized to submit this product" 
        });
      }

      // Track changes for audit log
      const submittedAt = new Date();
      const changes = {
        before: product,
        after: { ...product, status: "pending", submittedAt },
      };

      // Update product status to pending and set submittedAt
      const updatedProduct = await storage.updateProduct(productId, {
        status: "pending",
        submittedAt,
      });

      // Update vendor's lastSubmissionDate
      await storage.updateVendor(vendor.id, {
        lastSubmissionDate: new Date(),
      });

      // Create audit log
      await storage.createAuditLog({
        userId: user.id,
        action: "update",
        entityType: "product",
        entityId: productId,
        description: `Product ${product.skuNumber} submitted for review`,
        changes: JSON.stringify(changes),
        version: product.version,
        ipAddress: req.ip,
      });

      return res.status(200).json(updatedProduct);
    } catch (error) {
      console.error("Submit product error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // POST /api/products/:id/review - Approve or reject product (distributors/auditors only)
  app.post("/api/products/:id/review", async (req: Request, res: Response) => {
    try {
      // Check authentication
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Check authorization - only distributors and auditors can review
      if (user.role !== "distributor" && user.role !== "auditor") {
        return res.status(403).json({ message: "Not authorized to review products" });
      }

      const productId = req.params.id;
      const product = await storage.getProduct(productId);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Check if product is in pending status
      if (product.status !== "pending") {
        return res.status(409).json({ 
          message: "Only pending products can be reviewed" 
        });
      }

      // Validate request body
      const validation = reviewSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: fromZodError(validation.error).message 
        });
      }

      const { action, notes } = validation.data;
      const reviewedAt = new Date();

      // Prepare update data based on action
      const updateData = {
        status: action === "approve" ? "approved" : "rejected",
        reviewedAt,
        reviewedBy: user.id,
        reviewNotes: notes || null,
      };

      // Track changes for audit log
      const changes = {
        before: product,
        after: { ...product, ...updateData },
      };

      // Update product
      const updatedProduct = await storage.updateProduct(productId, updateData as any);

      // Create audit log
      await storage.createAuditLog({
        userId: user.id,
        action: action === "approve" ? "approve" : "reject",
        entityType: "product",
        entityId: productId,
        description: `Product ${product.skuNumber} ${action === "approve" ? "approved" : "rejected"} by ${user.name} (${user.role})${notes ? `: ${notes}` : ""}`,
        changes: JSON.stringify(changes),
        version: product.version,
        ipAddress: req.ip,
      });

      return res.status(200).json(updatedProduct);
    } catch (error) {
      console.error("Review product error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // GET /api/products/:id/review-history - Get review history for a product
  app.get("/api/products/:id/review-history", async (req: Request, res: Response) => {
    try {
      // Check authentication
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const productId = req.params.id;
      const product = await storage.getProduct(productId);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Check authorization
      const isDistributorOrAuditor = user.role === "distributor" || user.role === "auditor";
      
      if (!isDistributorOrAuditor) {
        // For vendors, check if they own the product
        if (user.role === "vendor") {
          const vendor = await storage.getVendorByUserId(user.id);
          if (!vendor || product.vendorId !== vendor.id) {
            return res.status(403).json({ 
              message: "Not authorized to view review history for this product" 
            });
          }
        } else {
          return res.status(403).json({ message: "Not authorized to view review history" });
        }
      }

      // Get audit logs for this product
      const auditLogs = await storage.getAuditLogsByEntity("product", productId);

      // Filter to only review-related actions (approve, reject)
      const reviewHistory = auditLogs.filter(log => 
        log.action === "approve" || log.action === "reject"
      );

      return res.status(200).json(reviewHistory);
    } catch (error) {
      console.error("Get review history error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // GET /api/products - Get all products with optional status filter
  app.get("/api/products", async (req: Request, res: Response) => {
    try {
      // Check authentication - return empty array in test mode
      if (!BYPASS_AUTH && !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      // In bypass mode with no session, return empty products for testing
      if (BYPASS_AUTH && !req.session.userId) {
        return res.status(200).json([]);
      }

      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Check authorization - only distributors and auditors can view all products
      if (user.role !== "distributor" && user.role !== "auditor" && user.role !== "admin") {
        return res.status(403).json({ message: "Not authorized to view all products" });
      }

      // Get status filter from query params
      const status = req.query.status as string | undefined;

      let products;
      if (status) {
        products = await storage.getProductsByStatus(status);
      } else {
        products = await storage.getAllProducts();
      }

      return res.status(200).json(products);
    } catch (error) {
      console.error("Get all products error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // POST /api/products/:productId/documents - Upload document to product (vendor owner only)
  app.post("/api/products/:productId/documents", upload.single('file'), async (req: Request, res: Response) => {
    try {
      // Check authentication
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const productId = req.params.productId;
      const product = await storage.getProduct(productId);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Check authorization - only vendor who owns the product can upload documents
      if (user.role !== "vendor") {
        return res.status(403).json({ message: "Only vendors can upload documents" });
      }

      const vendor = await storage.getVendorByUserId(user.id);
      if (!vendor || product.vendorId !== vendor.id) {
        return res.status(403).json({ 
          message: "Not authorized to upload documents to this product" 
        });
      }

      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const file = req.file;
      const timestamp = Date.now();
      const storageKey = `documents/${productId}/${timestamp}-${file.originalname}`;

      // Upload to object storage (private files are stored with the key prefix)
      await objectStorageClient.uploadFromBytes(storageKey, file.buffer);

      // Get version from product
      const version = product.version;

      // Create document record
      const documentData = {
        productId,
        fileName: file.originalname,
        fileSize: file.size.toString(),
        fileType: file.mimetype,
        storageKey,
        version,
        uploadedBy: user.id,
        isDigitallySigned: false,
      };

      const validation = insertDocumentSchema.safeParse(documentData);
      if (!validation.success) {
        return res.status(400).json({ 
          message: fromZodError(validation.error).message 
        });
      }

      const document = await storage.createDocument(validation.data);

      // Update product's updatedAt timestamp
      await storage.updateProduct(productId, {});

      // Create audit log
      await storage.createAuditLog({
        userId: user.id,
        action: "upload",
        entityType: "document",
        entityId: document.id,
        description: `Document ${file.originalname} uploaded for product ${product.skuNumber}`,
        version: version,
        ipAddress: req.ip,
      });

      return res.status(201).json(document);
    } catch (error: any) {
      console.error("Upload document error:", error);
      if (error.message && error.message.includes('Invalid file type')) {
        return res.status(400).json({ message: error.message });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // GET /api/products/:productId/documents - Get all documents for product
  app.get("/api/products/:productId/documents", async (req: Request, res: Response) => {
    try {
      // Check authentication
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const productId = req.params.productId;
      const product = await storage.getProduct(productId);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Check authorization
      const isDistributorOrAuditor = user.role === "distributor" || user.role === "auditor" || user.role === "admin";
      
      if (!isDistributorOrAuditor) {
        // For vendors, check if they own the product
        if (user.role === "vendor") {
          const vendor = await storage.getVendorByUserId(user.id);
          if (!vendor || product.vendorId !== vendor.id) {
            return res.status(403).json({ 
              message: "Not authorized to view documents for this product" 
            });
          }
        } else {
          return res.status(403).json({ message: "Not authorized to view documents" });
        }
      }

      const documents = await storage.getDocumentsByProduct(productId);
      return res.status(200).json(documents);
    } catch (error) {
      console.error("Get documents error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // GET /api/documents/:id/download - Download document (generates signed URL)
  app.get("/api/documents/:id/download", async (req: Request, res: Response) => {
    try {
      // Check authentication
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const documentId = req.params.id;
      const document = await storage.getDocument(documentId);

      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      const product = await storage.getProduct(document.productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Check authorization
      const isDistributorOrAuditor = user.role === "distributor" || user.role === "auditor" || user.role === "admin";
      
      if (!isDistributorOrAuditor) {
        // For vendors, check if they own the product
        if (user.role === "vendor") {
          const vendor = await storage.getVendorByUserId(user.id);
          if (!vendor || product.vendorId !== vendor.id) {
            return res.status(403).json({ 
              message: "Not authorized to download this document" 
            });
          }
        } else {
          return res.status(403).json({ message: "Not authorized to download documents" });
        }
      }

      // Download from object storage
      const fileBuffer = await objectStorageClient.downloadAsBytes(document.storageKey);

      // Set response headers for file download
      res.setHeader('Content-Type', document.fileType);
      res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);
      res.setHeader('Content-Length', document.fileSize);

      return res.send(fileBuffer);
    } catch (error) {
      console.error("Download document error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // POST /api/documents/:id/sign - Apply digital signature
  app.post("/api/documents/:id/sign", async (req: Request, res: Response) => {
    try {
      // Check authentication
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const documentId = req.params.id;
      const document = await storage.getDocument(documentId);

      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      const product = await storage.getProduct(document.productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Check authorization - vendor/distributor/auditor can sign
      const canSign = user.role === "vendor" || user.role === "distributor" || user.role === "auditor" || user.role === "admin";
      
      if (!canSign) {
        return res.status(403).json({ message: "Not authorized to sign documents" });
      }

      // For vendors, ensure they own the product
      if (user.role === "vendor") {
        const vendor = await storage.getVendorByUserId(user.id);
        if (!vendor || product.vendorId !== vendor.id) {
          return res.status(403).json({ 
            message: "Not authorized to sign documents for this product" 
          });
        }
      }

      // Download file content for signature hash
      const fileBuffer = await objectStorageClient.downloadAsBytes(document.storageKey);
      
      // Create signature hash (SHA256 of file content + timestamp + userId)
      const timestamp = new Date();
      const bufferData = Buffer.isBuffer(fileBuffer) ? fileBuffer : Buffer.from(fileBuffer as any);
      const signatureData = `${bufferData.toString('base64')}${timestamp.toISOString()}${user.id}`;
      const signatureHash = createHash('sha256').update(signatureData).digest('hex');

      // Create digital signature record
      const signatureRecord = {
        productId: product.id,
        documentId: document.id,
        signedBy: user.id,
        signatureHash,
        signatureData: JSON.stringify({
          timestamp: timestamp.toISOString(),
          userId: user.id,
          userName: user.name,
          userRole: user.role,
          documentId: document.id,
          fileName: document.fileName,
        }),
        ipAddress: req.ip,
      };

      const validation = insertDigitalSignatureSchema.safeParse(signatureRecord);
      if (!validation.success) {
        return res.status(400).json({ 
          message: fromZodError(validation.error).message 
        });
      }

      const signature = await storage.createDigitalSignature(validation.data);

      // Note: Document's signed status is tracked via the digitalSignatures relationship

      // Create audit log
      await storage.createAuditLog({
        userId: user.id,
        action: "sign",
        entityType: "document",
        entityId: document.id,
        description: `Document ${document.fileName} digitally signed by ${user.name} (${user.role})`,
        version: document.version,
        ipAddress: req.ip,
      });

      return res.status(201).json(signature);
    } catch (error) {
      console.error("Sign document error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // GET /api/audit/logs - Get all audit logs with pagination and filtering
  app.get("/api/audit/logs", async (req: Request, res: Response) => {
    try {
      // Check authentication - return empty data in test mode
      if (!BYPASS_AUTH && !req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      // In bypass mode with no session, return empty audit logs for testing
      if (BYPASS_AUTH && !req.session.userId) {
        return res.status(200).json({
          logs: [],
          total: 0,
          limit: 100,
          offset: 0
        });
      }

      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Check authorization - only auditors, distributors, and admins
      if (user.role !== "auditor" && user.role !== "distributor" && user.role !== "admin") {
        return res.status(403).json({ message: "Not authorized to view audit logs" });
      }

      // Parse query parameters
      const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
      const offset = parseInt(req.query.offset as string) || 0;
      const action = req.query.action as string | undefined;
      const entityType = req.query.entityType as string | undefined;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      // Get logs with filters
      const { logs, total } = await storage.getAllAuditLogs({
        limit,
        offset,
        action,
        entityType,
        startDate,
        endDate,
      });

      // Enrich logs with user details
      const enrichedLogs = await Promise.all(
        logs.map(async (log) => {
          const logUser = await storage.getUser(log.userId);
          return {
            ...log,
            user: logUser ? {
              name: logUser.name,
              email: logUser.email,
              role: logUser.role,
            } : null,
          };
        })
      );

      return res.status(200).json({
        logs: enrichedLogs,
        total,
        limit,
        offset,
      });
    } catch (error) {
      console.error("Get audit logs error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // GET /api/audit/logs/entity/:entityType/:entityId - Get audit logs for specific entity
  app.get("/api/audit/logs/entity/:entityType/:entityId", async (req: Request, res: Response) => {
    try {
      // Check authentication
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const { entityType, entityId } = req.params;

      // Authorization logic
      if (user.role === "vendor") {
        // Vendors can only view logs for their own entities
        if (entityType === "product") {
          const product = await storage.getProduct(entityId);
          if (!product) {
            return res.status(404).json({ message: "Product not found" });
          }
          const vendor = await storage.getVendorByUserId(user.id);
          if (!vendor || product.vendorId !== vendor.id) {
            return res.status(403).json({ message: "Not authorized to view these logs" });
          }
        } else if (entityType === "vendor") {
          const vendor = await storage.getVendorByUserId(user.id);
          if (!vendor || vendor.id !== entityId) {
            return res.status(403).json({ message: "Not authorized to view these logs" });
          }
        } else {
          return res.status(403).json({ message: "Not authorized to view these logs" });
        }
      }

      // Get logs for entity
      const logs = await storage.getAuditLogsByEntity(entityType, entityId);

      // Enrich logs with user details
      const enrichedLogs = await Promise.all(
        logs.map(async (log) => {
          const logUser = await storage.getUser(log.userId);
          return {
            ...log,
            user: logUser ? {
              name: logUser.name,
              email: logUser.email,
              role: logUser.role,
            } : null,
          };
        })
      );

      return res.status(200).json(enrichedLogs);
    } catch (error) {
      console.error("Get entity audit logs error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // GET /api/audit/logs/user/:userId - Get audit logs for specific user
  app.get("/api/audit/logs/user/:userId", async (req: Request, res: Response) => {
    try {
      // Check authentication
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const targetUserId = req.params.userId;

      // Authorization logic
      if (user.role === "vendor") {
        // Vendors can only view their own logs
        if (targetUserId !== user.id) {
          return res.status(403).json({ message: "Not authorized to view these logs" });
        }
      }

      // Get logs for user
      const logs = await storage.getAuditLogsByUser(targetUserId);

      // Enrich logs with user details
      const targetUser = await storage.getUser(targetUserId);
      const enrichedLogs = logs.map((log) => ({
        ...log,
        user: targetUser ? {
          name: targetUser.name,
          email: targetUser.email,
          role: targetUser.role,
        } : null,
      }));

      return res.status(200).json(enrichedLogs);
    } catch (error) {
      console.error("Get user audit logs error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // GET /api/audit/product/:productId - Get complete audit trail for a product
  app.get("/api/audit/product/:productId", async (req: Request, res: Response) => {
    try {
      // Check authentication
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const productId = req.params.productId;
      const product = await storage.getProduct(productId);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Authorization logic
      if (user.role === "vendor") {
        const vendor = await storage.getVendorByUserId(user.id);
        if (!vendor || product.vendorId !== vendor.id) {
          return res.status(403).json({ message: "Not authorized to view this product's audit trail" });
        }
      }

      // Get complete audit trail for product (includes product, documents, signatures)
      const logs = await storage.getAuditLogsForProduct(productId);

      // Enrich logs with user details
      const enrichedLogs = await Promise.all(
        logs.map(async (log) => {
          const logUser = await storage.getUser(log.userId);
          return {
            ...log,
            user: logUser ? {
              name: logUser.name,
              email: logUser.email,
              role: logUser.role,
            } : null,
          };
        })
      );

      return res.status(200).json(enrichedLogs);
    } catch (error) {
      console.error("Get product audit trail error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
