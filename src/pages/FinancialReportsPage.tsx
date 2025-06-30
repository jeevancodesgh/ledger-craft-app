import React, { useState, useEffect } from 'react';
import { FileBarChart, Download, RefreshCw, Filter, Calendar, TrendingUp, DollarSign, Receipt, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { BreadcrumbNavigation } from '@/components/common/BreadcrumbNavigation';

interface FinancialReport {
  id: string;
  name: string;
  type: 'profit_loss' | 'balance_sheet' | 'cash_flow' | 'trial_balance' | 'accounts_receivable' | 'accounts_payable';
  period: {
    startDate: string;
    endDate: string;
  };
  data: any;
  generatedAt: string;
}

interface ReportSummary {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  grossMargin: number;
  totalAssets: number;
  totalLiabilities: number;
  cashFlow: number;
  periodsCompared: number;
}

export default function FinancialReportsPage() {
  const [reports, setReports] = useState<FinancialReport[]>([]);
  const [reportSummary, setReportSummary] = useState<ReportSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReportType, setSelectedReportType] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('current_month');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  
  const { toast } = useToast();

  const reportTypes = [
    { value: 'all', label: 'All Reports' },
    { value: 'profit_loss', label: 'Profit & Loss' },
    { value: 'balance_sheet', label: 'Balance Sheet' },
    { value: 'cash_flow', label: 'Cash Flow' },
    { value: 'trial_balance', label: 'Trial Balance' },
    { value: 'accounts_receivable', label: 'Accounts Receivable' },
    { value: 'accounts_payable', label: 'Accounts Payable' }
  ];

  const periodOptions = [
    { value: 'current_month', label: 'Current Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'current_quarter', label: 'Current Quarter' },
    { value: 'last_quarter', label: 'Last Quarter' },
    { value: 'current_year', label: 'Current Year' },
    { value: 'last_year', label: 'Last Year' },
    { value: 'custom', label: 'Custom Range' }
  ];

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // Mock financial reports data
      const mockReports: FinancialReport[] = [
        {
          id: 'report-1',
          name: 'January 2024 Profit & Loss',
          type: 'profit_loss',
          period: {
            startDate: '2024-01-01',
            endDate: '2024-01-31'
          },
          data: {
            totalRevenue: 125000,
            costOfGoodsSold: 45000,
            grossProfit: 80000,
            operatingExpenses: 42500,
            netIncome: 37500
          },
          generatedAt: '2024-02-01T09:00:00Z'
        },
        {
          id: 'report-2',
          name: 'January 2024 Balance Sheet',
          type: 'balance_sheet',
          period: {
            startDate: '2024-01-31',
            endDate: '2024-01-31'
          },
          data: {
            totalAssets: 285000,
            currentAssets: 113000,
            fixedAssets: 172000,
            totalLiabilities: 87000,
            currentLiabilities: 37000,
            longTermLiabilities: 50000,
            equity: 198000
          },
          generatedAt: '2024-02-01T09:15:00Z'
        },
        {
          id: 'report-3',
          name: 'Q4 2023 Cash Flow Statement',
          type: 'cash_flow',
          period: {
            startDate: '2023-10-01',
            endDate: '2023-12-31'
          },
          data: {
            operatingCashFlow: 89500,
            investingCashFlow: -25000,
            financingCashFlow: -15000,
            netCashFlow: 49500,
            beginningCash: 18500,
            endingCash: 68000
          },
          generatedAt: '2024-01-05T14:30:00Z'
        },
        {
          id: 'report-4',
          name: 'January 2024 Trial Balance',
          type: 'trial_balance',
          period: {
            startDate: '2024-01-31',
            endDate: '2024-01-31'
          },
          data: {
            totalDebits: 472000,
            totalCredits: 472000,
            accountCount: 45,
            balanceStatus: 'balanced'
          },
          generatedAt: '2024-02-01T10:00:00Z'
        }
      ];

      // Mock report summary
      const mockSummary: ReportSummary = {
        totalRevenue: 125000,
        totalExpenses: 87500,
        netIncome: 37500,
        grossMargin: 64.0,
        totalAssets: 285000,
        totalLiabilities: 87000,
        cashFlow: 49500,
        periodsCompared: 3
      };

      setReports(mockReports);
      setReportSummary(mockSummary);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load financial reports",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleGenerateReport = async (reportType: string) => {
    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newReport: FinancialReport = {
        id: `report-${Date.now()}`,
        name: `${format(new Date(), 'MMMM yyyy')} ${reportTypes.find(r => r.value === reportType)?.label}`,
        type: reportType as any,
        period: {
          startDate: startDate?.toISOString().split('T')[0] || '2024-01-01',
          endDate: endDate?.toISOString().split('T')[0] || '2024-01-31'
        },
        data: {},
        generatedAt: new Date().toISOString()
      };

      setReports(prev => [newReport, ...prev]);
      
      toast({
        title: "Success",
        description: `${reportTypes.find(r => r.value === reportType)?.label} report generated successfully`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive"
      });
    }
  };

  const handleExportReport = async (reportId: string, format: string) => {
    try {
      // Simulate export
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Success",
        description: `Report exported as ${format.toUpperCase()}`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export report",
        variant: "destructive"
      });
    }
  };

  const filteredReports = reports.filter(report => 
    selectedReportType === 'all' || report.type === selectedReportType
  );

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case 'profit_loss': return <TrendingUp className="h-4 w-4" />;
      case 'balance_sheet': return <Target className="h-4 w-4" />;
      case 'cash_flow': return <DollarSign className="h-4 w-4" />;
      case 'trial_balance': return <Receipt className="h-4 w-4" />;
      default: return <FileBarChart className="h-4 w-4" />;
    }
  };

  const getReportTypeBadge = (type: string) => {
    const colors = {
      profit_loss: 'bg-green-100 text-green-800',
      balance_sheet: 'bg-blue-100 text-blue-800',
      cash_flow: 'bg-purple-100 text-purple-800',
      trial_balance: 'bg-orange-100 text-orange-800',
      accounts_receivable: 'bg-yellow-100 text-yellow-800',
      accounts_payable: 'bg-red-100 text-red-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>

        {/* Summary Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-12 h-12 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-6 w-24 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters Skeleton */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <Skeleton className="h-10 w-full sm:w-48" />
              <Skeleton className="h-10 w-full sm:w-48" />
              <Skeleton className="h-10 w-full sm:w-48" />
            </div>
          </CardContent>
        </Card>

        {/* Table Skeleton */}
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
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
      {/* Breadcrumb Navigation */}
      <BreadcrumbNavigation />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Financial Reports</h1>
          <p className="text-muted-foreground">
            Generate and view comprehensive financial reports and analytics
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={fetchReports}
            disabled={isLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Select onValueChange={(value) => handleGenerateReport(value)}>
            <SelectTrigger className="w-48">
              <FileBarChart className="mr-2 h-4 w-4" />
              Generate Report
            </SelectTrigger>
            <SelectContent>
              {reportTypes.slice(1).map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      {reportSummary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">${reportSummary.totalRevenue.toLocaleString()}</p>
                  <p className="text-xs text-green-600">+12.5% from last period</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Net Income</p>
                  <p className="text-2xl font-bold">${reportSummary.netIncome.toLocaleString()}</p>
                  <p className="text-xs text-blue-600">{reportSummary.grossMargin}% gross margin</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Target className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Assets</p>
                  <p className="text-2xl font-bold">${reportSummary.totalAssets.toLocaleString()}</p>
                  <p className="text-xs text-purple-600">
                    ${reportSummary.totalLiabilities.toLocaleString()} liabilities
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Receipt className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cash Flow</p>
                  <p className="text-2xl font-bold">${reportSummary.cashFlow.toLocaleString()}</p>
                  <p className="text-xs text-orange-600">Last {reportSummary.periodsCompared} periods</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={selectedReportType} onValueChange={setSelectedReportType}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Report Type" />
              </SelectTrigger>
              <SelectContent>
                {reportTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-full sm:w-48">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                {periodOptions.map((period) => (
                  <SelectItem key={period.value} value={period.value}>
                    {period.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedPeriod === 'custom' && (
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={startDate ? startDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : undefined)}
                  placeholder="Start Date"
                  className="w-full sm:w-48"
                />
                <Input
                  type="date"
                  value={endDate ? endDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : undefined)}
                  placeholder="End Date"
                  className="w-full sm:w-48"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Generated Reports</span>
            <Badge variant="outline">{filteredReports.length} reports</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Generated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {getReportTypeIcon(report.type)}
                        <span className="font-medium">{report.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getReportTypeBadge(report.type)}>
                        {reportTypes.find(t => t.value === report.type)?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{format(new Date(report.period.startDate), 'dd MMM yyyy')}</p>
                        <p className="text-muted-foreground">
                          to {format(new Date(report.period.endDate), 'dd MMM yyyy')}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(report.generatedAt), 'dd MMM yyyy HH:mm')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleExportReport(report.id, 'pdf')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleExportReport(report.id, 'excel')}
                        >
                          <FileBarChart className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredReports.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No reports found. Generate your first financial report using the button above.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}