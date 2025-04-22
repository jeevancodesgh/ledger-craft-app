
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppContext } from "@/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

const EditInvoicePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getInvoice, updateInvoice, customers, isLoadingCustomers, refreshInvoices } = useAppContext();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localForm, setLocalForm] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    getInvoice(id)
      .then(invoiceFound => {
        if (!invoiceFound) {
          setError("Invoice not found");
        } else {
          setInvoice(invoiceFound);
          setLocalForm({
            ...invoiceFound,
            items: invoiceFound.items || [],
          });
        }
      })
      .catch(() => setError("Error loading invoice"))
      .finally(() => setLoading(false));
  }, [id, getInvoice]);

  // On customers refresh, we could provide a select for the customer too
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setLocalForm({ ...localForm, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!localForm) return;
    setSaving(true);
    setError(null);
    try {
      await updateInvoice({ ...localForm, id });
      await refreshInvoices();
      navigate("/invoices");
    } catch (e: any) {
      setError(e?.message || "Error updating invoice");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Loading invoice...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-destructive font-semibold">{error}</div>
        <Button variant="secondary" onClick={() => navigate("/invoices")}>
          Back to Invoices
        </Button>
      </div>
    );
  }

  if (!localForm) return null;

  return (
    <div className="flex justify-center py-6">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>Edit Invoice</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="invoiceNumber">
                Invoice Number
              </label>
              <Input
                id="invoiceNumber"
                name="invoiceNumber"
                value={localForm.invoiceNumber}
                onChange={handleChange}
                required
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="customerId">
                Client
              </label>
              <select
                id="customerId"
                name="customerId"
                value={localForm.customerId}
                onChange={handleChange}
                className="w-full border rounded p-2"
                required
                disabled={isLoadingCustomers}
              >
                <option value="">Select a customer</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1" htmlFor="date">
                  Date
                </label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={localForm.date}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1" htmlFor="dueDate">
                  Due Date
                </label>
                <Input
                  id="dueDate"
                  name="dueDate"
                  type="date"
                  value={localForm.dueDate}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="notes">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                value={localForm.notes || ""}
                onChange={handleChange}
                className="w-full border rounded p-2"
                rows={2}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" type="button" onClick={() => navigate("/invoices")}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditInvoicePage;
