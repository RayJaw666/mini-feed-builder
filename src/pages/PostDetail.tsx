
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, ArrowLeft, Send } from 'lucide-react';
import { toast } from 'sonner';

interface Post {
  id: string;
  title: string;
  content: string;
  tags: string[];
  created_at: string;
  author_id: string;
  profiles: {
    username: string;
  };
}

interface Comment {
  id: string;
  text: string;
  created_at: string;
  author_id: string;
  profiles: {
    username: string;
  };
}

const PostDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [likes, setLikes] = useState<{ user_id: string }[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    } else if (id) {
      fetchPost();
      fetchComments();
      fetchLikes();
    }
  }, [id, user, navigate]);

  const fetchPost = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:author_id (username)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setPost(data);
    } catch (error) {
      console.error('Error fetching post:', error);
      toast.error('Failed to fetch post');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles:author_id (username)
        `)
        .eq('post_id', id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const fetchLikes = async () => {
    try {
      const { data, error } = await supabase
        .from('likes')
        .select('user_id')
        .eq('post_id', id);

      if (error) throw error;
      setLikes(data || []);
    } catch (error) {
      console.error('Error fetching likes:', error);
    }
  };

  const toggleLike = async () => {
    if (!user || !id) return;

    try {
      const isLiked = likes.some(l => l.user_id === user.id);

      if (isLiked) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', id)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('likes')
          .insert({ post_id: id, user_id: user.id });

        if (error) throw error;
      }

      fetchLikes();
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like');
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user || !id) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          text: newComment.trim(),
          post_id: id,
          author_id: user.id
        });

      if (error) throw error;

      setNewComment('');
      fetchComments();
      toast.success('Comment added successfully!');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Post not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">{post.title}</CardTitle>
            <CardDescription>
              by {post.profiles?.username} • {new Date(post.created_at).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none mb-4">
              <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>
            </div>
            
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {post.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex items-center gap-4">
              <button
                onClick={toggleLike}
                className={`flex items-center gap-1 px-3 py-1 rounded-md transition-colors ${
                  likes.some(l => l.user_id === user?.id)
                    ? 'text-red-600 bg-red-50 hover:bg-red-100'
                    : 'text-gray-600 hover:text-red-600 hover:bg-gray-50'
                }`}
              >
                <Heart 
                  className={`h-4 w-4 ${
                    likes.some(l => l.user_id === user?.id) ? 'fill-current' : ''
                  }`} 
                />
                {likes.length}
              </button>
              
              <div className="flex items-center gap-1 text-gray-600">
                <MessageCircle className="h-4 w-4" />
                {comments.length} comments
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Add a Comment</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCommentSubmit} className="space-y-4">
              <Textarea
                placeholder="Share your thoughts..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
                required
              />
              <Button type="submit" disabled={submitting} className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                {submitting ? 'Posting...' : 'Post Comment'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Comments ({comments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {comments.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No comments yet. Be the first to comment!
              </p>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-medium text-sm text-gray-900">
                        {comment.profiles?.username}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">{comment.text}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default PostDetail;
