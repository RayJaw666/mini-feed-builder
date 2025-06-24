
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Search, Plus, LogOut } from 'lucide-react';
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
  likes: { user_id: string }[];
  comments: { id: string }[];
}

const Home = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    } else {
      fetchPosts();
    }
  }, [user, navigate]);

  const fetchPosts = async () => {
    try {
      let query = supabase
        .from('posts')
        .select(`
          *,
          profiles:author_id (username),
          likes (user_id),
          comments (id)
        `)
        .order('created_at', { ascending: false });

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%,tags.cs.{${searchQuery}}`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (user) fetchPosts();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, user]);

  const toggleLike = async (postId: string) => {
    if (!user) return;

    try {
      const existingLike = posts
        .find(p => p.id === postId)
        ?.likes.find(l => l.user_id === user.id);

      if (existingLike) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('likes')
          .insert({ post_id: postId, user_id: user.id });

        if (error) throw error;
      }

      fetchPosts();
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">DevConnect Mini</h1>
          <div className="flex items-center gap-4">
            <Button onClick={() => navigate('/create')} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Post
            </Button>
            <Button variant="outline" onClick={handleSignOut} className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search posts by title, content, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-6">
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No posts found. Create the first one!</p>
            </div>
          ) : (
            posts.map((post) => (
              <Card key={post.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle 
                        className="text-lg hover:text-blue-600"
                        onClick={() => navigate(`/post/${post.id}`)}
                      >
                        {post.title}
                      </CardTitle>
                      <CardDescription>
                        by {post.profiles?.username} • {new Date(post.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p 
                    className="text-gray-700 mb-4 line-clamp-3"
                    onClick={() => navigate(`/post/${post.id}`)}
                  >
                    {post.content}
                  </p>
                  
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
                      onClick={() => toggleLike(post.id)}
                      className={`flex items-center gap-1 px-3 py-1 rounded-md transition-colors ${
                        post.likes.some(l => l.user_id === user?.id)
                          ? 'text-red-600 bg-red-50 hover:bg-red-100'
                          : 'text-gray-600 hover:text-red-600 hover:bg-gray-50'
                      }`}
                    >
                      <Heart 
                        className={`h-4 w-4 ${
                          post.likes.some(l => l.user_id === user?.id) ? 'fill-current' : ''
                        }`} 
                      />
                      {post.likes.length}
                    </button>
                    
                    <button
                      onClick={() => navigate(`/post/${post.id}`)}
                      className="flex items-center gap-1 px-3 py-1 rounded-md text-gray-600 hover:text-blue-600 hover:bg-gray-50 transition-colors"
                    >
                      <MessageCircle className="h-4 w-4" />
                      {post.comments.length}
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default Home;
