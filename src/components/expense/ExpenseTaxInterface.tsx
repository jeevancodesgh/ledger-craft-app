import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calculator,
  Receipt,
  Building2,
  Wrench,
  AlertTriangle,
  Info,
  CheckCircle,
  DollarSign,
  Calendar,
  FileText,
  Zap,
  PiggyBank
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { supabaseDataService } from '@/services/supabaseDataService';

interface ExpenseFormData {
  description: string;
  amount: number;
  category: string;
  subcategory: string;
  date: string;
  isCapitalExpense: boolean;
  isGstClaimable: boolean;
  gstAmount: number;
  netAmount: number;
  receiptNumber?: string;
  notes?: string;
  supplier?: string;
}

interface TaxCategory {
  id: string;
  name: string;
  description: string;
  isCapitalDefault: boolean;
  gstClaimable: boolean;
  subcategories: string[];
}

interface ExpenseTaxInterfaceProps {
  expense?: ExpenseFormData;
  onSave: (expenseData: ExpenseFormData) => void;
  onCancel: () => void;
  className?: string;
}

export const ExpenseTaxInterface: React.FC<ExpenseTaxInterfaceProps> = ({
  expense,
  onSave,
  onCancel,
  className
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<ExpenseFormData>({
    description: '',
    amount: 0,
    category: '',
    subcategory: '',
    date: new Date().toISOString().split('T')[0],
    isCapitalExpense: false,
    isGstClaimable: true,
    gstAmount: 0,
    netAmount: 0,
    receiptNumber: '',
    notes: '',
    supplier: '',
    ...expense
  });

  const [taxRate, setTaxRate] = useState(0.15); // Default GST rate for NZ
  const [isAmountIncludingGst, setIsAmountIncludingGst] = useState(true);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Predefined tax categories with GST claimability rules
  const taxCategories: TaxCategory[] = [
    {
      id: 'office',
      name: 'Office & Administration',
      description: 'Office supplies, stationery, software subscriptions',
      isCapitalDefault: false,
      gstClaimable: true,
      subcategories: ['Stationery', 'Software', 'Postage', 'Office Rent', 'Utilities']
    },
    {
      id: 'travel',
      name: 'Travel & Transport',
      description: 'Business travel, vehicle expenses, fuel',
      isCapitalDefault: false,
      gstClaimable: true,
      subcategories: ['Fuel', 'Parking', 'Accommodation', 'Flights', 'Vehicle Maintenance']
    },
    {
      id: 'equipment',
      name: 'Equipment & Machinery',
      description: 'Tools, machinery, computer equipment',
      isCapitalDefault: true,
      gstClaimable: true,
      subcategories: ['Computers', 'Machinery', 'Tools', 'Furniture', 'Software Licenses']
    },
    {
      id: 'marketing',
      name: 'Marketing & Advertising',
      description: 'Advertising, promotions, website costs',
      isCapitalDefault: false,
      gstClaimable: true,
      subcategories: ['Online Ads', 'Print Advertising', 'Website', 'Promotions', 'Branding']
    },
    {
      id: 'professional',
      name: 'Professional Services',
      description: 'Legal, accounting, consulting fees',
      isCapitalDefault: false,
      gstClaimable: true,
      subcategories: ['Legal Fees', 'Accounting', 'Consulting', 'Banking Fees', 'Insurance']
    },
    {
      id: 'entertainment',
      name: 'Entertainment & Meals',
      description: 'Business meals, client entertainment',
      isCapitalDefault: false,
      gstClaimable: false, // 50% rule for entertainment in NZ
      subcategories: ['Client Meals', 'Business Entertainment', 'Staff Functions', 'Conference Meals']
    }
  ];

  useEffect(() => {
    // Load tax configuration
    const loadTaxConfig = async () => {
      if (user?.id) {
        try {
          const config = await supabaseDataService.getTaxConfiguration(user.id);
          if (config) {
            setTaxRate(config.taxRate);
          }
        } catch (error) {
          console.error('Failed to load tax configuration:', error);
        }
      }
    };
    loadTaxConfig();
  }, [user?.id]);

  // Calculate GST amounts when relevant fields change
  useEffect(() => {
    calculateGstAmounts();
  }, [formData.amount, formData.isGstClaimable, taxRate, isAmountIncludingGst]);

  const calculateGstAmounts = () => {
    if (!formData.isGstClaimable || formData.amount <= 0) {
      setFormData(prev => ({
        ...prev,
        gstAmount: 0,
        netAmount: formData.amount
      }));
      return;
    }

    let gstAmount: number;
    let netAmount: number;

    if (isAmountIncludingGst) {
      // Amount includes GST - extract GST
      netAmount = formData.amount / (1 + taxRate);
      gstAmount = formData.amount - netAmount;
    } else {
      // Amount excludes GST - add GST
      netAmount = formData.amount;
      gstAmount = formData.amount * taxRate;
    }

    setFormData(prev => ({
      ...prev,
      gstAmount: Math.round(gstAmount * 100) / 100,
      netAmount: Math.round(netAmount * 100) / 100
    }));
  };

  const handleCategoryChange = (categoryId: string) => {
    const category = taxCategories.find(c => c.id === categoryId);
    if (category) {
      setFormData(prev => ({
        ...prev,
        category: categoryId,
        subcategory: '',
        isCapitalExpense: category.isCapitalDefault,
        isGstClaimable: category.gstClaimable
      }));
    }
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!formData.description.trim()) {
      errors.push('Description is required');
    }
    if (formData.amount <= 0) {
      errors.push('Amount must be greater than zero');
    }
    if (!formData.category) {
      errors.push('Category is required');
    }
    if (!formData.date) {
      errors.push('Date is required');
    }

    // Business rule validations
    if (formData.isCapitalExpense && formData.amount < 500) {
      errors.push('Capital expenses are typically $500 or more');
    }

    if (formData.category === 'entertainment' && formData.isGstClaimable) {
      errors.push('Entertainment expenses have limited GST claimability (50% rule)');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSave(formData);
    }
  };

  const selectedCategory = taxCategories.find(c => c.id === formData.category);
  const totalAmount = isAmountIncludingGst ? formData.amount : formData.netAmount + formData.gstAmount;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-blue-600" />
            {expense ? 'Edit Expense' : 'Add New Expense'}
            <Badge variant="outline" className="ml-auto">
              GST Smart Calculator
            </Badge>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="description">Description *</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="e.g., Office supplies from Warehouse Stationery"
              />
            </div>

            <div>
              <Label htmlFor="supplier">Supplier</Label>
              <Input
                id="supplier"
                value={formData.supplier}
                onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                placeholder="e.g., Warehouse Stationery"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="receipt">Receipt #</Label>
                <Input
                  id="receipt"
                  value={formData.receiptNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, receiptNumber: e.target.value }))}
                  placeholder="Receipt number"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes about this expense"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Tax Classification */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Tax Classification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category} onValueChange={handleCategoryChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select expense category" />
                </SelectTrigger>
                <SelectContent>
                  {taxCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-2">
                        <span>{category.name}</span>
                        <Badge variant={category.gstClaimable ? "default" : "secondary"} className="text-xs">
                          {category.gstClaimable ? "GST Claimable" : "Limited GST"}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCategory && (
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedCategory.description}
                </p>
              )}
            </div>

            {selectedCategory && (
              <div>
                <Label htmlFor="subcategory">Subcategory</Label>
                <Select 
                  value={formData.subcategory} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, subcategory: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subcategory" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedCategory.subcategories.map((sub) => (
                      <SelectItem key={sub} value={sub}>
                        {sub}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  <Label htmlFor="capital">Capital Expense</Label>
                </div>
                <Switch
                  id="capital"
                  checked={formData.isCapitalExpense}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isCapitalExpense: checked }))}
                />
              </div>
              {formData.isCapitalExpense && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Capital expenses may require different depreciation treatment
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <Label htmlFor="gst-claimable">GST Claimable</Label>
                </div>
                <Switch
                  id="gst-claimable"
                  checked={formData.isGstClaimable}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isGstClaimable: checked }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* GST Calculator */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            GST Calculator
            <Badge variant="outline" className="ml-auto">
              {(taxRate * 100).toFixed(1)}% GST Rate
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Amount Input */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="amount">Amount *</Label>
                <div className="flex items-center gap-2">
                  <Label htmlFor="amount-type" className="text-xs">
                    {isAmountIncludingGst ? 'Including GST' : 'Excluding GST'}
                  </Label>
                  <Switch
                    id="amount-type"
                    checked={isAmountIncludingGst}
                    onCheckedChange={setIsAmountIncludingGst}
                  />
                </div>
              </div>
              
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                  className="pl-10"
                />
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  {isAmountIncludingGst 
                    ? 'GST will be extracted from the total amount'
                    : 'GST will be added to this amount'
                  }
                </AlertDescription>
              </Alert>
            </div>

            {/* GST Breakdown */}
            <div className="space-y-4">
              <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-sm">GST Breakdown</h4>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Net Amount:</span>
                    <span className="font-medium">${formData.netAmount.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">GST Amount:</span>
                    <span className={cn(
                      "font-medium",
                      formData.isGstClaimable ? "text-green-600" : "text-red-600"
                    )}>
                      ${formData.gstAmount.toFixed(2)}
                      {!formData.isGstClaimable && <span className="ml-1 text-xs">(Not Claimable)</span>}
                    </span>
                  </div>
                </div>

                <Separator />
                
                <div className="flex justify-between font-semibold">
                  <span>Total Amount:</span>
                  <span>${totalAmount.toFixed(2)}</span>
                </div>

                {formData.isGstClaimable && formData.gstAmount > 0 && (
                  <div className="text-xs text-green-700 bg-green-50 p-2 rounded">
                    <PiggyBank className="h-3 w-3 inline mr-1" />
                    You can claim ${formData.gstAmount.toFixed(2)} GST back from IRD
                  </div>
                )}
              </div>

              {formData.category === 'entertainment' && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Entertainment expenses: Only 50% of GST may be claimable under NZ tax rules
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          {expense ? 'Update Expense' : 'Save Expense'}
        </Button>
      </div>
    </div>
  );
};