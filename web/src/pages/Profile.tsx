import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usersApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  isPrivate: boolean;
  isOwner: boolean;
  isFollowing: boolean;
  stats: {
    followers: number;
    following: number;
    categories: number;
  };
  categories: Array<{
    id: string;
    name: string;
    description: string | null;
    icon: string | null;
    submissionCount: number;
  }>;
}

export default function Profile() {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [username]);

  const loadProfile = async () => {
    try {
      const response = await usersApi.getProfile(username!);
      setProfile(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'User not found');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!profile) return;
    setIsFollowLoading(true);

    try {
      if (profile.isFollowing) {
        await usersApi.unfollow(profile.username);
        setProfile({
          ...profile,
          isFollowing: false,
          stats: { ...profile.stats, followers: profile.stats.followers - 1 }
        });
      } else {
        await usersApi.follow(profile.username);
        setProfile({
          ...profile,
          isFollowing: true,
          stats: { ...profile.stats, followers: profile.stats.followers + 1 }
        });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed');
    } finally {
      setIsFollowLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">User not found</h2>
      </div>
    );
  }

  return (
    <div>
      {/* Profile Header */}
      <div className="card p-6 mb-8">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-3xl text-primary-600 dark:text-primary-400 font-bold">
                {profile.displayName?.[0]?.toUpperCase() || profile.username[0].toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold">{profile.displayName}</h1>
              {profile.isPrivate && (
                <span className="text-gray-400" title="Private account">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
              )}
            </div>
            <p className="text-gray-500 dark:text-gray-400 mb-3">@{profile.username}</p>
            {profile.bio && <p className="text-gray-600 dark:text-gray-300 mb-4">{profile.bio}</p>}
            <div className="flex gap-6 text-sm">
              <span><strong>{profile.stats.followers}</strong> followers</span>
              <span><strong>{profile.stats.following}</strong> following</span>
              <span><strong>{profile.stats.categories}</strong> rankings</span>
            </div>
          </div>
          {!profile.isOwner && (
            <button
              onClick={handleFollowToggle}
              disabled={isFollowLoading}
              className={profile.isFollowing ? 'btn-secondary' : 'btn-primary'}
            >
              {isFollowLoading ? '...' : profile.isFollowing ? 'Following' : 'Follow'}
            </button>
          )}
          {profile.isOwner && (
            <Link to="/settings" className="btn-secondary">Edit Profile</Link>
          )}
        </div>
      </div>

      {/* Categories */}
      <h2 className="text-xl font-bold mb-4">Rankings</h2>
      {profile.categories.length === 0 ? (
        <div className="card p-8 text-center text-gray-500">
          {profile.isPrivate && !profile.isOwner 
            ? "This user's rankings are private" 
            : "No public rankings yet"}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {profile.categories.map((category) => (
            <Link
              key={category.id}
              to={`/categories/${category.id}`}
              className="card p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{category.icon || '📁'}</span>
                <div>
                  <h3 className="font-semibold">{category.name}</h3>
                  <p className="text-sm text-gray-500">{category.submissionCount} items</p>
                </div>
              </div>
              {category.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{category.description}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
