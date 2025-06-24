import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ThemeToggle } from '@/components/theme-toggle';

const PostDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchPost = async () => {
      if (id) {
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error('Error fetching post:', error);
        } else {
          setPost(data);
        }
      }
    };

    fetchPost();
  }, [id]);

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Loading...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <Button variant="outline" onClick={() => navigate('/')}>
            ← Back to Home
          </Button>
          <ThemeToggle />
        </div>

        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">{post.title}</CardTitle>
            <CardDescription>
              Posted{' '}
              {formatDistanceToNow(new Date(post.created_at), {
                addSuffix: true,
              })} by {post.author_username}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-lg">{post.content}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PostDetail;
