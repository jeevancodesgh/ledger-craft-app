import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  Calculator,
  CheckCircle,
  AlertTriangle,
  Info,
  Calendar,
  DollarSign,
  Building2,
  ArrowRight,
  ArrowLeft,
  Download,
  Send,
  Shield,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from "@/context/StableAuthContext";
import { supabaseDataService } from '@/services/supabaseDataService';
import { taxCalculationService } from '@/services/taxCalculationService';

interface GSTReturnData {
  returnPeriod: {
    startDate: string;
    endDate: string;
    quarter: string;
    year: number;
  };
  salesData: {
    totalSales: number;
    gstOnSales: number;
    zeroRatedSales: number;
    exemptSales: number;
  };
  purchaseData: {
    totalPurchases: number;
    gstOnPurchases: number;
    capitalGoods: number;
    gstOnCapitalGoods: number;
  };
  adjustments: {
    badDebtAdjustments: number;
    creditNoteAdjustments: number;
    otherAdjustments: number;
    adjustmentNotes: string;
  };
  netGST: number;
  paymentDue: number;
  refundDue: number;
  dueDate: string;
}

interface GSTReturnWizardProps {
  initialData?: Partial<GSTReturnData>;
  onComplete: (returnData: GSTReturnData) => void;
  onCancel: () => void;
  className?: string;
}

interface ValidationError {
  field: string;
  message: string;
}

export const GSTReturnWizard: React.FC<GSTReturnWizardProps> = ({
  initialData,
  onComplete,
  onCancel,
  className
}) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  
  const [returnData, setReturnData] = useState<GSTReturnData>({
    returnPeriod: {
      startDate: '',
      endDate: '',
      quarter: '',
      year: new Date().getFullYear()
    },
    salesData: {
      totalSales: 0,
      gstOnSales: 0,
      zeroRatedSales: 0,
      exemptSales: 0
    },
    purchaseData: {
      totalPurchases: 0,
      gstOnPurchases: 0,
      capitalGoods: 0,
      gstOnCapitalGoods: 0
    },
    adjustments: {
      badDebtAdjustments: 0,
      creditNoteAdjustments: 0,
      otherAdjustments: 0,
      adjustmentNotes: ''
    },
    netGST: 0,
    paymentDue: 0,
    refundDue: 0,
    dueDate: '',
    ...initialData
  });

  const steps = [
    { number: 1, title: 'Return Period', description: 'Select the GST return period' },
    { number: 2, title: 'Sales & Output', description: 'Sales data and GST charged' },
    { number: 3, title: 'Purchases & Input', description: 'Purchase data and GST paid' },
    { number: 4, title: 'Adjustments', description: 'Bad debts and other adjustments' },
    { number: 5, title: 'Review & Submit', description: 'Final review and submission' }
  ];

  const quarterOptions = [
    { value: 'Q1', label: 'Q1 (Jan-Mar)', months: [0, 1, 2] },
    { value: 'Q2', label: 'Q2 (Apr-Jun)', months: [3, 4, 5] },
    { value: 'Q3', label: 'Q3 (Jul-Sep)', months: [6, 7, 8] },
    { value: 'Q4', label: 'Q4 (Oct-Dec)', months: [9, 10, 11] }
  ];

  useEffect(() => {
    calculateNetGST();
  }, [returnData.salesData, returnData.purchaseData, returnData.adjustments]);

  const calculateNetGST = () => {
    const totalGSTCharged = returnData.salesData.gstOnSales;
    const totalGSTPaid = returnData.purchaseData.gstOnPurchases + returnData.purchaseData.gstOnCapitalGoods;
    const totalAdjustments = returnData.adjustments.badDebtAdjustments + 
                            returnData.adjustments.creditNoteAdjustments + 
                            returnData.adjustments.otherAdjustments;
    
    const netGST = totalGSTCharged - totalGSTPaid - totalAdjustments;
    
    setReturnData(prev => ({
      ...prev,
      netGST,
      paymentDue: netGST > 0 ? netGST : 0,
      refundDue: netGST < 0 ? Math.abs(netGST) : 0
    }));
  };

  const loadPeriodData = async (startDate: string, endDate: string) => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const [invoices, expenses] = await Promise.all([
        supabaseDataService.getInvoicesByPeriod(user.id, startDate, endDate),
        supabaseDataService.getExpensesByPeriod(user.id, startDate, endDate)
      ]);

      // Calculate sales data
      const totalSales = invoices.reduce((sum, inv) => sum + inv.total, 0);
      const gstOnSales = invoices.reduce((sum, inv) => sum + (inv.gstAmount || 0), 0);
      
      // Calculate purchase data
      const totalPurchases = expenses.reduce((sum, exp) => sum + exp.amount, 0);
      const gstOnPurchases = expenses
        .filter(exp => exp.isGstClaimable && !exp.isCapitalExpense)
        .reduce((sum, exp) => sum + (exp.gstAmount || 0), 0);
      
      const capitalGoods = expenses
        .filter(exp => exp.isCapitalExpense)
        .reduce((sum, exp) => sum + exp.amount, 0);
      const gstOnCapitalGoods = expenses
        .filter(exp => exp.isCapitalExpense && exp.isGstClaimable)
        .reduce((sum, exp) => sum + (exp.gstAmount || 0), 0);

      setReturnData(prev => ({
        ...prev,
        salesData: {
          ...prev.salesData,
          totalSales,
          gstOnSales
        },
        purchaseData: {
          ...prev.purchaseData,
          totalPurchases,
          gstOnPurchases,
          capitalGoods,
          gstOnCapitalGoods
        }
      }));
    } catch (error) {
      console.error('Error loading period data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuarterChange = (quarter: string) => {
    const quarterData = quarterOptions.find(q => q.value === quarter);
    if (!quarterData) return;

    const year = returnData.returnPeriod.year;
    const startMonth = quarterData.months[0];
    const endMonth = quarterData.months[2];
    
    const startDate = new Date(year, startMonth, 1);
    const endDate = new Date(year, endMonth + 1, 0);
    
    // Calculate due date (28th of month following quarter end)
    const dueDate = new Date(year, endMonth + 1, 28);
    
    const updatedPeriod = {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      quarter,
      year
    };

    setReturnData(prev => ({
      ...prev,
      returnPeriod: updatedPeriod,
      dueDate: dueDate.toISOString().split('T')[0]
    }));

    // Auto-load data for this period
    loadPeriodData(updatedPeriod.startDate, updatedPeriod.endDate);
  };

  const validateStep = (step: number): boolean => {
    const errors: ValidationError[] = [];

    switch (step) {
      case 1:
        if (!returnData.returnPeriod.quarter) {
          errors.push({ field: 'quarter', message: 'Please select a quarter' });
        }
        if (!returnData.returnPeriod.year) {
          errors.push({ field: 'year', message: 'Please select a year' });
        }
        break;
      
      case 2:
        if (returnData.salesData.totalSales < 0) {
          errors.push({ field: 'totalSales', message: 'Total sales cannot be negative' });
        }
        if (returnData.salesData.gstOnSales < 0) {
          errors.push({ field: 'gstOnSales', message: 'GST on sales cannot be negative' });
        }
        break;
      
      case 3:
        if (returnData.purchaseData.totalPurchases < 0) {
          errors.push({ field: 'totalPurchases', message: 'Total purchases cannot be negative' });
        }
        if (returnData.purchaseData.gstOnPurchases < 0) {
          errors.push({ field: 'gstOnPurchases', message: 'GST on purchases cannot be negative' });
        }
        break;
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = () => {
    if (validateStep(currentStep)) {
      onComplete(returnData);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="year">Tax Year</Label>
                <Select
                  value={returnData.returnPeriod.year.toString()}
                  onValueChange={(value) => setReturnData(prev => ({
                    ...prev,
                    returnPeriod: { ...prev.returnPeriod, year: parseInt(value) }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 5 }, (_, i) => {
                      const year = new Date().getFullYear() - i;
                      return (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="quarter">Quarter</Label>
                <Select
                  value={returnData.returnPeriod.quarter}
                  onValueChange={handleQuarterChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select quarter" />
                  </SelectTrigger>
                  <SelectContent>
                    {quarterOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {returnData.returnPeriod.startDate && (
              <Alert>
                <Calendar className="h-4 w-4" />
                <AlertDescription>
                  <strong>Return Period:</strong> {new Date(returnData.returnPeriod.startDate).toLocaleDateString('en-NZ')} to {new Date(returnData.returnPeriod.endDate).toLocaleDateString('en-NZ')}
                  <br />
                  <strong>Due Date:</strong> {new Date(returnData.dueDate).toLocaleDateString('en-NZ')}
                </AlertDescription>
              </Alert>
            )}

            {loading && (
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  Loading transaction data for the selected period...
                </AlertDescription>
              </Alert>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="totalSales">Total Sales (including GST)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="totalSales"
                    type="number"
                    step="0.01"
                    value={returnData.salesData.totalSales}
                    onChange={(e) => setReturnData(prev => ({
                      ...prev,
                      salesData: { ...prev.salesData, totalSales: parseFloat(e.target.value) || 0 }
                    }))}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="gstOnSales">GST on Sales</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="gstOnSales"
                    type="number"
                    step="0.01"
                    value={returnData.salesData.gstOnSales}
                    onChange={(e) => setReturnData(prev => ({
                      ...prev,
                      salesData: { ...prev.salesData, gstOnSales: parseFloat(e.target.value) || 0 }
                    }))}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="zeroRatedSales">Zero-rated Sales</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="zeroRatedSales"
                    type="number"
                    step="0.01"
                    value={returnData.salesData.zeroRatedSales}
                    onChange={(e) => setReturnData(prev => ({
                      ...prev,
                      salesData: { ...prev.salesData, zeroRatedSales: parseFloat(e.target.value) || 0 }
                    }))}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="exemptSales">GST Exempt Sales</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="exemptSales"
                    type="number"
                    step="0.01"
                    value={returnData.salesData.exemptSales}
                    onChange={(e) => setReturnData(prev => ({
                      ...prev,
                      salesData: { ...prev.salesData, exemptSales: parseFloat(e.target.value) || 0 }
                    }))}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                These values have been automatically calculated from your invoices for the selected period. 
                You can adjust them if needed before submitting.
              </AlertDescription>
            </Alert>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="totalPurchases">Total Purchases (including GST)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="totalPurchases"
                    type="number"
                    step="0.01"
                    value={returnData.purchaseData.totalPurchases}
                    onChange={(e) => setReturnData(prev => ({
                      ...prev,
                      purchaseData: { ...prev.purchaseData, totalPurchases: parseFloat(e.target.value) || 0 }
                    }))}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="gstOnPurchases">GST on Purchases</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="gstOnPurchases"
                    type="number"
                    step="0.01"
                    value={returnData.purchaseData.gstOnPurchases}
                    onChange={(e) => setReturnData(prev => ({
                      ...prev,
                      purchaseData: { ...prev.purchaseData, gstOnPurchases: parseFloat(e.target.value) || 0 }
                    }))}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="capitalGoods">Capital Goods Purchases</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="capitalGoods"
                    type="number"
                    step="0.01"
                    value={returnData.purchaseData.capitalGoods}
                    onChange={(e) => setReturnData(prev => ({
                      ...prev,
                      purchaseData: { ...prev.purchaseData, capitalGoods: parseFloat(e.target.value) || 0 }
                    }))}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="gstOnCapitalGoods">GST on Capital Goods</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="gstOnCapitalGoods"
                    type="number"
                    step="0.01"
                    value={returnData.purchaseData.gstOnCapitalGoods}
                    onChange={(e) => setReturnData(prev => ({
                      ...prev,
                      purchaseData: { ...prev.purchaseData, gstOnCapitalGoods: parseFloat(e.target.value) || 0 }
                    }))}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <Alert>
              <Building2 className="h-4 w-4" />
              <AlertDescription>
                Capital goods are assets like equipment, machinery, or property used in your business.
                GST on capital goods purchases can be claimed separately.
              </AlertDescription>
            </Alert>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label htmlFor="badDebtAdjustments">Bad Debt Adjustments</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="badDebtAdjustments"
                    type="number"
                    step="0.01"
                    value={returnData.adjustments.badDebtAdjustments}
                    onChange={(e) => setReturnData(prev => ({
                      ...prev,
                      adjustments: { ...prev.adjustments, badDebtAdjustments: parseFloat(e.target.value) || 0 }
                    }))}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="creditNoteAdjustments">Credit Note Adjustments</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="creditNoteAdjustments"
                    type="number"
                    step="0.01"
                    value={returnData.adjustments.creditNoteAdjustments}
                    onChange={(e) => setReturnData(prev => ({
                      ...prev,
                      adjustments: { ...prev.adjustments, creditNoteAdjustments: parseFloat(e.target.value) || 0 }
                    }))}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="otherAdjustments">Other Adjustments</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="otherAdjustments"
                    type="number"
                    step="0.01"
                    value={returnData.adjustments.otherAdjustments}
                    onChange={(e) => setReturnData(prev => ({
                      ...prev,
                      adjustments: { ...prev.adjustments, otherAdjustments: parseFloat(e.target.value) || 0 }
                    }))}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="adjustmentNotes">Adjustment Notes</Label>
              <Textarea
                id="adjustmentNotes"
                value={returnData.adjustments.adjustmentNotes}
                onChange={(e) => setReturnData(prev => ({
                  ...prev,
                  adjustments: { ...prev.adjustments, adjustmentNotes: e.target.value }
                }))}
                placeholder="Provide details about any adjustments made"
                rows={4}
              />
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Adjustments are typically rare. Only include adjustments if you have legitimate
                bad debts, credit notes, or other adjustments that affect your GST position.
              </AlertDescription>
            </Alert>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  GST Return Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-medium">Sales & Output Tax</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total Sales:</span>
                        <span>${returnData.salesData.totalSales.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>GST on Sales:</span>
                        <span>${returnData.salesData.gstOnSales.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Zero-rated Sales:</span>
                        <span>${returnData.salesData.zeroRatedSales.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium">Purchases & Input Tax</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total Purchases:</span>
                        <span>${returnData.purchaseData.totalPurchases.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>GST on Purchases:</span>
                        <span>${returnData.purchaseData.gstOnPurchases.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>GST on Capital Goods:</span>
                        <span>${returnData.purchaseData.gstOnCapitalGoods.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Net GST Position:</span>
                    <span className={cn(
                      "text-lg font-bold",
                      returnData.netGST > 0 ? "text-red-600" : returnData.netGST < 0 ? "text-green-600" : "text-gray-600"
                    )}>
                      ${Math.abs(returnData.netGST).toFixed(2)}
                    </span>
                  </div>

                  {returnData.paymentDue > 0 && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Payment Due:</strong> ${returnData.paymentDue.toFixed(2)}
                        <br />
                        <strong>Due Date:</strong> {new Date(returnData.dueDate).toLocaleDateString('en-NZ')}
                      </AlertDescription>
                    </Alert>
                  )}

                  {returnData.refundDue > 0 && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Refund Expected:</strong> ${returnData.refundDue.toFixed(2)}
                        <br />
                        IRD will process your refund within 15 working days.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>

            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Please review all information carefully before submitting. Once submitted,
                you'll receive a confirmation and the return will be filed with IRD.
              </AlertDescription>
            </Alert>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={cn('max-w-4xl mx-auto space-y-6', className)}>
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            GST Return Wizard
            <Badge variant="outline" className="ml-auto">
              Step {currentStep} of {steps.length}
            </Badge>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <Progress value={(currentStep / steps.length) * 100} className="w-full" />
            
            <div className="flex justify-between">
              {steps.map((step) => (
                <div
                  key={step.number}
                  className={cn(
                    "flex flex-col items-center text-center",
                    currentStep >= step.number ? "text-blue-600" : "text-gray-400"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mb-2",
                    currentStep >= step.number ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
                  )}>
                    {currentStep > step.number ? <CheckCircle className="h-4 w-4" /> : step.number}
                  </div>
                  <div className="text-xs font-medium">{step.title}</div>
                  <div className="text-xs text-gray-500 hidden md:block">{step.description}</div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>{error.message}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep - 1].title}</CardTitle>
        </CardHeader>
        <CardContent>
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <div>
          {currentStep > 1 && (
            <Button variant="outline" onClick={prevStep}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
          )}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          
          {currentStep < steps.length ? (
            <Button onClick={nextStep}>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Submit GST Return
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};