import React, { useState, useRef } from 'react';
import { Copy, Calendar, Share2, Link2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { sharedInvoiceService } from '@/services/supabaseService';
import { Invoice, InvoiceTemplateName } from '@/types';

interface ShareInvoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice;
  businessName?: string;
}

const TEMPLATE_OPTIONS = [
  { value: 'classic', label: 'Classic' },
  { value: 'modern', label: 'Modern' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'executive', label: 'Executive' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'modernPro', label: 'Modern Pro' },
] as const;

const ShareInvoiceModal: React.FC<ShareInvoiceModalProps> = ({
  open,
  onOpenChange,
  invoice,
  businessName,
}) => {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  
  
  const [selectedTemplate, setSelectedTemplate] = useState<InvoiceTemplateName>(
    (invoice.templateName as InvoiceTemplateName) || 'classic'
  );
  const [showTemplateSelection, setShowTemplateSelection] = useState(
    !invoice.templateName
  );
  const [enableExpiration, setEnableExpiration] = useState(false);
  const [expirationDays, setExpirationDays] = useState(30);
  const [copied, setCopied] = useState(false);
  const urlInputRef = useRef<HTMLInputElement>(null);

  const handleCreateShareLink = async () => {
    setIsCreating(true);
    try {
      const expiresAt = enableExpiration 
        ? new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000).toISOString()
        : undefined;

      const sharedInvoice = await sharedInvoiceService.createSharedInvoice(
        invoice.id,
        selectedTemplate,
        expiresAt
      );

      const url = `${window.location.origin}/shared/invoice/${sharedInvoice.shareToken}`;
      setShareUrl(url);

      toast({
        title: 'Share link created',
        description: 'Invoice share link has been generated successfully.',
      });
    } catch (error) {
      console.error('Error creating share link:', error);
      toast({
        title: 'Error',
        description: 'Failed to create share link. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: 'Link copied',
        description: 'Share link copied to clipboard.',
      });
    } catch (error) {
      // Fallback for browsers that don't support clipboard API
      if (urlInputRef.current) {
        urlInputRef.current.select();
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast({
          title: 'Link copied',
          description: 'Share link copied to clipboard.',
        });
      }
    }
  };

  const handleNativeShare = async () => {
    if (!shareUrl) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Invoice ${invoice.invoiceNumber}`,
          text: `View your invoice from ${businessName || 'us'}.`,
          url: shareUrl,
        });
        toast({
          title: 'Invoice shared successfully!',
        });
      } catch (error: unknown) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Error sharing:', error);
          toast({
            title: 'Sharing failed',
            description: 'Could not share the invoice.',
            variant: 'destructive',
          });
        }
      }
    } else {
      // Fallback to copy
      handleCopyLink();
    }
  };

  const handleClose = () => {
    setShareUrl('');
    setCopied(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Invoice {invoice.invoiceNumber}
          </DialogTitle>
          <DialogDescription>
            Create a secure link to share this invoice. Recipients can view the invoice without needing an account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template Selection - Only show if no template is saved */}
          {showTemplateSelection && (
            <div className="space-y-2">
              <Label htmlFor="template">Template</Label>
              <Select value={selectedTemplate} onValueChange={(value) => setSelectedTemplate(value as InvoiceTemplateName)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATE_OPTIONS.map((template) => (
                    <SelectItem key={template.value} value={template.value}>
                      {template.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {/* Show selected template info when template is pre-saved */}
          {!showTemplateSelection && (
            <div className="space-y-2">
              <Label>Template</Label>
              <div className="flex items-center justify-between p-3 border rounded-md bg-muted/50">
                <span className="font-medium">
                  {TEMPLATE_OPTIONS.find(t => t.value === selectedTemplate)?.label || selectedTemplate}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTemplateSelection(true)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Change
                </Button>
              </div>
            </div>
          )}

          {/* Expiration Settings */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="expiration">Link Expiration</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically disable the link after a certain time
                </p>
              </div>
              <Switch 
                id="expiration"
                checked={enableExpiration} 
                onCheckedChange={setEnableExpiration} 
              />
            </div>
            
            {enableExpiration && (
              <div className="space-y-2">
                <Label htmlFor="expiration-days">Expires in (days)</Label>
                <Input
                  id="expiration-days"
                  type="number"
                  min="1"
                  max="365"
                  value={expirationDays}
                  onChange={(e) => setExpirationDays(Number(e.target.value))}
                />
              </div>
            )}
          </div>

          {/* Generate/Display Share Link */}
          {!shareUrl ? (
            <Button 
              onClick={handleCreateShareLink} 
              disabled={isCreating}
              className="w-full"
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Creating link...
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4 mr-2" />
                  Generate Share Link
                </>
              )}
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="share-url">Share Link</Label>
                <div className="flex gap-2">
                  <Input
                    ref={urlInputRef}
                    id="share-url"
                    value={shareUrl}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyLink}
                    className="shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleCopyLink}
                  className="flex-1"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Link
                </Button>
                {navigator.share && (
                  <Button
                    onClick={handleNativeShare}
                    className="flex-1"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                )}
              </div>

              {enableExpiration && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Expires in {expirationDays} day{expirationDays !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareInvoiceModal;