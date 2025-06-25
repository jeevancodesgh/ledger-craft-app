import React, { useState } from 'react';
import { Palette, Upload, ArrowLeft, ChevronRight } from 'lucide-react';
import { OnboardingStepProps, BusinessTheme, PRESET_THEMES, DEFAULT_BUSINESS_THEME } from '../../types';

export default function BrandingStep({ data, onDataChange, onNext, onBack, isLoading }: OnboardingStepProps) {
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const currentTheme = data.theme || DEFAULT_BUSINESS_THEME;

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onDataChange({ logoFile: file });
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleThemeSelect = (themeKey: string) => {
    const theme = PRESET_THEMES[themeKey];
    onDataChange({ theme });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  const handleSkip = () => {
    onNext();
  };

  const isCurrentTheme = (theme: BusinessTheme): boolean => {
    return (
      theme.primary === currentTheme.primary &&
      theme.secondary === currentTheme.secondary &&
      theme.accent === currentTheme.accent
    );
  };

  const ThemePreview = ({ theme, name }: { theme: BusinessTheme; name: string }) => (
    <div 
      className={`relative cursor-pointer transition-all hover:scale-105 ${
        isCurrentTheme(theme) ? 'ring-2 ring-offset-2 ring-primary' : ''
      }`}
      onClick={() => handleThemeSelect(name)}
    >
      <div 
        className="w-full h-20 rounded-lg border-2 overflow-hidden"
        style={{ borderColor: isCurrentTheme(theme) ? theme.primary : 'hsl(var(--border))' }}
      >
        {/* Header */}
        <div 
          className="h-6" 
          style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.secondary})` }}
        />
        {/* Content area */}
        <div className="flex h-14 p-2" style={{ backgroundColor: theme.surface }}>
          <div className="flex-1">
            <div className="w-16 h-2 rounded mb-1" style={{ backgroundColor: theme.text + '40' }} />
            <div className="w-12 h-1 rounded" style={{ backgroundColor: theme.textLight + '60' }} />
          </div>
          <div className="w-8 h-8 rounded" style={{ backgroundColor: theme.primary + '20' }} />
        </div>
      </div>
      {isCurrentTheme(theme) && (
        <div 
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-lg text-white text-xs font-bold"
          style={{ backgroundColor: theme.primary }}
        >
          ✓
        </div>
      )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Palette className="h-8 w-8 text-primary" />
        </div>
        <p className="text-muted-foreground">
          Customize your brand appearance to make your invoices uniquely yours.
        </p>
      </div>

      <div className="space-y-8">
        {/* Logo Upload Section */}
        <div>
          <h3 className="text-lg font-medium text-foreground mb-4 flex items-center">
            <Upload className="h-5 w-5 mr-2" />
            Business Logo
          </h3>
          
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-muted-foreground transition-colors">
            {logoPreview ? (
              <div className="space-y-4">
                <img 
                  src={logoPreview} 
                  alt="Logo preview" 
                  className="max-h-24 mx-auto object-contain"
                />
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Logo uploaded successfully!</p>
                  <label className="inline-flex items-center px-4 py-2 border border-border rounded-md text-sm font-medium text-foreground bg-background hover:bg-muted/50 cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    Change Logo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                <div>
                  <label className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Logo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-sm text-muted-foreground mt-2">
                    PNG, JPG up to 5MB. Recommended: 300x300px
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Theme Selection */}
        <div>
          <h3 className="text-lg font-medium text-foreground mb-4 flex items-center">
            <Palette className="h-5 w-5 mr-2" />
            Invoice Theme
          </h3>
          <p className="text-muted-foreground mb-4">
            Choose a color theme for your invoices. This will be applied to headers, accents, and buttons.
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(PRESET_THEMES).map(([key, theme]) => (
              <div key={key} className="space-y-2">
                <ThemePreview theme={theme} name={key} />
                <div className="text-center">
                  <span className="inline-block px-2 py-1 text-xs font-medium text-muted-foreground bg-muted/50 rounded capitalize">
                    {key}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Optional Info Box */}
      <div className="bg-primary/10 border border-border rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <Palette className="h-5 w-5 text-primary" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-foreground">
              Brand Consistency Matters
            </h3>
            <div className="mt-2 text-sm text-muted-foreground">
              <ul className="list-disc list-inside space-y-1">
                <li>A professional logo builds trust with your clients</li>
                <li>Consistent colors make your invoices instantly recognizable</li>
                <li>You can always update these settings later in your profile</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </button>
        
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={handleSkip}
            className="px-4 py-2 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors flex items-center"
          >
            <ChevronRight className="h-4 w-4 mr-2" />
            Skip for now
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Saving...' : 'Complete Setup'}
          </button>
        </div>
      </div>
    </form>
  );
}