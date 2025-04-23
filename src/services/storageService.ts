
import { supabase } from '@/integrations/supabase/client';

export const storageService = {
  async uploadFile(file: File, path: string): Promise<string | null> {
    try {
      const { data, error } = await supabase.storage
        .from('business-assets')
        .upload(path, file);
      
      if (error) {
        throw error;
      }
      
      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('business-assets')
        .getPublicUrl(path);
      
      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  },
  
  async deleteFile(path: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from('business-assets')
        .remove([path]);
      
      return !error;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }
};
