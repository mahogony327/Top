import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { getDb } from '../config/database';
import { authMiddleware, optionalAuthMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Validation schemas
const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  icon: z.string().max(50).optional(),
  color: z.string().max(20).optional(),
  isPrivate: z.boolean().optional(),
  parentId: z.string().uuid().optional(),
  maxItems: z.number().int().min(1).max(100).optional()
});

// GET /api/categories - List user's categories
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const categories = await db.prepare(`
      SELECT c.*, 
             (SELECT COUNT(*) FROM submissions WHERE category_id = c.id AND deleted_at IS NULL) as submission_count,
             pc.name as parent_name
      FROM categories c
      LEFT JOIN categories pc ON c.parent_id = pc.id
      WHERE c.user_id = ?
      ORDER BY c.created_at DESC
    `).all(req.user!.id) as any[];

    res.json(categories.map(c => ({
      id: c.id,
      name: c.name,
      description: c.description,
      icon: c.icon,
      color: c.color,
      isPrivate: Boolean(c.is_private),
      parentId: c.parent_id,
      parentName: c.parent_name,
      maxItems: c.max_items,
      submissionCount: c.submission_count,
      createdAt: c.created_at,
      updatedAt: c.updated_at
    })));
  } catch (error) {
    console.error('List categories error:', error);
    res.status(500).json({ error: 'Failed to list categories' });
  }
});

// POST /api/categories - Create category
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const validation = createCategorySchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: 'Invalid input', details: validation.error.errors });
      return;
    }

    const { name, description, icon, color, isPrivate, parentId, maxItems } = validation.data;
    const db = getDb();

    // Validate parent exists and belongs to user
    if (parentId) {
      const parent = await db.prepare('SELECT id FROM categories WHERE id = ? AND user_id = ?')
        .get(parentId, req.user!.id);
      if (!parent) {
        res.status(400).json({ error: 'Parent category not found' });
        return;
      }
    }

    const categoryId = uuidv4();
    await db.prepare(`
      INSERT INTO categories (id, user_id, name, description, icon, color, is_private, parent_id, max_items)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(categoryId, req.user!.id, name, description || null, icon || null, color || null, 
           isPrivate ? 1 : 0, parentId || null, maxItems || 10);

    res.status(201).json({
      id: categoryId,
      name,
      description: description || null,
      icon: icon || null,
      color: color || null,
      isPrivate: Boolean(isPrivate),
      parentId: parentId || null,
      maxItems: maxItems || 10,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// GET /api/categories/:id - Get category with submissions
router.get('/:id', optionalAuthMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const category = await db.prepare(`
      SELECT c.*, u.username, u.display_name as user_display_name
      FROM categories c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `).get(req.params.id) as any;

    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    // Check privacy
    const isOwner = req.user?.id === category.user_id;
    if (category.is_private && !isOwner) {
      res.status(403).json({ error: 'This category is private' });
      return;
    }

    // Get submissions (excluding deleted)
    const submissions = await db.prepare(`
      SELECT s.*, 
             (SELECT COUNT(*) FROM likes WHERE submission_id = s.id) as like_count
      FROM submissions s
      WHERE s.category_id = ? AND s.deleted_at IS NULL
      ORDER BY s.rank ASC
    `).all(category.id) as any[];

    res.json({
      id: category.id,
      name: category.name,
      description: category.description,
      icon: category.icon,
      color: category.color,
      isPrivate: Boolean(category.is_private),
      maxItems: category.max_items,
      parentId: category.parent_id,
      createdAt: category.created_at,
      updatedAt: category.updated_at,
      user: {
        id: category.user_id,
        username: category.username,
        displayName: category.user_display_name
      },
      isOwner,
      submissions: submissions.map(s => ({
        id: s.id,
        title: s.title,
        description: s.description,
        imageUrl: s.image_url,
        externalId: s.external_id,
        externalType: s.external_type,
        rank: s.rank,
        notes: isOwner ? s.notes : null,
        isPrivate: Boolean(s.is_private),
        likeCount: s.like_count,
        createdAt: s.created_at
      }))
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ error: 'Failed to get category' });
  }
});

// PUT /api/categories/:id - Update category
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const category = await db.prepare('SELECT * FROM categories WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.user!.id) as any;

    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    const updateSchema = z.object({
      name: z.string().min(1).max(100).optional(),
      description: z.string().max(500).optional(),
      icon: z.string().max(50).optional(),
      color: z.string().max(20).optional(),
      isPrivate: z.boolean().optional(),
      maxItems: z.number().int().min(1).max(100).optional()
    });

    const validation = updateSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: 'Invalid input', details: validation.error.errors });
      return;
    }

    const updates = validation.data;
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }
    if (updates.icon !== undefined) {
      fields.push('icon = ?');
      values.push(updates.icon);
    }
    if (updates.color !== undefined) {
      fields.push('color = ?');
      values.push(updates.color);
    }
    if (updates.isPrivate !== undefined) {
      fields.push('is_private = ?');
      values.push(updates.isPrivate ? 1 : 0);
    }
    if (updates.maxItems !== undefined) {
      fields.push('max_items = ?');
      values.push(updates.maxItems);
    }

    if (fields.length > 0) {
      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(req.params.id);
      
      await db.prepare(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    }

    res.json({ message: 'Category updated successfully' });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// DELETE /api/categories/:id - Delete category
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const category = await db.prepare('SELECT id FROM categories WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.user!.id);

    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    // Delete submissions first (cascade)
    await db.prepare('DELETE FROM submissions WHERE category_id = ?').run(req.params.id);
    await db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

export default router;
