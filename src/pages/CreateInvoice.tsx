import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  CalendarIcon, 
  Plus, 
  Trash2, 
  Download, 
  Save, 
  ArrowLeft,
  Eye,
  ChevronsUpDown,
  Edit,
  Check
} from 'lucide-react';
import { generateInvoicePdf } from '@/utils/pdfUtils';
import { formatCurrency, formatDate } from '@/utils/invoiceUtils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { LineItem, Invoice } from '@/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import InvoiceForm from "@/components/invoice/InvoiceForm";

function getNextInvoiceNumber(format: string | null, sequence: number | null): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const seq = (sequence || 0) + 1;
  const paddedSeq = String(seq).padStart(3, '0');

  let result = (format || 'INV-YYYY-MM-DD-001')
    .replace(/YYYY/g, year.toString())
    .replace(/MM/g, month)
    .replace(/DD/g, day)
    .replace(/001|SEQ/g, paddedSeq);

  return result;
}

const invoiceFormSchema = z.object({
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  customerId: z.string().min(1, 'Customer is required'),
  date: z.date({
    required_error: "Invoice date is required",
  }),
  dueDate: z.date({
    required_error: "Due date is required",
  }),
  notes: z.string().optional(),
  terms: z.string().optional(),
  currency: z.string().default('USD'),
});

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

const CreateInvoice = () => {
  const { customers, isLoadingCustomers, createInvoice, businessProfile } = useAppContext();
  const navigate = useNavigate();

  const handleSubmit = async (
    values: any,
    items: any,
    total: number,
    subtotal: number,
    taxAmount: number,
    additionalCharges: number,
    discount: number
  ) => {
    try {
      await createInvoice({
        invoiceNumber: values.invoiceNumber,
        customerId: values.customerId,
        date: formatDate(values.date),
        dueDate: formatDate(values.dueDate),
        items: items,
        subtotal: subtotal,
        taxAmount: taxAmount,
        total: total,
        status: 'draft',
        currency: values.currency,
        notes: values.notes,
        terms: values.terms,
        additionalCharges: additionalCharges,
        discount: discount,
      });
      navigate('/invoices');
    } catch (error) {
      console.error('Error creating invoice:', error);
    }
  };

  return (
    <InvoiceForm
      mode="create"
      customers={customers}
      businessProfile={businessProfile}
      isLoadingCustomers={isLoadingCustomers}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/invoices')}
    />
  );
};

export default CreateInvoice;
