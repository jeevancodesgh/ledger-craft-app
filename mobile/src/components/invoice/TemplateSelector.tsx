import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import type { InvoiceTemplateId, InvoiceTemplate } from '@/types/invoiceTemplates';
import { INVOICE_TEMPLATES } from '@/types/invoiceTemplates';

interface TemplateSelectorProps {
  selectedTemplate: InvoiceTemplateId;
  onSelectTemplate: (templateId: InvoiceTemplateId) => void;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.42; // ~42% of screen width for 2 visible cards
const CARD_MARGIN = 8;

export default function TemplateSelector({
  selectedTemplate,
  onSelectTemplate,
}: TemplateSelectorProps) {
  const flatListRef = useRef<FlatList>(null);

  // Scroll to selected template on mount
  useEffect(() => {
    const selectedIndex = INVOICE_TEMPLATES.findIndex(
      (template) => template.id === selectedTemplate
    );
    if (selectedIndex >= 0 && flatListRef.current) {
      // Small delay to ensure FlatList is ready
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: selectedIndex,
          animated: true,
          viewPosition: 0.5,
        });
      }, 100);
    }
  }, []);

  const renderTemplate = ({ item }: { item: InvoiceTemplate }) => {
    const isSelected = item.id === selectedTemplate;
    
    return (
      <TouchableOpacity
        style={[
          styles.templateCard,
          isSelected && styles.templateCardSelected,
        ]}
        onPress={() => onSelectTemplate(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.templateIconContainer}>
          <Text style={styles.templateIcon}>📄</Text>
        </View>
        <Text style={[
          styles.templateName,
          isSelected && styles.templateNameSelected,
        ]}>
          {item.name}
        </Text>
        <Text style={styles.templateDescription} numberOfLines={2}>
          {item.description}
        </Text>
        {isSelected && (
          <View style={styles.selectedBadge}>
            <Text style={styles.selectedBadgeText}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Template</Text>
      <FlatList
        ref={flatListRef}
        data={INVOICE_TEMPLATES}
        renderItem={renderTemplate}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        snapToInterval={CARD_WIDTH + CARD_MARGIN * 2}
        decelerationRate="fast"
        getItemLayout={(data, index) => ({
          length: CARD_WIDTH + CARD_MARGIN * 2,
          offset: (CARD_WIDTH + CARD_MARGIN * 2) * index,
          index,
        })}
        onScrollToIndexFailed={(info) => {
          // Fallback if scrollToIndex fails
          const wait = new Promise(resolve => setTimeout(resolve, 500));
          wait.then(() => {
            flatListRef.current?.scrollToIndex({
              index: info.index,
              animated: true,
              viewPosition: 0.5,
            });
          });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  listContainer: {
    paddingHorizontal: 12,
  },
  templateCard: {
    width: CARD_WIDTH,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: CARD_MARGIN,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  templateCardSelected: {
    borderColor: '#5B72EE',
    backgroundColor: '#f0f4ff',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  templateIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  templateIcon: {
    fontSize: 24,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 6,
  },
  templateNameSelected: {
    color: '#5B72EE',
  },
  templateDescription: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 16,
  },
  selectedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#5B72EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedBadgeText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});

