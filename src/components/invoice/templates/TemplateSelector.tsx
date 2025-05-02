
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { InvoiceTemplate, InvoiceTemplateId } from './InvoiceTemplates';
import { cn } from '@/lib/utils';

interface TemplateSelectorProps {
  templates: InvoiceTemplate[];
  selectedTemplate: InvoiceTemplateId;
  onSelectTemplate: (templateId: InvoiceTemplateId) => void;
  isMobile?: boolean;
}

const TemplateSelector = ({
  templates,
  selectedTemplate,
  onSelectTemplate,
  isMobile
}: TemplateSelectorProps) => {
  return (
    <div className={cn("grid gap-2", 
      isMobile ? "grid-cols-2" : "grid-cols-3 md:grid-cols-5")}>
      {templates.map((template) => (
        <Card
          key={template.id}
          className={cn(
            "cursor-pointer transition-all",
            selectedTemplate === template.id 
              ? "border-primary bg-primary/5" 
              : "hover:border-primary/50",
            isMobile && "p-0"
          )}
          onClick={() => onSelectTemplate(template.id)}
        >
          <CardContent className={cn("p-3", isMobile && "p-2")}>
            <div className="text-center">
              <p className={cn("font-medium", isMobile && "text-sm")}>{template.name}</p>
              {!isMobile && (
                <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default TemplateSelector;
