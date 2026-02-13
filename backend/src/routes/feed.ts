import { Router, Response } from 'express';
import { getDb } from '../config/database';
import { optionalAuthMiddleware, authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/feed/trending - Get trending submissions
router.get('/trending', optionalAuthMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const period = req.query.period as string || 'week';
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    let dateFilter: string;
    switch (period) {
      case 'day':
        dateFilter = "datetime('now', '-1 day')";
        break;
      case 'month':
        dateFilter = "datetime('now', '-30 days')";
        break;
      case 'year':
        dateFilter = "datetime('now', '-365 days')";
        break;
      default: // week
        dateFilter = "datetime('now', '-7 days')";
    }

    const db = getDb();
    
    // Get submissions with most likes in the period
    const trending = db.prepare(`
      SELECT 
        s.id, s.title, s.description, s.image_url, s.created_at,
        c.id as category_id, c.name as category_name,
        u.id as user_id, u.username, u.display_name, u.avatar_url,
        COUNT(l.id) as like_count
      FROM submissions s
      JOIN categories c ON s.category_id = c.id
      JOIN users u ON c.user_id = u.id
      LEFT JOIN likes l ON s.id = l.submission_id AND l.created_at > ${dateFilter}
      WHERE c.is_private = 0
      GROUP BY s.id
      ORDER BY like_count DESC, s.created_at DESC
      LIMIT ?
    `).all(limit) as any[];

    res.json(trending.map(t => ({
      id: t.id,
      title: t.title,
      description: t.description,
      imageUrl: t.image_url,
      likeCount: t.like_count,
      createdAt: t.created_at,
      category: {
        id: t.category_id,
        name: t.category_name
      },
      user: {
        id: t.user_id,
        username: t.username,
        displayName: t.display_name,
        avatarUrl: t.avatar_url
      }
    })));
  } catch (error) {
    console.error('Trending error:', error);
    res.status(500).json({ error: 'Failed to get trending' });
  }
});

// GET /api/feed/following - Get feed from followed users
router.get('/following', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    const db = getDb();
    
    const feed = db.prepare(`
      SELECT 
        s.id, s.title, s.description, s.image_url, s.rank, s.created_at,
        c.id as category_id, c.name as category_name,
        u.id as user_id, u.username, u.display_name, u.avatar_url,
        (SELECT COUNT(*) FROM likes WHERE submission_id = s.id) as like_count
      FROM submissions s
      JOIN categories c ON s.category_id = c.id
      JOIN users u ON c.user_id = u.id
      JOIN follows f ON f.following_id = u.id
      WHERE f.follower_id = ? AND c.is_private = 0
      ORDER BY s.created_at DESC
      LIMIT ? OFFSET ?
    `).all(req.user!.id, limit, offset) as any[];

    res.json(feed.map(f => ({
      id: f.id,
      title: f.title,
      description: f.description,
      imageUrl: f.image_url,
      rank: f.rank,
      likeCount: f.like_count,
      createdAt: f.created_at,
      category: {
        id: f.category_id,
        name: f.category_name
      },
      user: {
        id: f.user_id,
        username: f.username,
        displayName: f.display_name,
        avatarUrl: f.avatar_url
      }
    })));
  } catch (error) {
    console.error('Feed error:', error);
    res.status(500).json({ error: 'Failed to get feed' });
  }
});

// GET /api/feed/discover - Discover new categories
router.get('/discover', optionalAuthMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    const db = getDb();
    
    // Get popular public categories
    const categories = db.prepare(`
      SELECT 
        c.id, c.name, c.description, c.icon, c.color, c.created_at,
        u.id as user_id, u.username, u.display_name, u.avatar_url,
        COUNT(DISTINCT s.id) as submission_count,
        (SELECT COUNT(*) FROM likes l JOIN submissions s2 ON l.submission_id = s2.id WHERE s2.category_id = c.id) as total_likes
      FROM categories c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN submissions s ON s.category_id = c.id
      WHERE c.is_private = 0
      GROUP BY c.id
      HAVING submission_count > 0
      ORDER BY total_likes DESC, c.created_at DESC
      LIMIT ?
    `).all(limit) as any[];

    res.json(categories.map(c => ({
      id: c.id,
      name: c.name,
      description: c.description,
      icon: c.icon,
      color: c.color,
      submissionCount: c.submission_count,
      totalLikes: c.total_likes,
      createdAt: c.created_at,
      user: {
        id: c.user_id,
        username: c.username,
        displayName: c.display_name,
        avatarUrl: c.avatar_url
      }
    })));
  } catch (error) {
    console.error('Discover error:', error);
    res.status(500).json({ error: 'Failed to discover categories' });
  }
});

// GET /api/feed/search - Search submissions and categories
router.get('/search', optionalAuthMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const query = req.query.q as string;
    const type = req.query.type as string || 'all';
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    if (!query || query.length < 2) {
      res.status(400).json({ error: 'Search query must be at least 2 characters' });
      return;
    }

    const db = getDb();
    const results: any = {};

    if (type === 'all' || type === 'submissions') {
      const submissions = db.prepare(`
        SELECT 
          s.id, s.title, s.description, s.image_url, s.rank,
          c.id as category_id, c.name as category_name,
          u.username
        FROM submissions s
        JOIN categories c ON s.category_id = c.id
        JOIN users u ON c.user_id = u.id
        WHERE c.is_private = 0 AND (s.title LIKE ? OR s.description LIKE ?)
        ORDER BY s.created_at DESC
        LIMIT ?
      `).all(`%${query}%`, `%${query}%`, limit) as any[];

      results.submissions = submissions.map(s => ({
        id: s.id,
        title: s.title,
        description: s.description,
        imageUrl: s.image_url,
        rank: s.rank,
        categoryId: s.category_id,
        categoryName: s.category_name,
        username: s.username
      }));
    }

    if (type === 'all' || type === 'categories') {
      const categories = db.prepare(`
        SELECT 
          c.id, c.name, c.description, c.icon, c.color,
          u.username,
          (SELECT COUNT(*) FROM submissions WHERE category_id = c.id) as submission_count
        FROM categories c
        JOIN users u ON c.user_id = u.id
        WHERE c.is_private = 0 AND (c.name LIKE ? OR c.description LIKE ?)
        ORDER BY c.created_at DESC
        LIMIT ?
      `).all(`%${query}%`, `%${query}%`, limit) as any[];

      results.categories = categories.map(c => ({
        id: c.id,
        name: c.name,
        description: c.description,
        icon: c.icon,
        color: c.color,
        username: c.username,
        submissionCount: c.submission_count
      }));
    }

    res.json(results);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Failed to search' });
  }
});

export default router;
