import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { BusinessProfile } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const profileFormSchema = z.object({
  name: z.string().min(1, { message: "Business name is required" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  phone: z.string().optional(),
  website: z.string().optional(),
  taxId: z.string().optional(),
  defaultTaxRate: z.union([z.number(), z.string()]).optional().transform(value =>
    value === '' ? null : typeof value === 'string' ? parseFloat(value) : value
  ),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().default('USA'),
  defaultTerms: z.string().optional(),
  defaultNotes: z.string().optional(),
  invoiceNumberFormat: z.string().min(2, { message: "Format required" }).optional(),
  invoiceNumberSequence: z.union([z.number(), z.string()]).optional().transform(value =>
    value === '' ? null : typeof value === 'string' ? parseInt(value, 10) : value
  ),
  logoFile: z.any().optional()
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const Settings = () => {
  const { businessProfile, isLoadingProfile, updateBusinessProfile, refreshBusinessProfile } = useAppContext();
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const [previewLogoUrl, setPreviewLogoUrl] = useState<string | undefined>(businessProfile?.logoUrl || undefined);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: businessProfile?.name || '',
      email: businessProfile?.email || '',
      phone: businessProfile?.phone || '',
      website: businessProfile?.website || '',
      taxId: businessProfile?.taxId || '',
      defaultTaxRate: businessProfile?.defaultTaxRate || undefined,
      address: businessProfile?.address || '',
      city: businessProfile?.city || '',
      state: businessProfile?.state || '',
      zip: businessProfile?.zip || '',
      country: businessProfile?.country || 'USA',
      defaultTerms: businessProfile?.defaultTerms || '',
      defaultNotes: businessProfile?.defaultNotes || '',
      invoiceNumberFormat: businessProfile?.invoiceNumberFormat || 'INV-{YYYY}-{SEQ}',
      invoiceNumberSequence: businessProfile?.invoiceNumberSequence ?? 1,
      logoFile: undefined,
    },
  });

  useEffect(() => {
    refreshBusinessProfile();
  }, []);

  React.useEffect(() => {
    if (businessProfile && !isLoadingProfile) {
      form.reset({
        name: businessProfile.name || '',
        email: businessProfile.email || '',
        phone: businessProfile.phone || '',
        website: businessProfile.website || '',
        taxId: businessProfile.taxId || '',
        defaultTaxRate: businessProfile.defaultTaxRate || undefined,
        address: businessProfile.address || '',
        city: businessProfile.city || '',
        state: businessProfile.state || '',
        zip: businessProfile.zip || '',
        country: businessProfile.country || 'USA',
        defaultTerms: businessProfile.defaultTerms || '',
        defaultNotes: businessProfile.defaultNotes || '',
        invoiceNumberFormat: businessProfile.invoiceNumberFormat || 'INV-{YYYY}-{SEQ}',
        invoiceNumberSequence: businessProfile.invoiceNumberSequence ?? 1,
        logoFile: undefined,
      });
      setPreviewLogoUrl(businessProfile.logoUrl || undefined);
    }
  }, [businessProfile, isLoadingProfile, form]);

  const onSubmit = async (data: ProfileFormValues) => {
    setIsSaving(true);
    try {
      let logoUrlToSave = businessProfile?.logoUrl || null;

      if (data.logoFile && data.logoFile.length > 0) {
        const file = data.logoFile[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `business-logo-${Date.now()}.${fileExt}`;
        const filePath = `business-logos/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('business-assets')
          .upload(filePath, file);

        if (uploadError) {
          throw new Error(uploadError.message || "Failed to upload logo");
        }

        if (uploadData) {
          const { data: publicUrlData } = supabase.storage
            .from('business-assets')
            .getPublicUrl(filePath);
            
          logoUrlToSave = publicUrlData.publicUrl;
        }
      }

      const profileData: BusinessProfile = {
        name: data.name,
        email: data.email,
        country: data.country,
        phone: data.phone || null,
        website: data.website || null,
        taxId: data.taxId || null,
        defaultTaxRate: data.defaultTaxRate as number | null,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        zip: data.zip || null,
        defaultTerms: data.defaultTerms || null,
        defaultNotes: data.defaultNotes || null,
        id: businessProfile?.id,
        invoiceNumberFormat: data.invoiceNumberFormat?.trim() || 'INV-{YYYY}-{SEQ}',
        invoiceNumberSequence: data.invoiceNumberSequence ?? 1,
        logoUrl: logoUrlToSave,
      };
      
      const updated = await updateBusinessProfile(profileData);
      toast({
        title: "Success",
        description: "Business profile updated successfully"
      });
      setPreviewLogoUrl(updated.logoUrl || undefined);
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: "Failed to update business profile",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      form.setValue("logoFile", e.target.files);
      const file = e.target.files[0];
      const previewUrl = URL.createObjectURL(file);
      setPreviewLogoUrl(previewUrl);
    }
  };

  if (isLoadingProfile) {
    return <div className="flex justify-center items-center h-64">Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>
      <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="profile">Business Profile</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <TabsContent value="profile" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Business Profile</CardTitle>
                  <CardDescription>
                    Update your business information that appears on your invoices
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2 flex flex-col items-start space-y-2">
                      <label htmlFor="logoUpload" className="cursor-pointer inline-flex items-center space-x-1">
                        <Upload className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">Upload Logo</span>
                      </label>
                      <input
                        id="logoUpload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoChange}
                      />
                      {previewLogoUrl && (
                        <img
                          src={previewLogoUrl}
                          alt="Business Logo Preview"
                          className="max-h-24 max-w-xs object-contain rounded border border-gray-300"
                        />
                      )}
                    </div>

                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel>Business Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Your Business Name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="contact@yourbusiness.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="(555) 123-4567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel>Website</FormLabel>
                          <FormControl>
                            <Input placeholder="www.yourbusiness.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="taxId"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel>Tax ID / VAT Number</FormLabel>
                          <FormControl>
                            <Input placeholder="12-3456789" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="defaultTaxRate"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel>Default Tax Rate (%)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="7.5"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value === "" ? "" : parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem className="space-y-2 md:col-span-2">
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Input placeholder="100 Main Street" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="Anytown" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel>State</FormLabel>
                            <FormControl>
                              <Input placeholder="ST" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="zip"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel>Zip Code</FormLabel>
                            <FormControl>
                              <Input placeholder="12345" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="invoiceNumberFormat"
                      render={({ field }) => (
                        <FormItem className="space-y-2 md:col-span-2">
                          <FormLabel>Invoice Number Format</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. INV-{YYYY}-{MM}-{DD}-{SEQ}" {...field} />
                          </FormControl>
                          <div className="text-xs text-muted-foreground">
                            Use <span className="font-mono">{'{YYYY}'}</span> for year, <span className="font-mono">{'{MM}'}</span> for month, <span className="font-mono">{'{DD}'}</span> for day, <span className="font-mono">{'{SEQ}'}</span> for sequence.<br />
                            Example: <span className="font-mono">INV-{'{YYYY}'}-{'{SEQ}'}</span> → <span className="font-mono">INV-2025-001</span>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="invoiceNumberSequence"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel>Next Sequence Number</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              step={1}
                              placeholder="1"
                              {...field}
                              onChange={e => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="preferences" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Invoice Preferences</CardTitle>
                  <CardDescription>
                    Customize default settings for your invoices
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="defaultTerms"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel>Default Payment Terms</FormLabel>
                          <FormControl>
                            <Input placeholder="Payment due within 30 days" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="defaultNotes"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel>Default Notes</FormLabel>
                          <FormControl>
                            <Input placeholder="Thank you for your business!" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="appearance" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Appearance</CardTitle>
                  <CardDescription>
                    Customize the appearance of your application
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Theme preference options will be available here.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <div className="mt-6">
              <Button
                type="submit"
                className="bg-invoice-teal hover:bg-invoice-teal/90"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </Tabs>
    </div>
  );
};

export default Settings;
