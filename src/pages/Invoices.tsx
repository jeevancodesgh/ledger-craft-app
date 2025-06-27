import React from 'react';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, getStatusColor, formatDate } from '@/utils/invoiceUtils';
import { Button } from '@/components/ui/button';
import { Plus, ChevronRight, Calendar, DollarSign, Edit, Trash2, Copy, Loader2, Share2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogClose, DialogTrigger } from '@/components/ui/dialog';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue
} from '@/components/ui/select';
import ShareInvoiceModal from '@/components/invoice/ShareInvoiceModal';
import { Invoice } from '@/types';

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
];

const Invoices = () => {
  const { invoices, isLoadingInvoices, deleteInvoice, refreshInvoices, createInvoice, businessProfile, getNextInvoiceNumber, updateInvoiceStatus } = useAppContext();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [statusLoading, setStatusLoading] = useState<{ [id: string]: boolean }>({});
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [invoiceToShare, setInvoiceToShare] = useState<Invoice | null>(null);

  const handleDeleteClick = (id: string) => {
    setInvoiceToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!invoiceToDelete) return;
    setDeleting(true);
    try {
      await deleteInvoice(invoiceToDelete);
      setDeleteDialogOpen(false);
      setInvoiceToDelete(null);
      await refreshInvoices();
    } catch (e) {
      // error toast will come from context
    } finally {
      setDeleting(false);
    }
  };

  const handleClone = async (invoice) => {
    try {
      const { id, invoiceNumber, createdAt, updatedAt, status, ...rest } = invoice;
      const newInvoiceNumber = await getNextInvoiceNumber();
      const clonedInvoice = {
        ...rest,
        invoiceNumber: newInvoiceNumber,
        status: 'draft',
        date: formatDate(new Date()),
        dueDate: formatDate(new Date()),
        items: invoice.items.map(item => ({ ...item, id: undefined })),
      };
      const created = await createInvoice(clonedInvoice);
      toast({ title: 'Invoice cloned', description: 'A new invoice has been created.' });
      await refreshInvoices();
      navigate(`/invoices/${created.id}/edit`);
    } catch (e) {
      toast({ title: 'Clone failed', description: 'Could not clone invoice.', variant: 'destructive' });
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    setStatusLoading((prev) => ({ ...prev, [id]: true }));
    const prevInvoice = invoices.find(i => i.id === id);
    try {
      await updateInvoiceStatus(id, newStatus as any);
      toast({ title: 'Status updated', description: `Invoice status changed to ${newStatus}.` });
      await refreshInvoices();
    } catch (e) {
      toast({ title: 'Update failed', description: 'Could not update invoice status.', variant: 'destructive' });
    } finally {
      setStatusLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleShareClick = (invoice: Invoice) => {
    setInvoiceToShare(invoice);
    setShareModalOpen(true);
  };

  if (isLoadingInvoices) {
    return <div className="flex justify-center items-center h-64">Loading invoices...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mt-5">
        <h1 className="text-3xl font-bold">Invoices</h1>
        <Button className="flex items-center gap-2 bg-invoice-teal hover:bg-invoice-teal/90" asChild>
          <Link to="/invoices/new">
            <Plus size={18} />
            <span>New Invoice</span>
          </Link>
        </Button>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Delete Invoice?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this invoice? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="w-full"
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
            <DialogClose asChild>
              <Button variant="secondary" className="w-full mt-2" disabled={deleting}>Cancel</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isMobile ? (
        <div className="grid grid-cols-1 gap-4">
          {invoices.length === 0 ? (
            <Card className="flex items-center justify-center h-32 text-muted-foreground">
              No invoices found. Create your first invoice to get started.
            </Card>
          ) : (
            invoices.map((invoice) => (
              <Card key={invoice.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle
                      className="text-lg cursor-pointer hover:underline"
                      onClick={() => navigate(`/invoices/${invoice.id}/edit`)}
                    >
                      {invoice.invoiceNumber}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Select
                        value={invoice.status}
                        onValueChange={val => handleStatusChange(invoice.id, val)}
                        disabled={statusLoading[invoice.id]}
                      >
                        <SelectTrigger className={`px-2 py-1 text-xs rounded-full border min-w-[100px] ${getStatusColor(invoice.status)}`}> 
                          <SelectValue />
                          {statusLoading[invoice.id] && <Loader2 className="animate-spin w-4 h-4 text-muted-foreground ml-2" />}
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <p
                    className="text-sm text-muted-foreground cursor-pointer hover:underline"
                    onClick={() => navigate(`/invoices/${invoice.id}/edit`)}
                  >
                    {invoice.customer?.name || invoice.customerId}
                  </p>
                </CardHeader>
                <CardContent className="pt-2 pb-2">
                  <div className="space-y-1">
                    <div
                      className="flex items-center text-sm cursor-pointer hover:underline"
                      onClick={() => navigate(`/invoices/${invoice.id}/edit`)}
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      <span className="font-medium mr-1">Due:</span> {invoice.dueDate}
                    </div>
                    <div
                      className="flex items-center text-sm cursor-pointer hover:underline"
                      onClick={() => navigate(`/invoices/${invoice.id}/edit`)}
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      <span className="font-medium mr-1">Amount:</span> {formatCurrency(invoice.total)}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2 justify-end pt-2">
                  <Button variant="ghost" className="h-8 px-3 text-xs" asChild>
                    <Link to={`/invoices/${invoice.id}`} className="flex items-center">
                      View
                      <ChevronRight className="ml-1 w-4 h-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    asChild
                    aria-label="Edit invoice"
                  >
                    <Link to={`/invoices/${invoice.id}/edit`}>
                      <Edit size={16} />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    aria-label="Delete invoice"
                    onClick={() => handleDeleteClick(invoice.id)}
                  >
                    <Trash2 size={16} />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    aria-label="Clone invoice"
                    onClick={() => handleClone(invoice)}
                  >
                    <Copy size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    aria-label="Share invoice"
                    onClick={() => handleShareClick(invoice)}
                  >
                    <Share2 size={16} />
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No invoices found. Create your first invoice to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                      <TableCell>{invoice.customer?.name || invoice.customerId}</TableCell>
                      <TableCell>{invoice.date}</TableCell>
                      <TableCell>{invoice.dueDate}</TableCell>
                      <TableCell>{formatCurrency(invoice.total)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Select
                            value={invoice.status}
                            onValueChange={val => handleStatusChange(invoice.id, val)}
                            disabled={statusLoading[invoice.id]}
                          >
                            <SelectTrigger className={`px-2 py-1 text-xs rounded-full border min-w-[100px] ${getStatusColor(invoice.status)}`}>
                              <SelectValue />
                              {statusLoading[invoice.id] && <Loader2 className="animate-spin w-4 h-4 text-muted-foreground ml-2" />}
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_OPTIONS.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          asChild
                          aria-label="Edit invoice"
                        >
                          <Link to={`/invoices/${invoice.id}/edit`}>
                            <Edit size={16} />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          aria-label="Delete invoice"
                          onClick={() => handleDeleteClick(invoice.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                        <Button variant="ghost" className="h-8 px-2" asChild>
                          <Link to={`/invoices/${invoice.id}`}>View</Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          aria-label="Clone invoice"
                          onClick={() => handleClone(invoice)}
                        >
                          <Copy size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label="Share invoice"
                          onClick={() => handleShareClick(invoice)}
                        >
                          <Share2 size={16} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Invoice</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this invoice? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Invoice Modal */}
      {invoiceToShare && (
        <ShareInvoiceModal
          open={shareModalOpen}
          onOpenChange={setShareModalOpen}
          invoice={invoiceToShare}
          businessName={businessProfile?.name}
        />
      )}
    </div>
  );
};

export default Invoices;
