import React, { useRef, useState, useCallback } from 'react';
import { Camera, Upload, Scan, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useReceiptScanning } from '@/hooks/useReceiptScanning';
import { ReceiptScanResult } from '@/types/receipt';

interface ReceiptScannerProps {
  onScanComplete: (result: ReceiptScanResult) => void;
  onClose: () => void;
  className?: string;
}

export const ReceiptScanner: React.FC<ReceiptScannerProps> = ({
  onScanComplete,
  onClose,
  className
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const {
    isScanning,
    scanResult,
    error,
    isAvailable,
    scanReceipt,
    clearResult,
    clearError
  } = useReceiptScanning();

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    
    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    
    // Clean up previous preview
    return () => URL.revokeObjectURL(url);
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleScan = async () => {
    if (!selectedFile) return;
    
    clearError();
    await scanReceipt(selectedFile);
  };

  const handleAcceptResult = () => {
    if (scanResult) {
      onScanComplete(scanResult);
      onClose();
    }
  };

  const handleRetry = () => {
    clearResult();
    clearError();
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  // Camera capture (mobile-optimized)
  const handleCameraCapture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  if (!isAvailable) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Receipt scanning is not available. Please configure your OpenAI API key in the .env.local file.
            </AlertDescription>
          </Alert>
          <Button onClick={onClose} className="mt-4 w-full">
            Close
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Scan Receipt</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {error && (
          <Alert className="mb-4" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!selectedFile && !scanResult && (
          <div className="space-y-4">
            <div className="text-center py-8">
              <Scan className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                Take a photo or upload an image of your receipt
              </p>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  onClick={handleCameraCapture}
                  className="flex-1"
                  variant="outline"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Take Photo
                </Button>
                
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1"
                  variant="outline"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Image
                </Button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment" // Use rear camera on mobile
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>
        )}

        {selectedFile && !scanResult && (
          <div className="space-y-4">
            {previewUrl && (
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Receipt preview"
                  className="w-full max-h-64 object-contain rounded-lg border"
                />
                <div className="absolute inset-0 bg-black/5 rounded-lg" />
              </div>
            )}

            <div className="text-sm text-center text-muted-foreground">
              {selectedFile.name} ({Math.round(selectedFile.size / 1024)}KB)
            </div>

            {isScanning && (
              <div className="space-y-2">
                <div className="flex items-center justify-center text-sm text-muted-foreground">
                  <Scan className="h-4 w-4 mr-2 animate-pulse" />
                  AI is analyzing your receipt...
                </div>
                <Progress value={undefined} className="w-full" />
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleRetry}
                variant="outline"
                className="flex-1"
                disabled={isScanning}
              >
                Cancel
              </Button>
              <Button
                onClick={handleScan}
                className="flex-1"
                disabled={isScanning}
              >
                {isScanning ? (
                  <>
                    <Scan className="h-4 w-4 mr-2 animate-pulse" />
                    Scanning...
                  </>
                ) : (
                  'Scan Receipt'
                )}
              </Button>
            </div>
          </div>
        )}

        {scanResult && (
          <div className="space-y-4">
            <div className="flex items-center text-green-600 mb-4">
              <CheckCircle className="h-5 w-5 mr-2" />
              <span className="font-medium">Receipt scanned successfully!</span>
            </div>

            <div className="space-y-3">
              {scanResult.merchantName && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Merchant:</span>
                  <span className="text-sm font-medium">{scanResult.merchantName}</span>
                </div>
              )}

              {scanResult.date && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Date:</span>
                  <span className="text-sm font-medium">{scanResult.date}</span>
                </div>
              )}

              {scanResult.total && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total:</span>
                  <span className="text-sm font-medium">${scanResult.total.toFixed(2)}</span>
                </div>
              )}

              {scanResult.tax && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Tax:</span>
                  <span className="text-sm font-medium">${scanResult.tax.toFixed(2)}</span>
                </div>
              )}

              {scanResult.suggestedCategory && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Category:</span>
                  <span className="text-sm font-medium">{scanResult.suggestedCategory}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Confidence:</span>
                <span className="text-sm font-medium">{scanResult.confidence}%</span>
              </div>
            </div>

            {scanResult.items && scanResult.items.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Items:</h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {scanResult.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-xs">
                      <span className="truncate mr-2">
                        {item.quantity > 1 && `${item.quantity}x `}
                        {item.description}
                      </span>
                      <span className="text-muted-foreground">
                        ${item.price.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleRetry}
                variant="outline"
                className="flex-1"
              >
                Scan Another
              </Button>
              <Button
                onClick={handleAcceptResult}
                className="flex-1"
              >
                Use This Data
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};