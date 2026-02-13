import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { categoriesApi, submissionsApi } from '../services/api';
import toast from 'react-hot-toast';

interface Submission {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  rank: number;
  notes: string | null;
  isPrivate: boolean;
  likeCount: number;
}

interface Category {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  isPrivate: boolean;
  maxItems: number;
  isOwner: boolean;
  user: { username: string; displayName: string };
  submissions: Submission[];
}

// Random gradient colors based on submission id
const gradients = [
  'from-pink-500 to-rose-500',
  'from-purple-500 to-indigo-500',
  'from-blue-500 to-cyan-500',
  'from-teal-500 to-emerald-500',
  'from-green-500 to-lime-500',
  'from-yellow-500 to-orange-500',
  'from-orange-500 to-red-500',
  'from-fuchsia-500 to-pink-500',
  'from-violet-500 to-purple-500',
  'from-sky-500 to-blue-500',
];

function getGradient(id: string) {
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return gradients[hash % gradients.length];
}

// Get a category-relevant image from Unsplash
function getCategoryImage(name: string) {
  const keyword = encodeURIComponent(name.toLowerCase().split(' ')[0]);
  return `https://source.unsplash.com/1200x400/?${keyword}`;
}

function SortableItem({ submission, isOwner, onDelete, onTogglePrivacy }: { submission: Submission; isOwner: boolean; onDelete: () => void; onTogglePrivacy: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: submission.id });
  const gradient = getGradient(submission.id);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="card p-4 flex items-center gap-4 group">
      {isOwner && (
        <div {...attributes} {...listeners} className="cursor-grab text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        </div>
      )}
      <span className="text-2xl font-bold text-primary-600 w-8">#{submission.rank}</span>
      {submission.imageUrl ? (
        <img src={submission.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover" />
      ) : (
        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-lg shadow-sm`}>
          {submission.title.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold truncate">{submission.title}</h3>
        {submission.description && (
          <p className="text-sm text-gray-500 truncate">{submission.description}</p>
        )}
      </div>
      <div className="flex items-center gap-3 text-sm text-gray-500">
        <span>❤️ {submission.likeCount}</span>
        {isOwner && (
          <button 
            onClick={onTogglePrivacy} 
            className="text-gray-400 hover:text-primary-600 opacity-0 group-hover:opacity-100"
            title={submission.isPrivate ? 'Make public' : 'Make private'}
          >
            {submission.isPrivate ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        )}
        {isOwner && (
          <button onClick={onDelete} className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export default function CategoryView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [category, setCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newIsPrivate, setNewIsPrivate] = useState(false);

  useEffect(() => {
    loadCategory();
  }, [id]);

  const loadCategory = async () => {
    try {
      const response = await categoriesApi.get(id!);
      setCategory(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Category not found');
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !category) return;

    const oldIndex = category.submissions.findIndex(s => s.id === active.id);
    const newIndex = category.submissions.findIndex(s => s.id === over.id);

    const newSubmissions = [...category.submissions];
    const [moved] = newSubmissions.splice(oldIndex, 1);
    newSubmissions.splice(newIndex, 0, moved);

    // Update ranks
    const reorderedSubmissions = newSubmissions.map((s, i) => ({ ...s, rank: i + 1 }));
    setCategory({ ...category, submissions: reorderedSubmissions });

    try {
      await submissionsApi.reorder(reorderedSubmissions.map(s => ({ id: s.id, rank: s.rank })));
    } catch {
      toast.error('Failed to save order');
      loadCategory();
    }
  };

  const handleAddSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category) return;

    try {
      const response = await submissionsApi.create({
        categoryId: category.id,
        title: newTitle,
        description: newDescription || undefined,
        isPrivate: newIsPrivate
      });
      setCategory({
        ...category,
        submissions: [...category.submissions, { ...response.data, likeCount: 0, isPrivate: newIsPrivate }]
      });
      setNewTitle('');
      setNewDescription('');
      setNewIsPrivate(false);
      setShowAddForm(false);
      toast.success('Added to your rankings!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to add');
    }
  };

  const handleDelete = async (submissionId: string) => {
    if (!confirm('Remove this from your rankings?')) return;
    if (!category) return;

    try {
      await submissionsApi.delete(submissionId);
      const newSubmissions = category.submissions
        .filter(s => s.id !== submissionId)
        .map((s, i) => ({ ...s, rank: i + 1 }));
      setCategory({ ...category, submissions: newSubmissions });
      toast.success('Removed');
    } catch {
      toast.error('Failed to remove');
    }
  };

  const handleTogglePrivacy = async (submissionId: string) => {
    if (!category) return;
    const submission = category.submissions.find(s => s.id === submissionId);
    if (!submission) return;

    try {
      await submissionsApi.update(submissionId, { isPrivate: !submission.isPrivate });
      setCategory({
        ...category,
        submissions: category.submissions.map(s =>
          s.id === submissionId ? { ...s, isPrivate: !s.isPrivate } : s
        )
      });
      toast.success(submission.isPrivate ? 'Now public' : 'Now private');
    } catch {
      toast.error('Failed to update privacy');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!category) return null;

  return (
    <div>
      {/* Hero Banner with Category Image */}
      <div className="relative rounded-2xl overflow-hidden mb-8 h-56">
        <img 
          src={getCategoryImage(category.name)} 
          alt="" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-4xl drop-shadow-lg">{category.icon || '📁'}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-3xl font-bold text-white drop-shadow-lg">{category.name}</h1>
                    {category.isPrivate && (
                      <span className="bg-black/50 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Private
                      </span>
                    )}
                  </div>
                  {!category.isOwner && (
                    <Link to={`/profile/${category.user.username}`} className="text-white/80 hover:text-white text-sm">
                      by @{category.user.username}
                    </Link>
                  )}
                </div>
              </div>
              {category.description && (
                <p className="text-white/80 max-w-xl">{category.description}</p>
              )}
            </div>
            {category.isOwner && category.submissions.length < category.maxItems && (
              <button onClick={() => setShowAddForm(true)} className="btn-primary bg-white text-indigo-600 hover:bg-gray-100">
                + Add Item
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Add Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add to Rankings</h2>
            <form onSubmit={handleAddSubmission} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title *</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="input"
                  placeholder="e.g., The Shawshank Redemption"
                  autoFocus
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="input min-h-[80px]"
                  placeholder="Why you love it..."
                />
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="newIsPrivate"
                  checked={newIsPrivate}
                  onChange={(e) => setNewIsPrivate(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="newIsPrivate" className="text-sm">
                  Make this item private (only you can see it)
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddForm(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={!newTitle.trim()} className="btn-primary flex-1 disabled:opacity-50">
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rankings List */}
      {category.submissions.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-6xl mb-4">🏆</div>
          <h2 className="text-xl font-semibold mb-2">No rankings yet</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {category.isOwner ? 'Add your first item to start ranking!' : 'This category has no items yet.'}
          </p>
          {category.isOwner && (
            <button onClick={() => setShowAddForm(true)} className="btn-primary">
              Add First Item
            </button>
          )}
        </div>
      ) : (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={category.submissions.map(s => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {category.submissions.map((submission) => (
                <SortableItem
                  key={submission.id}
                  submission={submission}
                  isOwner={category.isOwner}
                  onDelete={() => handleDelete(submission.id)}
                  onTogglePrivacy={() => handleTogglePrivacy(submission.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
