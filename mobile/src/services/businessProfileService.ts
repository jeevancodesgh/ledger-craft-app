import { supabase } from './supabaseClient';
import { OnboardingData, BusinessTheme } from '@/types/onboarding';
import { decode } from 'base64-arraybuffer';

export interface BusinessProfile {
  id: string;
  userId: string;
  name: string;
  email: string;
  country: string;
  invoiceNumberFormat: string;
  invoiceNumberSequence: number;
  defaultTaxRate?: number;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  taxId?: string;
  website?: string;
  defaultTerms?: string;
  defaultNotes?: string;
  bankInfo?: string;
  logoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

class BusinessProfileService {
  // Create business profile from onboarding data
  async createBusinessProfile(data: OnboardingData): Promise<BusinessProfile> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Upload logo if provided (optional)
      let logoUrl: string | null = null;
      if (data.logoUri) {
        try {
          logoUrl = await this.uploadLogo(data.logoUri, user.id);
          if (!logoUrl) {
            console.warn('Logo upload skipped - continuing without logo');
          }
        } catch (error) {
          console.warn('Logo upload failed - continuing without logo:', error);
          // Continue without logo - it's optional
        }
      }

      // Prepare data for insertion (using snake_case for database)
      // Note: Web app stores theme as JSON, not individual columns
      const profileData = {
        user_id: user.id,
        name: data.businessName,
        email: data.businessEmail,
        country: data.country,
        invoice_number_format: data.invoiceNumberFormat,
        invoice_number_sequence: 0,
        default_tax_rate: data.defaultTaxRate,
        address: data.address,
        city: data.city,
        state: data.state,
        zip: data.zip,
        logo_url: logoUrl,
      };

      const { data: profile, error } = await supabase
        .from('business_profiles')
        .insert(profileData)
        .select()
        .single();

      if (error) {
        console.error('Error creating business profile:', error);
        throw error;
      }

      return this.transformToBusinessProfile(profile);
    } catch (error) {
      console.error('Error in createBusinessProfile:', error);
      throw error;
    }
  }

  // Get business profile for current user
  async getBusinessProfile(): Promise<BusinessProfile | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching business profile:', error);
        throw error;
      }

      return data ? this.transformToBusinessProfile(data) : null;
    } catch (error) {
      console.error('Error in getBusinessProfile:', error);
      throw error;
    }
  }

  // Update business profile
  async updateBusinessProfile(
    updates: Partial<OnboardingData>
  ): Promise<BusinessProfile> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Upload new logo if provided
      let logoUrl: string | undefined;
      if (updates.logoUri) {
        logoUrl = await this.uploadLogo(updates.logoUri, user.id);
      }

      // Prepare update data (using snake_case for database)
      // Note: Web app stores theme as JSON, not individual columns
      const updateData: any = {};
      if (updates.businessName) updateData.name = updates.businessName;
      if (updates.businessEmail) updateData.email = updates.businessEmail;
      if (updates.country) updateData.country = updates.country;
      if (updates.invoiceNumberFormat) updateData.invoice_number_format = updates.invoiceNumberFormat;
      if (updates.defaultTaxRate !== undefined) updateData.default_tax_rate = updates.defaultTaxRate;
      if (updates.address !== undefined) updateData.address = updates.address;
      if (updates.city !== undefined) updateData.city = updates.city;
      if (updates.state !== undefined) updateData.state = updates.state;
      if (updates.zip !== undefined) updateData.zip = updates.zip;
      if (logoUrl) updateData.logo_url = logoUrl;

      const { data: profile, error } = await supabase
        .from('business_profiles')
        .update(updateData)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating business profile:', error);
        throw error;
      }

      return this.transformToBusinessProfile(profile);
    } catch (error) {
      console.error('Error in updateBusinessProfile:', error);
      throw error;
    }
  }

  // Upload logo to Supabase Storage
  async uploadLogo(uri: string, userId: string): Promise<string | null> {
    try {
      // Fetch the file from the URI
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

      // Get file extension
      const ext = uri.split('.').pop()?.split('?')[0] || 'jpg';
      const fileName = `${userId}/logo.${ext}`;

      // Convert base64 to ArrayBuffer
      const arrayBuffer = decode(base64);

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('business-logos')
        .upload(fileName, arrayBuffer, {
          contentType: `image/${ext}`,
          upsert: true,
        });

      if (error) {
        console.warn('Logo upload failed (bucket may not exist):', error.message);
        // Return null instead of throwing - logo is optional
        return null;
      }

      // Get public URL
      const { data: publicData } = supabase.storage
        .from('business-logos')
        .getPublicUrl(fileName);

      return publicData.publicUrl;
    } catch (error) {
      console.warn('Error in uploadLogo:', error);
      // Return null instead of throwing - logo is optional
      return null;
    }
  }

  // Transform snake_case database response to camelCase
  private transformToBusinessProfile(data: any): BusinessProfile {
    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      email: data.email,
      country: data.country,
      invoiceNumberFormat: data.invoice_number_format,
      invoiceNumberSequence: data.invoice_number_sequence,
      defaultTaxRate: data.default_tax_rate,
      address: data.address,
      city: data.city,
      state: data.state,
      zip: data.zip,
      phone: data.phone,
      taxId: data.tax_id,
      website: data.website,
      defaultTerms: data.default_terms,
      defaultNotes: data.default_notes,
      bankInfo: data.bank_info,
      logoUrl: data.logo_url,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}

export const businessProfileService = new BusinessProfileService();

