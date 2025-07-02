import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  AlertCircle, 
  RotateCcw,
  Eye,
  Download,
  TrendingUp,
  TrendingDown,
  Calendar,
  CreditCard,
  BarChart3,
  FileText
} from 'lucide-react';
import { BankAccount, TransactionImportResult } from '@/types/bankTransaction';

interface ImportSummaryProps {
  importResult: TransactionImportResult;
  bankAccount: BankAccount;
  onStartOver: () => void;
  onViewTransactions: () => void;
}

export function ImportSummary({
  importResult,
  bankAccount,
  onStartOver,
  onViewTransactions
}: ImportSummaryProps) {
  const formatAmount = (amount: number, currency: string = bankAccount.currency) => {
    return new Intl.NumberFormat('en-NZ', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getSuccessRate = () => {
    if (importResult.total === 0) return 0;
    return Math.round((importResult.imported / importResult.total) * 100);
  };

  const renderSummaryCards = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-green-600">
                {importResult.imported}
              </p>
              <p className="text-green-700 text-sm font-medium">
                Successfully Imported
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="pt-6">
          <div className="flex items-center">
            <AlertCircle className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-orange-600">
                {importResult.skipped}
              </p>
              <p className="text-orange-700 text-sm font-medium">
                Skipped (Duplicates)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center">
            <AlertCircle className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-red-600">
                {importResult.errors}
              </p>
              <p className="text-red-700 text-sm font-medium">
                Failed to Import
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-center">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-blue-600">
                {getSuccessRate()}%
              </p>
              <p className="text-blue-700 text-sm font-medium">
                Success Rate
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderFinancialSummary = () => {
    if (!importResult.summary) return null;

    const { totalCredits, totalDebits, netAmount, categoryCounts } = importResult.summary;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Financial Summary
          </CardTitle>
          <CardDescription>
            Overview of imported transaction amounts and categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h4 className="font-medium">Transaction Amounts</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-green-700 font-medium">Total Credits</span>
                  </div>
                  <span className="text-green-600 font-semibold">
                    {formatAmount(totalCredits)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-red-600" />
                    <span className="text-red-700 font-medium">Total Debits</span>
                  </div>
                  <span className="text-red-600 font-semibold">
                    {formatAmount(totalDebits)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border-2">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-gray-600" />
                    <span className="text-gray-700 font-medium">Net Amount</span>
                  </div>
                  <span className={`font-semibold ${netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatAmount(netAmount)}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Categories</h4>
              <div className="space-y-2">
                {Object.entries(categoryCounts).map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                    <span className="text-sm font-medium">{category}</span>
                    <Badge variant="secondary">
                      {count as number} transaction{(count as number) !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderNextSteps = () => (
    <Card>
      <CardHeader>
        <CardTitle>What's Next?</CardTitle>
        <CardDescription>
          Your transactions have been successfully imported. Here's what you can do next:
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Eye className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium">Review Transactions</h4>
              <p className="text-sm text-muted-foreground">
                View and edit your imported transactions in the Bank Accounts section.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-medium">Categorize & Tag</h4>
              <p className="text-sm text-muted-foreground">
                Transactions have been automatically categorized, but you can refine them for better reporting.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <BarChart3 className="w-5 h-5 text-purple-600 mt-0.5" />
            <div>
              <h4 className="font-medium">Generate Reports</h4>
              <p className="text-sm text-muted-foreground">
                Use the reporting tools to analyze your spending patterns and create financial reports.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <CreditCard className="w-5 h-5 text-orange-600 mt-0.5" />
            <div>
              <h4 className="font-medium">Reconcile Account</h4>
              <p className="text-sm text-muted-foreground">
                Compare imported transactions with your bank statement to ensure accuracy.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      {/* Success Header */}
      <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
        <CardContent className="pt-6">
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-800 mb-2">
              Import Completed Successfully!
            </h2>
            <p className="text-green-700">
              {importResult.imported} transactions have been imported into{' '}
              <strong>{bankAccount.accountName}</strong>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {renderSummaryCards()}

      {/* Financial Summary */}
      {renderFinancialSummary()}

      {/* Alerts for issues */}
      {importResult.skipped > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {importResult.skipped} duplicate transactions were automatically skipped to prevent 
            double entries in your account.
          </AlertDescription>
        </Alert>
      )}

      {importResult.errors > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {importResult.errors} transactions failed to import due to validation errors. 
            Please check your CSV file format and try again.
          </AlertDescription>
        </Alert>
      )}

      {/* Next Steps */}
      {renderNextSteps()}

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <Button 
          onClick={onViewTransactions}
          size="lg"
          className="flex items-center gap-2"
        >
          <Eye className="w-4 h-4" />
          View Transactions
        </Button>
        
        <Button 
          variant="outline" 
          onClick={onStartOver}
          size="lg"
          className="flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Import More Files
        </Button>
      </div>

      {/* Account Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-sm text-muted-foreground">
            <p>
              Transactions imported to: <strong>{bankAccount.accountName}</strong>
            </p>
            <p>
              Bank: {bankAccount.bankName} | Account: {bankAccount.accountNumber}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}