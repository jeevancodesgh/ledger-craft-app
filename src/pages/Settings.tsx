
import React from 'react';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Settings = () => {
  const { businessProfile, isLoadingProfile } = useAppContext();
  
  if (isLoadingProfile) {
    return <div className="flex justify-center items-center h-64">Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>
      
      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Business Profile</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Business Profile</CardTitle>
              <CardDescription>
                Update your business information that appears on your invoices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input 
                    id="businessName" 
                    defaultValue={businessProfile?.name} 
                    placeholder="Your Business Name" 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    defaultValue={businessProfile?.email} 
                    placeholder="contact@yourbusiness.com" 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input 
                    id="phone" 
                    defaultValue={businessProfile?.phone} 
                    placeholder="(555) 123-4567" 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input 
                    id="website" 
                    defaultValue={businessProfile?.website} 
                    placeholder="www.yourbusiness.com" 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="taxId">Tax ID / VAT Number</Label>
                  <Input 
                    id="taxId" 
                    defaultValue={businessProfile?.taxId} 
                    placeholder="12-3456789" 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="defaultTaxRate">Default Tax Rate (%)</Label>
                  <Input 
                    id="defaultTaxRate" 
                    type="number"
                    defaultValue={businessProfile?.defaultTaxRate?.toString()} 
                    placeholder="7.5" 
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input 
                    id="address" 
                    defaultValue={businessProfile?.address} 
                    placeholder="100 Main Street" 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input 
                    id="city" 
                    defaultValue={businessProfile?.city} 
                    placeholder="Anytown" 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input 
                      id="state" 
                      defaultValue={businessProfile?.state} 
                      placeholder="ST" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="zip">Zip Code</Label>
                    <Input 
                      id="zip" 
                      defaultValue={businessProfile?.zip} 
                      placeholder="12345" 
                    />
                  </div>
                </div>
                
                <div className="space-y-2 md:col-span-2 pt-4">
                  <Button className="bg-invoice-teal hover:bg-invoice-teal/90">
                    Save Changes
                  </Button>
                </div>
              </form>
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
              <form className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="defaultTerms">Default Payment Terms</Label>
                  <Input 
                    id="defaultTerms" 
                    defaultValue={businessProfile?.defaultTerms} 
                    placeholder="Payment due within 30 days" 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="defaultNotes">Default Notes</Label>
                  <Input 
                    id="defaultNotes" 
                    defaultValue={businessProfile?.defaultNotes} 
                    placeholder="Thank you for your business!" 
                  />
                </div>
                
                <div className="pt-4">
                  <Button className="bg-invoice-teal hover:bg-invoice-teal/90">
                    Save Preferences
                  </Button>
                </div>
              </form>
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
      </Tabs>
    </div>
  );
};

export default Settings;
