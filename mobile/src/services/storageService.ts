import { supabase } from './supabaseClient';
import { decode } from 'base64-arraybuffer';

export const storageService = {
  // Receipt-specific upload with React Native compatibility
  async uploadReceipt(uri: string, expenseId?: string): Promise<{ url: string; path: string } | null> {
    try {
      // Fetch the image from URI
      const response = await fetch(uri);
      const blob = await response.blob();
      
      // Convert blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64data = reader.result as string;
          // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
          const base64 = base64data.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const base64 = await base64Promise;

      // Generate unique filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const ext = uri.split('.').pop()?.split('?')[0] || 'jpg';
      const fileName = expenseId 
        ? `receipt-${expenseId}-${timestamp}.${ext}`
        : `receipt-${timestamp}.${ext}`;
      const filePath = `receipts/${fileName}`;

      // Convert base64 to ArrayBuffer
      const arrayBuffer = decode(base64);

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('business-assets')
        .upload(filePath, arrayBuffer, {
          contentType: `image/${ext}`,
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) {
        console.error('Error uploading receipt:', error);
        throw error;
      }
      
      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('business-assets')
        .getPublicUrl(filePath);
      
      return {
        url: publicUrlData.publicUrl,
        path: filePath
      };
    } catch (error) {
      console.error('Error uploading receipt:', error);
      return null;
    }
  },

  // Delete receipt with path extraction
  async deleteReceipt(urlOrPath: string): Promise<boolean> {
    try {
      let filePath = urlOrPath;
      
      // Extract path from URL if needed
      if (urlOrPath.includes('/storage/v1/object/public/business-assets/')) {
        filePath = urlOrPath.split('/storage/v1/object/public/business-assets/')[1];
      }
      
      const { error } = await supabase.storage
        .from('business-assets')
        .remove([filePath]);
      
      return !error;
    } catch (error) {
      console.error('Error deleting receipt:', error);
      return false;
    }
  },
};

