import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { getDb } from '../config/database';
import { authMiddleware, optionalAuthMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Validation schemas
const createSubmissionSchema = z.object({
  categoryId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  imageUrl: z.string().url().optional(),
  externalId: z.string().max(100).optional(),
  externalType: z.string().max(50).optional(),
  notes: z.string().max(2000).optional(),
  rank: z.number().int().min(1).optional(),
  isPrivate: z.boolean().optional()
});

const reorderSchema = z.object({
  submissions: z.array(z.object({
    id: z.string().uuid(),
    rank: z.number().int().min(1)
  }))
});

// POST /api/submissions - Create submission
router.post('/', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const validation = createSubmissionSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: 'Invalid input', details: validation.error.errors });
      return;
    }

    const { categoryId, title, description, imageUrl, externalId, externalType, notes, rank, isPrivate } = validation.data;
    const db = getDb();

    // Verify category ownership
    const category = await db.prepare('SELECT id, max_items FROM categories WHERE id = ? AND user_id = ?')
      .get(categoryId, req.user!.id) as any;

    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    // Check max items
    const currentCount = await db.prepare('SELECT COUNT(*) as count FROM submissions WHERE category_id = ?')
      .get(categoryId) as any;
    
    if (currentCount.count >= category.max_items) {
      res.status(400).json({ error: `Category is full (max ${category.max_items} items)` });
      return;
    }

    // Calculate rank if not provided
    let finalRank = rank;
    if (!finalRank) {
      const maxRank = await db.prepare('SELECT MAX(rank) as max FROM submissions WHERE category_id = ?')
        .get(categoryId) as any;
      finalRank = (maxRank.max || 0) + 1;
    } else {
      // Shift existing ranks if inserting
      await db.prepare('UPDATE submissions SET rank = rank + 1 WHERE category_id = ? AND rank >= ?')
        .run(categoryId, finalRank);
    }

    const submissionId = uuidv4();
    await db.prepare(`
      INSERT INTO submissions (id, category_id, title, description, image_url, external_id, external_type, notes, rank, is_private)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(submissionId, categoryId, title, description || null, imageUrl || null, 
           externalId || null, externalType || null, notes || null, finalRank, isPrivate ? 1 : 0);

    res.status(201).json({
      id: submissionId,
      categoryId,
      title,
      description: description || null,
      imageUrl: imageUrl || null,
      externalId: externalId || null,
      externalType: externalType || null,
      notes: notes || null,
      rank: finalRank,
      isPrivate: Boolean(isPrivate),
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Create submission error:', error);
    res.status(500).json({ error: 'Failed to create submission' });
  }
});

// GET /api/submissions/:id - Get submission details
router.get('/:id', optionalAuthMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const submission = await db.prepare(`
      SELECT s.*, c.is_private, c.user_id as category_owner_id, c.name as category_name
      FROM submissions s
      JOIN categories c ON s.category_id = c.id
      WHERE s.id = ?
    `).get(req.params.id) as any;

    if (!submission) {
      res.status(404).json({ error: 'Submission not found' });
      return;
    }

    const isOwner = req.user?.id === submission.category_owner_id;
    if (submission.is_private && !isOwner) {
      res.status(403).json({ error: 'This submission is private' });
      return;
    }

    // Get like count and user's like status
    const likeCount = await db.prepare('SELECT COUNT(*) as count FROM likes WHERE submission_id = ?')
      .get(submission.id) as any;
    
    let isLiked = false;
    if (req.user) {
      const userLike = await db.prepare('SELECT id FROM likes WHERE submission_id = ? AND user_id = ?')
        .get(submission.id, req.user.id);
      isLiked = Boolean(userLike);
    }

    // Get comments
    const comments = await db.prepare(`
      SELECT c.*, u.username, u.display_name, u.avatar_url
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.submission_id = ?
      ORDER BY c.created_at DESC
      LIMIT 50
    `).all(submission.id) as any[];

    res.json({
      id: submission.id,
      categoryId: submission.category_id,
      categoryName: submission.category_name,
      title: submission.title,
      description: submission.description,
      imageUrl: submission.image_url,
      externalId: submission.external_id,
      externalType: submission.external_type,
      notes: isOwner ? submission.notes : null,
      rank: submission.rank,
      likeCount: likeCount.count,
      isLiked,
      isOwner,
      createdAt: submission.created_at,
      updatedAt: submission.updated_at,
      comments: comments.map(c => ({
        id: c.id,
        content: c.content,
        createdAt: c.created_at,
        user: {
          id: c.user_id,
          username: c.username,
          displayName: c.display_name,
          avatarUrl: c.avatar_url
        }
      }))
    });
  } catch (error) {
    console.error('Get submission error:', error);
    res.status(500).json({ error: 'Failed to get submission' });
  }
});

// PUT /api/submissions/:id - Update submission
router.put('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const submission = await db.prepare(`
      SELECT s.*, c.user_id as owner_id
      FROM submissions s
      JOIN categories c ON s.category_id = c.id
      WHERE s.id = ?
    `).get(req.params.id) as any;

    if (!submission || submission.owner_id !== req.user!.id) {
      res.status(404).json({ error: 'Submission not found' });
      return;
    }

    const updateSchema = z.object({
      title: z.string().min(1).max(200).optional(),
      description: z.string().max(1000).optional(),
      imageUrl: z.string().url().optional(),
      notes: z.string().max(2000).optional(),
      isPrivate: z.boolean().optional()
    });

    const validation = updateSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: 'Invalid input', details: validation.error.errors });
      return;
    }

    const updates = validation.data;
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.title !== undefined) {
      fields.push('title = ?');
      values.push(updates.title);
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }
    if (updates.imageUrl !== undefined) {
      fields.push('image_url = ?');
      values.push(updates.imageUrl);
    }
    if (updates.notes !== undefined) {
      fields.push('notes = ?');
      values.push(updates.notes);
    }
    if (updates.isPrivate !== undefined) {
      fields.push('is_private = ?');
      values.push(updates.isPrivate ? 1 : 0);
    }

    if (fields.length > 0) {
      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(req.params.id);
      
      await db.prepare(`UPDATE submissions SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    }

    res.json({ message: 'Submission updated successfully' });
  } catch (error) {
    console.error('Update submission error:', error);
    res.status(500).json({ error: 'Failed to update submission' });
  }
});

// DELETE /api/submissions/:id - Soft delete submission
router.delete('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const submission = await db.prepare(`
      SELECT s.*, c.user_id as owner_id
      FROM submissions s
      JOIN categories c ON s.category_id = c.id
      WHERE s.id = ? AND s.deleted_at IS NULL
    `).get(req.params.id) as any;

    if (!submission || submission.owner_id !== req.user!.id) {
      res.status(404).json({ error: 'Submission not found' });
      return;
    }

    // Soft delete and re-order ranks
    await db.prepare(`UPDATE submissions SET deleted_at = datetime('now') WHERE id = ?`).run(req.params.id);
    await db.prepare(`
      UPDATE submissions 
      SET rank = rank - 1 
      WHERE category_id = ? AND rank > ? AND deleted_at IS NULL
    `).run(submission.category_id, submission.rank);

    res.json({ message: 'Submission moved to trash' });
  } catch (error) {
    console.error('Delete submission error:', error);
    res.status(500).json({ error: 'Failed to delete submission' });
  }
});

// GET /api/submissions/deleted - Get recently deleted submissions
router.get('/deleted/list', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const deleted = await db.prepare(`
      SELECT s.*, c.name as category_name, c.icon as category_icon
      FROM submissions s
      JOIN categories c ON s.category_id = c.id
      WHERE c.user_id = ? AND s.deleted_at IS NOT NULL
      ORDER BY s.deleted_at DESC
      LIMIT 50
    `).all(req.user!.id) as any[];

    res.json(deleted.map(s => ({
      id: s.id,
      title: s.title,
      description: s.description,
      categoryId: s.category_id,
      categoryName: s.category_name,
      categoryIcon: s.category_icon,
      deletedAt: s.deleted_at
    })));
  } catch (error) {
    console.error('Get deleted error:', error);
    res.status(500).json({ error: 'Failed to get deleted submissions' });
  }
});

// POST /api/submissions/:id/restore - Restore deleted submission
router.post('/:id/restore', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const submission = await db.prepare(`
      SELECT s.*, c.user_id as owner_id, c.max_items
      FROM submissions s
      JOIN categories c ON s.category_id = c.id
      WHERE s.id = ? AND s.deleted_at IS NOT NULL
    `).get(req.params.id) as any;

    if (!submission || submission.owner_id !== req.user!.id) {
      res.status(404).json({ error: 'Deleted submission not found' });
      return;
    }

    // Check if category is full
    const currentCount = await db.prepare(
      'SELECT COUNT(*) as count FROM submissions WHERE category_id = ? AND deleted_at IS NULL'
    ).get(submission.category_id) as any;

    if (currentCount.count >= submission.max_items) {
      res.status(400).json({ error: 'Category is full. Remove an item first.' });
      return;
    }

    // Get new rank (add to end)
    const maxRank = await db.prepare(
      'SELECT MAX(rank) as max FROM submissions WHERE category_id = ? AND deleted_at IS NULL'
    ).get(submission.category_id) as any;
    const newRank = (maxRank.max || 0) + 1;

    // Restore submission
    await db.prepare(`
      UPDATE submissions SET deleted_at = NULL, rank = ? WHERE id = ?
    `).run(newRank, req.params.id);

    res.json({ message: 'Submission restored', newRank });
  } catch (error) {
    console.error('Restore error:', error);
    res.status(500).json({ error: 'Failed to restore submission' });
  }
});

// DELETE /api/submissions/:id/permanent - Permanently delete
router.delete('/:id/permanent', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const submission = await db.prepare(`
      SELECT s.*, c.user_id as owner_id
      FROM submissions s
      JOIN categories c ON s.category_id = c.id
      WHERE s.id = ? AND s.deleted_at IS NOT NULL
    `).get(req.params.id) as any;

    if (!submission || submission.owner_id !== req.user!.id) {
      res.status(404).json({ error: 'Deleted submission not found' });
      return;
    }

    await db.prepare('DELETE FROM submissions WHERE id = ?').run(req.params.id);
    res.json({ message: 'Permanently deleted' });
  } catch (error) {
    console.error('Permanent delete error:', error);
    res.status(500).json({ error: 'Failed to permanently delete' });
  }
});

// POST /api/submissions/reorder - Reorder submissions in a category
router.post('/reorder', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const validation = reorderSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: 'Invalid input', details: validation.error.errors });
      return;
    }

    const { submissions } = validation.data;
    const db = getDb();

    // Verify all submissions belong to user's categories
    for (const sub of submissions) {
      const existing = await db.prepare(`
        SELECT s.id FROM submissions s
        JOIN categories c ON s.category_id = c.id
        WHERE s.id = ? AND c.user_id = ?
      `).get(sub.id, req.user!.id);

      if (!existing) {
        res.status(403).json({ error: 'Unauthorized to reorder this submission' });
        return;
      }
    }

    // Update ranks in transaction
    const updateStmt = await db.prepare('UPDATE submissions SET rank = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    const updateMany = db.transaction((items: { id: string; rank: number }[]) => {
      for (const item of items) {
        updateStmt.run(item.rank, item.id);
      }
    });
    updateMany(submissions);

    res.json({ message: 'Submissions reordered successfully' });
  } catch (error) {
    console.error('Reorder submissions error:', error);
    res.status(500).json({ error: 'Failed to reorder submissions' });
  }
});

// POST /api/submissions/:id/like - Like a submission
router.post('/:id/like', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    
    // Verify submission exists and is accessible
    const submission = await db.prepare(`
      SELECT s.id, c.is_private, c.user_id
      FROM submissions s
      JOIN categories c ON s.category_id = c.id
      WHERE s.id = ?
    `).get(req.params.id) as any;

    if (!submission) {
      res.status(404).json({ error: 'Submission not found' });
      return;
    }

    if (submission.is_private && submission.user_id !== req.user!.id) {
      res.status(403).json({ error: 'Cannot like private submission' });
      return;
    }

    // Check if already liked
    const existingLike = await db.prepare('SELECT id FROM likes WHERE submission_id = ? AND user_id = ?')
      .get(req.params.id, req.user!.id);

    if (existingLike) {
      res.status(400).json({ error: 'Already liked' });
      return;
    }

    await db.prepare('INSERT INTO likes (id, submission_id, user_id) VALUES (?, ?, ?)')
      .run(uuidv4(), req.params.id, req.user!.id);

    res.json({ message: 'Liked successfully' });
  } catch (error) {
    console.error('Like error:', error);
    res.status(500).json({ error: 'Failed to like submission' });
  }
});

// DELETE /api/submissions/:id/like - Unlike a submission
router.delete('/:id/like', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const result = await db.prepare('DELETE FROM likes WHERE submission_id = ? AND user_id = ?')
      .run(req.params.id, req.user!.id);

    if (result.changes === 0) {
      res.status(400).json({ error: 'Not liked' });
      return;
    }

    res.json({ message: 'Unliked successfully' });
  } catch (error) {
    console.error('Unlike error:', error);
    res.status(500).json({ error: 'Failed to unlike submission' });
  }
});

// POST /api/submissions/:id/comments - Add comment
router.post('/:id/comments', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const commentSchema = z.object({
      content: z.string().min(1).max(1000)
    });

    const validation = commentSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: 'Invalid input' });
      return;
    }

    const db = getDb();
    
    // Verify submission exists and is accessible
    const submission = await db.prepare(`
      SELECT s.id, c.is_private, c.user_id
      FROM submissions s
      JOIN categories c ON s.category_id = c.id
      WHERE s.id = ?
    `).get(req.params.id) as any;

    if (!submission) {
      res.status(404).json({ error: 'Submission not found' });
      return;
    }

    if (submission.is_private && submission.user_id !== req.user!.id) {
      res.status(403).json({ error: 'Cannot comment on private submission' });
      return;
    }

    const commentId = uuidv4();
    await db.prepare('INSERT INTO comments (id, submission_id, user_id, content) VALUES (?, ?, ?, ?)')
      .run(commentId, req.params.id, req.user!.id, validation.data.content);

    res.status(201).json({
      id: commentId,
      content: validation.data.content,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

export default router;
