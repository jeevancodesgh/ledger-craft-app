import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function FinancialReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Financial Reports</h1>
        <p className="text-muted-foreground">
          Generate and view comprehensive financial reports and analytics
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Financial reports will be displayed here.</p>
        </CardContent>
      </Card>
    </div>
  );
}