import type { D1Database, R2Bucket } from '@cloudflare/workers-types';
import bcrypt from 'bcryptjs';

export class PhotoDB {
  constructor(
    private db: D1Database,
    private photos: R2Bucket
  ) {}

  // ========== Users ==========
  async createUser(email: string, password: string, name: string) {
    const id = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(password, 10);

    await this.db
      .prepare(`INSERT INTO users (id, email, name, password_hash) VALUES (?, ?, ?, ?)`)
      .bind(id, email, name, passwordHash)
      .run();

    return { id, email, name };
  }

  async authenticateUser(email: string, password: string) {
    const user = await this.db
      .prepare(`SELECT * FROM users WHERE email = ?`)
      .bind(email)
      .first<{
        id: string;
        email: string;
        name: string;
        password_hash: string;
      }>();

    if (!user) return null;

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }

  async getUserById(id: string) {
    return this.db
      .prepare(`SELECT id, email, name, is_admin FROM users WHERE id = ?`)
      .bind(id)
      .first<{ id: string; email: string; name: string; is_admin: number }>();
  }

  // ========== Photos ==========
  async getAvailablePhotos(limit?: number, offset?: number) {
    let query = `SELECT * FROM photos WHERE available = 1 ORDER BY created_at DESC`;
    
    if (limit !== undefined) {
      query += ` LIMIT ${limit}`;
      if (offset !== undefined) {
        query += ` OFFSET ${offset}`;
      }
    }
    
    const { results } = await this.db
      .prepare(query)
      .all<{
        id: string;
        name: string;
        description: string | null;
        r2_key: string;
        thumbnail_key: string | null;
        available: number;
      }>();
    return results;
  }

  async getAvailablePhotosCount() {
    const result = await this.db
      .prepare(`SELECT COUNT(*) as total FROM photos WHERE available = 1`)
      .first<{ total: number }>();
    return result?.total || 0;
  }

  async getPhotoById(id: string) {
    return this.db
      .prepare(`SELECT * FROM photos WHERE id = ?`)
      .bind(id)
      .first<{
        id: string;
        name: string;
        description: string | null;
        r2_key: string;
        thumbnail_key: string | null;
        available: number;
      }>();
  }

  async getPhotoUrl(r2Key: string): Promise<string | null> {
    const object = await this.photos.get(r2Key);
    if (!object) return null;
    
    // Generate a signed URL that expires in 1 hour
    // Note: For production, you might want to use Cloudflare Images or R2 public buckets
    return `https://your-bucket.r2.dev/${r2Key}`;
  }

  // ========== Orders ==========
  async createOrder(userId: string, orderNumber: string) {
    const id = crypto.randomUUID();

    await this.db
      .prepare(`INSERT INTO orders (id, user_id, order_number, status) VALUES (?, ?, ?, 'pending')`)
      .bind(id, userId, orderNumber)
      .run();

    return { id, orderNumber };
  }

  async addOrderItems(
    orderId: string,
    items: Array<{
      photoId: string;
      photoName: string;
      quantity: number;
    }>
  ) {
    const batch = items.map((item) =>
      this.db
        .prepare(
          `INSERT INTO order_items (id, order_id, photo_id, photo_name, quantity) VALUES (?, ?, ?, ?, ?)`
        )
        .bind(crypto.randomUUID(), orderId, item.photoId, item.photoName, item.quantity)
    );

    await this.db.batch(batch);
  }

  async getOrderById(orderId: string) {
    const order = await this.db
      .prepare(
        `SELECT o.*, u.email, u.name as user_name FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = ?`
      )
      .bind(orderId)
      .first();

    if (!order) return null;

    const { results: items } = await this.db
      .prepare(`SELECT * FROM order_items WHERE order_id = ?`)
      .bind(orderId)
      .all();

    return { ...order, items };
  }

  async getUserOrders(userId: string) {
    const { results } = await this.db
      .prepare(`SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC`)
      .bind(userId)
      .all();
    return results;
  }
}
