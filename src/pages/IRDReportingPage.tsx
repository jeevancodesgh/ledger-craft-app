import React, { useState, useEffect } from 'react';
import { IRDReportingDashboard } from '@/components/reporting/IRDReportingDashboard';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { TaxReturn } from '@/types/payment';

export default function IRDReportingPage() {
  const [taxReturns, setTaxReturns] = useState<TaxReturn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { toast } = useToast();

  // Mock compliance status
  const complianceStatus = {
    isCompliant: true,
    issues: [] as string[],
    warnings: [
      'Next GST return due in 15 days',
      'Consider reviewing expense categorization for tax optimization'
    ]
  };

  const nextGSTDueDate = '2024-02-28'; // 28th of month following quarter

  const fetchTaxReturns = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // Mock tax returns data
      const mockTaxReturns: TaxReturn[] = [
        {
          id: 'gst-2024-q1',
          userId: 'user-1',
          periodStart: '2024-01-01',
          periodEnd: '2024-03-31',
          returnType: 'GST',
          totalSales: 125000,
          totalPurchases: 45000,
          gstOnSales: 18750,
          gstOnPurchases: 6750,
          netGst: 12000,
          status: 'draft',
          returnData: {
            gstReturn: {
              salesDetails: {
                standardRated: 108700,
                zeroRated: 16300,
                exempt: 0,
                totalSales: 125000,
                gstOnSales: 18750
              },
              purchaseDetails: {
                standardRated: 40000,
                capitalGoods: 5000,
                totalPurchases: 45000,
                gstOnPurchases: 6750
              },
              adjustments: {
                badDebts: 0,
                otherAdjustments: 0
              }
            }
          },
          createdAt: '2024-03-15T10:00:00Z',
          updatedAt: '2024-03-15T10:00:00Z'
        },
        {
          id: 'gst-2023-q4',
          userId: 'user-1',
          periodStart: '2023-10-01',
          periodEnd: '2023-12-31',
          returnType: 'GST',
          totalSales: 110000,
          totalPurchases: 38000,
          gstOnSales: 16500,
          gstOnPurchases: 5700,
          netGst: 10800,
          status: 'submitted',
          submittedAt: '2024-01-25T14:30:00Z',
          irdReference: 'IRD-GST-2023Q4-12345',
          returnData: {
            gstReturn: {
              salesDetails: {
                standardRated: 95600,
                zeroRated: 14400,
                exempt: 0,
                totalSales: 110000,
                gstOnSales: 16500
              },
              purchaseDetails: {
                standardRated: 35000,
                capitalGoods: 3000,
                totalPurchases: 38000,
                gstOnPurchases: 5700
              },
              adjustments: {
                badDebts: 0,
                otherAdjustments: 0
              }
            }
          },
          createdAt: '2024-01-10T09:00:00Z',
          updatedAt: '2024-01-25T14:30:00Z'
        },
        {
          id: 'income-2023',
          userId: 'user-1',
          periodStart: '2023-04-01',
          periodEnd: '2024-03-31',
          returnType: 'Income_Tax',
          totalSales: 450000,
          totalPurchases: 165000,
          gstOnSales: 0,
          gstOnPurchases: 0,
          netGst: 0,
          status: 'submitted',
          submittedAt: '2024-06-15T11:00:00Z',
          irdReference: 'IRD-INC-2023-67890',
          returnData: {
            incomeTax: {
              grossIncome: 450000,
              allowableDeductions: 165000,
              taxableIncome: 285000,
              taxDue: 65800,
              provisionalTax: 29925
            }
          },
          createdAt: '2024-05-01T10:00:00Z',
          updatedAt: '2024-06-15T11:00:00Z'
        }
      ];

      setTaxReturns(mockTaxReturns);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load tax returns",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxReturns();
  }, []);

  const handleCreateGSTReturn = async (period: { start: string; end: string }) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newReturn: TaxReturn = {
        id: `gst-${Date.now()}`,
        userId: 'user-1',
        periodStart: period.start,
        periodEnd: period.end,
        returnType: 'GST',
        totalSales: 0,
        totalPurchases: 0,
        gstOnSales: 0,
        gstOnPurchases: 0,
        netGst: 0,
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setTaxReturns(prev => [newReturn, ...prev]);
      
      toast({
        title: "Success",
        description: "GST return created successfully. Calculating tax amounts..."
      });

      // Simulate calculation update
      setTimeout(() => {
        setTaxReturns(prev => 
          prev.map(ret => ret.id === newReturn.id 
            ? {
                ...ret,
                totalSales: 85000,
                totalPurchases: 32000,
                gstOnSales: 12750,
                gstOnPurchases: 4800,
                netGst: 7950,
                returnData: {
                  gstReturn: {
                    salesDetails: {
                      standardRated: 73900,
                      zeroRated: 11100,
                      exempt: 0,
                      totalSales: 85000,
                      gstOnSales: 12750
                    },
                    purchaseDetails: {
                      standardRated: 30000,
                      capitalGoods: 2000,
                      totalPurchases: 32000,
                      gstOnPurchases: 4800
                    },
                    adjustments: {
                      badDebts: 0,
                      otherAdjustments: 0
                    }
                  }
                }
              }
            : ret
          )
        );

        toast({
          title: "Calculation Complete",
          description: "GST return has been calculated based on your transactions"
        });
      }, 1000);

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create GST return",
        variant: "destructive"
      });
    }
  };

  const handleCreateIncomeReturn = async (period: { start: string; end: string }) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Success",
        description: "Income tax return created successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create income tax return",
        variant: "destructive"
      });
    }
  };

  const handleSubmitReturn = async (returnId: string) => {
    try {
      // Simulate submission
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const irdReference = `IRD-${Date.now()}`;
      
      setTaxReturns(prev => 
        prev.map(ret => ret.id === returnId 
          ? {
              ...ret,
              status: 'submitted',
              submittedAt: new Date().toISOString(),
              irdReference
            }
          : ret
        )
      );
      
      toast({
        title: "Success",
        description: `Tax return submitted successfully. IRD Reference: ${irdReference}`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit tax return",
        variant: "destructive"
      });
    }
  };

  const handleExportReturn = async (returnId: string, format: string) => {
    try {
      // Simulate export
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Success",
        description: `Tax return exported as ${format.toUpperCase()}`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export tax return",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>

        {/* Compliance Status Skeleton */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-6 w-40" />
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-2 w-24" />
              </div>
            </div>
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>

        {/* Metrics Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <div>
                    <Skeleton className="h-4 w-20 mb-1" />
                    <Skeleton className="h-6 w-12" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Table Skeleton */}
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">IRD Tax Reporting</h1>
        <p className="text-muted-foreground">
          Manage GST returns, income tax filings, and compliance with New Zealand IRD requirements
        </p>
      </div>

      {/* IRD Reporting Dashboard */}
      <IRDReportingDashboard
        taxReturns={taxReturns}
        nextGSTDueDate={nextGSTDueDate}
        complianceStatus={complianceStatus}
        onCreateGSTReturn={handleCreateGSTReturn}
        onCreateIncomeReturn={handleCreateIncomeReturn}
        onSubmitReturn={handleSubmitReturn}
        onExportReturn={handleExportReturn}
        isLoading={isLoading}
      />
    </div>
  );
}