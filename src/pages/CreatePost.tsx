import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { createPost } from '@/integrations/supabase/posts';
import { ThemeToggle } from '@/components/theme-toggle';

const CreatePost = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation(createPost, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast.success('Post created successfully!');
      navigate('/');
    },
    onError: (error: any) => {
      toast.error(`Failed to create post: ${error.message}`);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) {
      toast.error('Please fill in all fields');
      return;
    }

    mutation.mutate({ title, content });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Create New Post</h1>
            <p className="text-muted-foreground">Share something interesting with the community</p>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button variant="outline" onClick={() => navigate('/')}>
              Back to Home
            </Button>
          </div>
        </div>

        <Card>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  type="text"
                  placeholder="Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div>
                <Textarea
                  placeholder="Content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  className="min-h-[100px]"
                />
              </div>
              <Button type="submit" className="w-full" disabled={mutation.isLoading}>
                {mutation.isLoading ? 'Creating...' : 'Create Post'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreatePost;
