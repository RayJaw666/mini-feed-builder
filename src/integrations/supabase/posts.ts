
import { supabase } from './client';

export interface CreatePostData {
  title: string;
  content: string;
  tags?: string[];
}

export const createPost = async (data: CreatePostData) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data: post, error } = await supabase
    .from('posts')
    .insert({
      title: data.title,
      content: data.content,
      tags: data.tags || [],
      author_id: user.id,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return post;
};
