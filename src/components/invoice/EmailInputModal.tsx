import React, { useState } from 'react';
import { Mail, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { emailService } from '@/services/emailService';

interface EmailInputModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEmailConfirmed: (email: string) => void;
  customerEmail?: string;
  invoiceNumber: string;
}

const EmailInputModal: React.FC<EmailInputModalProps> = ({
  open,
  onOpenChange,
  onEmailConfirmed,
  customerEmail,
  invoiceNumber,
}) => {
  const [email, setEmail] = useState(customerEmail || '');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsValidating(true);

    try {
      const isValid = await emailService.validateEmail(email);
      if (!isValid) {
        setError('Please enter a valid email address');
        return;
      }

      onEmailConfirmed(email);
      onOpenChange(false);
    } catch (error) {
      setError('Failed to validate email address');
    } finally {
      setIsValidating(false);
    }
  };

  const handleClose = () => {
    setEmail(customerEmail || '');
    setError('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Invoice {invoiceNumber}
          </DialogTitle>
          <DialogDescription>
            Enter the email address where you want to send this invoice.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="customer@example.com"
              required
              autoFocus
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isValidating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isValidating || !email.trim()}
            >
              {isValidating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Validating...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EmailInputModal;