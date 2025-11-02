import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { WebView } from 'react-native-webview';
import type { Invoice, BusinessProfile } from '@/types/invoice';
import type { InvoiceTemplateId } from '@/types/invoiceTemplates';
import TemplateSelector from './TemplateSelector';
import { getTemplateHTML } from '@/utils/invoiceTemplates';
import { shareInvoicePDF } from '@/utils/pdfUtils';

interface InvoicePreviewWithTemplatesProps {
  invoice: Invoice;
  businessProfile?: BusinessProfile;
  initialTemplate?: InvoiceTemplateId;
  onClose?: () => void;
}

const { height: screenHeight } = Dimensions.get('window');

export default function InvoicePreviewWithTemplates({
  invoice,
  businessProfile,
  initialTemplate = 'classic',
  onClose,
}: InvoicePreviewWithTemplatesProps) {
  const webViewRef = useRef<WebView>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<InvoiceTemplateId>(
    invoice.templateName as InvoiceTemplateId || initialTemplate
  );
  const [isLoadingWebView, setIsLoadingWebView] = useState(true);
  const [isSharingPDF, setIsSharingPDF] = useState(false);
  const [webViewError, setWebViewError] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(0.75); // Default 75% for mobile
  const [hasAutoFitted, setHasAutoFitted] = useState(false);

  // Zoom control functions
  const zoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.1, 2.0));
  };

  const zoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.1, 0.5));
  };

  const resetZoom = () => {
    setZoomLevel(0.75);
  };

  // Generate zoom injection script
  const getZoomScript = (zoom: number) => `
    (function() {
      try {
        var viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) {
          viewport = document.createElement('meta');
          viewport.name = 'viewport';
          document.head.appendChild(viewport);
        }
        viewport.content = 'width=device-width, initial-scale=${zoom}, maximum-scale=3.0, minimum-scale=0.5, user-scalable=yes';
        
        // Apply zoom to body
        if (document.body) {
          document.body.style.zoom = '${zoom}';
          document.body.style.transform = 'scale(${zoom})';
          document.body.style.transformOrigin = 'top left';
        }
      } catch (e) {
        console.error('Zoom script error:', e);
      }
    })();
    true;
  `;

  // Update zoom when level changes
  useEffect(() => {
    if (webViewRef.current && !isLoadingWebView) {
      webViewRef.current.injectJavaScript(getZoomScript(zoomLevel));
    }
  }, [zoomLevel]);

  const handleTemplateSelect = (templateId: InvoiceTemplateId) => {
    setSelectedTemplate(templateId);
    setIsLoadingWebView(true);
    setWebViewError(null);
    setHasAutoFitted(false); // Reset auto-fit for new template
  };

  // Calculate optimal zoom to fit content in screen
  const autoFitContent = () => {
    if (!webViewRef.current || hasAutoFitted) return;

    const autoFitScript = `
      (function() {
        try {
          const screenWidth = window.innerWidth;
          const screenHeight = window.innerHeight;
          const contentWidth = document.body.scrollWidth;
          const contentHeight = document.body.scrollHeight;
          
          // Calculate zoom to fit width with some padding
          const widthZoom = (screenWidth * 0.95) / contentWidth;
          
          // Calculate zoom to fit height if content is taller than screen
          const heightZoom = contentHeight > screenHeight 
            ? (screenHeight * 0.9) / contentHeight 
            : 1.0;
          
          // Use the smaller zoom to ensure everything fits
          const optimalZoom = Math.min(widthZoom, heightZoom, 1.0);
          
          // Clamp between 0.5 and 1.0 for initial load
          const finalZoom = Math.max(0.5, Math.min(optimalZoom, 1.0));
          
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'autoFitZoom',
            zoom: finalZoom,
            contentWidth: contentWidth,
            contentHeight: contentHeight,
            screenWidth: screenWidth,
            screenHeight: screenHeight
          }));
        } catch (e) {
          console.error('Auto-fit error:', e);
        }
      })();
      true;
    `;

    webViewRef.current.injectJavaScript(autoFitScript);
  };

  // Handle messages from WebView
  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'autoFitZoom' && !hasAutoFitted) {
        console.log('Auto-fitting zoom:', data.zoom, 'Content:', data.contentWidth, 'x', data.contentHeight);
        setZoomLevel(data.zoom);
        setHasAutoFitted(true);
      }
    } catch (e) {
      console.error('Error parsing WebView message:', e);
    }
  };

  const handleSharePDF = async () => {
    try {
      setIsSharingPDF(true);
      await shareInvoicePDF(invoice, businessProfile, selectedTemplate);
    } catch (error) {
      console.error('Error sharing PDF:', error);
      Alert.alert('Error', 'Failed to share PDF. Please try again.');
    } finally {
      setIsSharingPDF(false);
    }
  };

  const handleWebViewError = () => {
    setWebViewError('Failed to load preview');
    setIsLoadingWebView(false);
  };

  const handleRetry = () => {
    setWebViewError(null);
    setIsLoadingWebView(true);
  };

  const htmlContent = getTemplateHTML(selectedTemplate, invoice, businessProfile);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Invoice Preview</Text>
          <Text style={styles.headerSubtitle}>{invoice.invoiceNumber}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[
              styles.sharePDFButton,
              isSharingPDF && styles.sharePDFButtonDisabled,
            ]}
            onPress={handleSharePDF}
            disabled={isSharingPDF}
          >
            {isSharingPDF ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.sharePDFButtonText}>Share PDF</Text>
            )}
          </TouchableOpacity>
          {onClose && (
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Template Selector */}
      <TemplateSelector
        selectedTemplate={selectedTemplate}
        onSelectTemplate={handleTemplateSelect}
      />

      {/* Preview */}
      <View style={styles.previewContainer}>
        {webViewError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>{webViewError}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {isLoadingWebView && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#5B72EE" />
                <Text style={styles.loadingText}>Loading preview...</Text>
              </View>
            )}
            <WebView
              ref={webViewRef}
              source={{ html: htmlContent }}
              style={styles.webView}
              onLoad={() => {
                setIsLoadingWebView(false);
                // Auto-fit content after a small delay to ensure content is rendered
                setTimeout(() => autoFitContent(), 300);
              }}
              onError={handleWebViewError}
              onHttpError={handleWebViewError}
              onMessage={handleWebViewMessage}
              originWhitelist={['*']}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              scalesPageToFit={false}
              showsVerticalScrollIndicator={true}
              showsHorizontalScrollIndicator={false}
              injectedJavaScript={getZoomScript(zoomLevel)}
            />
          </>
        )}
      </View>

      {/* Zoom Controls */}
      {!webViewError && !isLoadingWebView && (
        <View style={styles.zoomControls}>
          <TouchableOpacity
            onPress={zoomOut}
            style={[styles.zoomButton, zoomLevel <= 0.5 && styles.zoomButtonDisabled]}
            disabled={zoomLevel <= 0.5}
            activeOpacity={0.7}
          >
            <Text style={styles.zoomIcon}>−</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={resetZoom}
            style={[styles.zoomButton, styles.zoomButtonReset]}
            activeOpacity={0.7}
          >
            <Text style={styles.zoomPercentage}>{Math.round(zoomLevel * 100)}%</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={zoomIn}
            style={[styles.zoomButton, zoomLevel >= 2.0 && styles.zoomButtonDisabled]}
            disabled={zoomLevel >= 2.0}
            activeOpacity={0.7}
          >
            <Text style={styles.zoomIcon}>+</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerContent: {
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sharePDFButton: {
    flex: 1,
    backgroundColor: '#5B72EE',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#5B72EE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sharePDFButtonDisabled: {
    opacity: 0.6,
  },
  sharePDFButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: '#64748b',
    fontWeight: '300',
  },
  previewContainer: {
    flex: 1,
    position: 'relative',
  },
  webView: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#ffffff',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#5B72EE',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  zoomControls: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    flexDirection: 'column',
    gap: 12,
    zIndex: 20,
  },
  zoomButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(91, 114, 238, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  zoomButtonReset: {
    backgroundColor: 'rgba(100, 116, 139, 0.95)',
  },
  zoomButtonDisabled: {
    backgroundColor: 'rgba(203, 213, 225, 0.8)',
    opacity: 0.5,
  },
  zoomIcon: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 32,
  },
  zoomPercentage: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});

