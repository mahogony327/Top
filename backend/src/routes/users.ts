import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../config/database';
import { authMiddleware, optionalAuthMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/users/:username - Get user profile
router.get('/:username', optionalAuthMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const user = db.prepare(`
      SELECT id, username, display_name, avatar_url, bio, is_private, created_at
      FROM users WHERE username = ?
    `).get(req.params.username) as any;

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const isOwner = req.user?.id === user.id;
    const isPrivate = user.is_private && !isOwner;

    // Get follower/following counts
    const followers = db.prepare('SELECT COUNT(*) as count FROM follows WHERE following_id = ?')
      .get(user.id) as any;
    const following = db.prepare('SELECT COUNT(*) as count FROM follows WHERE follower_id = ?')
      .get(user.id) as any;

    // Check if current user follows this user
    let isFollowing = false;
    if (req.user && !isOwner) {
      const follow = db.prepare('SELECT id FROM follows WHERE follower_id = ? AND following_id = ?')
        .get(req.user.id, user.id);
      isFollowing = Boolean(follow);
    }

    // Get public categories if not private
    let categories: any[] = [];
    if (!isPrivate) {
      categories = db.prepare(`
        SELECT c.*, 
               (SELECT COUNT(*) FROM submissions WHERE category_id = c.id) as submission_count
        FROM categories c
        WHERE c.user_id = ? AND (c.is_private = 0 OR ? = 1)
        ORDER BY c.created_at DESC
        LIMIT 20
      `).all(user.id, isOwner ? 1 : 0) as any[];
    }

    res.json({
      id: user.id,
      username: user.username,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
      bio: isPrivate ? null : user.bio,
      isPrivate: user.is_private,
      createdAt: user.created_at,
      isOwner,
      isFollowing,
      stats: {
        followers: followers.count,
        following: following.count,
        categories: isPrivate ? 0 : categories.length
      },
      categories: isPrivate ? [] : categories.map(c => ({
        id: c.id,
        name: c.name,
        description: c.description,
        icon: c.icon,
        color: c.color,
        submissionCount: c.submission_count,
        createdAt: c.created_at
      }))
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// POST /api/users/:username/follow - Follow user
router.post('/:username/follow', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const targetUser = db.prepare('SELECT id, username FROM users WHERE username = ?')
      .get(req.params.username) as any;

    if (!targetUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (targetUser.id === req.user!.id) {
      res.status(400).json({ error: 'Cannot follow yourself' });
      return;
    }

    // Check if already following
    const existingFollow = db.prepare('SELECT id FROM follows WHERE follower_id = ? AND following_id = ?')
      .get(req.user!.id, targetUser.id);

    if (existingFollow) {
      res.status(400).json({ error: 'Already following this user' });
      return;
    }

    db.prepare('INSERT INTO follows (id, follower_id, following_id) VALUES (?, ?, ?)')
      .run(uuidv4(), req.user!.id, targetUser.id);

    res.json({ message: 'Following successfully' });
  } catch (error) {
    console.error('Follow error:', error);
    res.status(500).json({ error: 'Failed to follow user' });
  }
});

// DELETE /api/users/:username/follow - Unfollow user
router.delete('/:username/follow', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const targetUser = db.prepare('SELECT id FROM users WHERE username = ?')
      .get(req.params.username) as any;

    if (!targetUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const result = db.prepare('DELETE FROM follows WHERE follower_id = ? AND following_id = ?')
      .run(req.user!.id, targetUser.id);

    if (result.changes === 0) {
      res.status(400).json({ error: 'Not following this user' });
      return;
    }

    res.json({ message: 'Unfollowed successfully' });
  } catch (error) {
    console.error('Unfollow error:', error);
    res.status(500).json({ error: 'Failed to unfollow user' });
  }
});

// GET /api/users/:username/followers - Get followers
router.get('/:username/followers', optionalAuthMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const user = db.prepare('SELECT id, is_private FROM users WHERE username = ?')
      .get(req.params.username) as any;

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const isOwner = req.user?.id === user.id;
    if (user.is_private && !isOwner) {
      res.status(403).json({ error: 'This user\'s followers are private' });
      return;
    }

    const followers = db.prepare(`
      SELECT u.id, u.username, u.display_name, u.avatar_url
      FROM follows f
      JOIN users u ON f.follower_id = u.id
      WHERE f.following_id = ?
      ORDER BY f.created_at DESC
      LIMIT 100
    `).all(user.id) as any[];

    res.json(followers.map(f => ({
      id: f.id,
      username: f.username,
      displayName: f.display_name,
      avatarUrl: f.avatar_url
    })));
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({ error: 'Failed to get followers' });
  }
});

// GET /api/users/:username/following - Get following
router.get('/:username/following', optionalAuthMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const db = getDb();
    const user = db.prepare('SELECT id, is_private FROM users WHERE username = ?')
      .get(req.params.username) as any;

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const isOwner = req.user?.id === user.id;
    if (user.is_private && !isOwner) {
      res.status(403).json({ error: 'This user\'s following list is private' });
      return;
    }

    const following = db.prepare(`
      SELECT u.id, u.username, u.display_name, u.avatar_url
      FROM follows f
      JOIN users u ON f.following_id = u.id
      WHERE f.follower_id = ?
      ORDER BY f.created_at DESC
      LIMIT 100
    `).all(user.id) as any[];

    res.json(following.map(f => ({
      id: f.id,
      username: f.username,
      displayName: f.display_name,
      avatarUrl: f.avatar_url
    })));
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({ error: 'Failed to get following' });
  }
});

// GET /api/users/search?q=query - Search users
router.get('/', (req: AuthRequest, res: Response) => {
  try {
    const query = req.query.q as string;
    if (!query || query.length < 2) {
      res.status(400).json({ error: 'Search query must be at least 2 characters' });
      return;
    }

    const db = getDb();
    const users = db.prepare(`
      SELECT id, username, display_name, avatar_url
      FROM users
      WHERE (username LIKE ? OR display_name LIKE ?) AND is_private = 0
      LIMIT 20
    `).all(`%${query}%`, `%${query}%`) as any[];

    res.json(users.map(u => ({
      id: u.id,
      username: u.username,
      displayName: u.display_name,
      avatarUrl: u.avatar_url
    })));
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

export default router;
