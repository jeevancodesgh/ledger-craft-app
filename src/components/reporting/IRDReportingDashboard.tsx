import React from 'react';
import { format } from 'date-fns';
import {
  FileText,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Send,
  Eye,
  Plus,
  Building,
  DollarSign,
  TrendingUp,
  Info,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { TaxReturn } from '@/types/payment';

interface IRDReportingDashboardProps {
  taxReturns: TaxReturn[];
  nextGSTDueDate: string;
  complianceStatus: {
    isCompliant: boolean;
    issues: string[];
    warnings: string[];
  };
  onCreateGSTReturn: () => void;
  onCreateIncomeReturn: (period: { start: string; end: string }) => void;
  onSubmitReturn: (returnId: string) => void;
  onExportReturn: (returnId: string, format: string) => void;
  isLoading?: boolean;
}

export function IRDReportingDashboard({
  taxReturns,
  nextGSTDueDate,
  complianceStatus,
  onCreateGSTReturn,
  onCreateIncomeReturn,
  onSubmitReturn,
  onExportReturn,
  isLoading = false
}: IRDReportingDashboardProps) {
  // Separate returns by type
  const gstReturns = taxReturns.filter(r => r.returnType === 'GST');
  const incomeReturns = taxReturns.filter(r => r.returnType === 'Income_Tax');

  // Calculate compliance metrics
  const overdueReturns = taxReturns.filter(r => 
    r.status === 'draft' && new Date(nextGSTDueDate) < new Date()
  );
  
  const completedReturns = taxReturns.filter(r => r.status === 'submitted');
  const complianceScore = taxReturns.length > 0 
    ? (completedReturns.length / taxReturns.length) * 100 
    : 100;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Badge className="bg-green-100 text-green-800">Submitted</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'approved':
        return <Badge className="bg-blue-100 text-blue-800">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getReconBadge = (status?: string) => {
    switch (status) {
      case 'ready':
        return <Badge className="bg-emerald-50 text-emerald-700">Reconciled</Badge>;
      case 'warning':
        return <Badge className="bg-amber-50 text-amber-800">Check recs</Badge>;
      case 'not_applicable':
        return <Badge variant="secondary">No banks</Badge>;
      default:
        return <Badge variant="outline">Not checked</Badge>;
    }
  };

  const formatCurrency = (amount: number) => `$${amount.toLocaleString()}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">IRD Reporting</h1>
          <p className="text-muted-foreground">
            New Zealand tax returns and compliance monitoring
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => window.open('https://www.ird.govt.nz', '_blank')}>
            <ExternalLink className="mr-2 h-4 w-4" />
            IRD Website
          </Button>
          
          <Button onClick={onCreateGSTReturn}>
            <Plus className="mr-2 h-4 w-4" />
            New GST Return
          </Button>
        </div>
      </div>

      {/* Compliance Status */}
      <Card className={`border-l-4 ${
        complianceStatus.isCompliant ? 'border-l-green-500' : 'border-l-red-500'
      }`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {complianceStatus.isCompliant ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              )}
              Compliance Status
            </CardTitle>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Compliance Score</p>
                <p className="text-2xl font-bold">{complianceScore.toFixed(0)}%</p>
              </div>
              <Progress value={complianceScore} className="w-24" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {complianceStatus.issues.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <strong>Issues requiring attention:</strong>
                    <ul className="list-disc list-inside space-y-1">
                      {complianceStatus.issues.map((issue, index) => (
                        <li key={index} className="text-sm">{issue}</li>
                      ))}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {complianceStatus.warnings.length > 0 && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <strong>Warnings:</strong>
                    <ul className="list-disc list-inside space-y-1">
                      {complianceStatus.warnings.map((warning, index) => (
                        <li key={index} className="text-sm">{warning}</li>
                      ))}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {complianceStatus.isCompliant && complianceStatus.issues.length === 0 && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  All tax obligations are up to date. Next GST return due on {format(new Date(nextGSTDueDate), 'dd MMMM yyyy')}.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Returns</p>
                <p className="text-2xl font-bold">{taxReturns.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Submitted</p>
                <p className="text-2xl font-bold">{completedReturns.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{overdueReturns.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Calendar className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Next Due</p>
                <p className="text-sm font-bold">
                  {format(new Date(nextGSTDueDate), 'dd MMM')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tax Returns */}
      <Tabs defaultValue="gst" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="gst">GST Returns</TabsTrigger>
          <TabsTrigger value="income">Income Tax</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="gst" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>GST Returns</CardTitle>
                <Button variant="outline" onClick={onCreateGSTReturn}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Return
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {gstReturns.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    No GST returns found. Create your first GST return to get started.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Period</TableHead>
                        <TableHead>Total Sales</TableHead>
                        <TableHead>GST on Sales</TableHead>
                        <TableHead>GST on Purchases</TableHead>
                        <TableHead>Net GST</TableHead>
                        <TableHead>Recon</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {gstReturns.map((gstReturn) => (
                        <TableRow key={gstReturn.id}>
                          <TableCell>
                            <div className="text-sm">
                              <p className="font-medium">
                                {format(new Date(gstReturn.periodStart), 'MMM yyyy')} - {format(new Date(gstReturn.periodEnd), 'MMM yyyy')}
                              </p>
                              <p className="text-muted-foreground">
                                {gstReturn.returnType}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(gstReturn.totalSales)}
                          </TableCell>
                          <TableCell className="font-medium text-green-600">
                            {formatCurrency(gstReturn.gstOnSales)}
                          </TableCell>
                          <TableCell className="font-medium text-blue-600">
                            {formatCurrency(gstReturn.gstOnPurchases)}
                          </TableCell>
                          <TableCell className={`font-medium ${
                            gstReturn.netGst >= 0 ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {formatCurrency(Math.abs(gstReturn.netGst))}
                            {gstReturn.netGst < 0 && ' (refund)'}
                          </TableCell>
                          <TableCell>
                            {getReconBadge(gstReturn.returnData?.reconciliation?.status)}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(gstReturn.status)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => onExportReturn(gstReturn.id, 'pdf')}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              {gstReturn.status === 'draft' && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => onSubmitReturn(gstReturn.id)}
                                >
                                  <Send className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="income" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Income Tax Returns</CardTitle>
            </CardHeader>
            <CardContent>
              {incomeReturns.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    No income tax returns found. Income tax returns are typically filed annually.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tax Year</TableHead>
                        <TableHead>Gross Income</TableHead>
                        <TableHead>Deductions</TableHead>
                        <TableHead>Taxable Income</TableHead>
                        <TableHead>Tax Due</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {incomeReturns.map((incomeReturn) => (
                        <TableRow key={incomeReturn.id}>
                          <TableCell>
                            <div className="text-sm">
                              <p className="font-medium">
                                {format(new Date(incomeReturn.periodStart), 'yyyy')}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(incomeReturn.totalSales)}
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(incomeReturn.totalPurchases)}
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(Math.max(0, incomeReturn.totalSales - incomeReturn.totalPurchases))}
                          </TableCell>
                          <TableCell className="font-medium">
                            {incomeReturn.returnData?.incomeTax?.taxDue 
                              ? formatCurrency(incomeReturn.returnData.incomeTax.taxDue)
                              : '-'
                            }
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(incomeReturn.status)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => onExportReturn(incomeReturn.id, 'pdf')}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <ComplianceMonitoring 
            taxReturns={taxReturns}
            nextDueDate={nextGSTDueDate}
            complianceStatus={complianceStatus}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Compliance Monitoring Component
function ComplianceMonitoring({
  taxReturns,
  nextDueDate,
  complianceStatus
}: {
  taxReturns: TaxReturn[];
  nextDueDate: string;
  complianceStatus: any;
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Filing Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">GST Return</p>
                <p className="text-sm text-muted-foreground">Quarterly filing</p>
              </div>
              <div className="text-right">
                <p className="font-medium">Next due: {format(new Date(nextDueDate), 'dd MMM yyyy')}</p>
                <Badge variant="outline">28 days after quarter end</Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Income Tax Return</p>
                <p className="text-sm text-muted-foreground">Annual filing</p>
              </div>
              <div className="text-right">
                <p className="font-medium">Due: 7 July 2024</p>
                <Badge variant="outline">Annual deadline</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Compliance Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>GST registration is active</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>Tax calculations are configured</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>Invoice tax codes are correct</span>
            </div>
            <div className="flex items-center gap-3">
              {complianceStatus.isCompliant ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              )}
              <span>All returns filed on time</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}