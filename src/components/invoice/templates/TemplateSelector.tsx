
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { InvoiceTemplate, InvoiceTemplateId } from './InvoiceTemplates';
import { cn } from '@/lib/utils';

interface TemplateSelectorProps {
  templates: InvoiceTemplate[];
  selectedTemplate: InvoiceTemplateId;
  onSelectTemplate: (templateId: InvoiceTemplateId) => void;
}

const TemplateSelector = ({
  templates,
  selectedTemplate,
  onSelectTemplate
}: TemplateSelectorProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {templates.map((template) => (
        <Card
          key={template.id}
          className={cn(
            "cursor-pointer transition-all hover:border-primary",
            selectedTemplate === template.id ? "border-primary" : ""
          )}
          onClick={() => onSelectTemplate(template.id)}
        >
          <CardContent className="p-4">
            <div className="space-y-2">
              <h3 className="font-medium">{template.name}</h3>
              <p className="text-sm text-muted-foreground">{template.description}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default TemplateSelector;
