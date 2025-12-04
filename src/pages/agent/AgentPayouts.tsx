import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import DataTable from '@/components/tables/DataTable';
import PayoutReportForm from '@/components/forms/PayoutReportForm';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { Plus, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function AgentPayouts() {
  const { user } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [deleteData, setDeleteData] = useState<any>(null);

  const columns = [
    { key: 'month', label: 'Month' },
    { key: 'financier', label: 'Financier' },
    { key: 'loan_amount', label: 'Loan Amount', render: (v: number) => `₹${v?.toLocaleString() || 0}` },
    { key: 'payout_percentage', label: 'Payout %', render: (v: number) => `${v}%` },
    { key: 'amount_paid', label: 'Amount Paid', render: (v: number) => `₹${v?.toLocaleString() || 0}` },
    { key: 'nett', label: 'Nett', render: (v: number) => `₹${v?.toLocaleString() || 0}` },
    { key: 'sm_name', label: 'SM Name' },
    { key: 'payment_status', label: 'Status' },
  ];

  useEffect(() => {
    if (user) {
      fetchReports();
    }
  }, [user]);

  const fetchReports = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('payout_reports')
      .select('*')
      .eq('created_by_user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setReports(data || []);
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteData) return;

    const { error } = await supabase
      .from('payout_reports')
      .delete()
      .eq('id', deleteData.id)
      .eq('created_by_user_id', user?.id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Report deleted successfully' });
      fetchReports();
    }
    setDeleteData(null);
  };

  const exportToExcel = () => {
    const exportData = reports.map((r) => ({
      'Month': r.month,
      'Financier': r.financier,
      'Loan Amount': r.loan_amount,
      'Payout %': r.payout_percentage,
      'Amount Paid': r.amount_paid,
      'Less TDS': r.less_tds,
      'Nett': r.nett,
      'Bank Details': r.bank_details,
      'PAN': r.pan,
      'SM Name': r.sm_name,
      'Contact No': r.contact_no,
      'Mail Sent': r.mail_sent,
      'Payment Status': r.payment_status,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'My Payout Reports');
    XLSX.writeFile(wb, `my_payout_reports_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast({ title: 'Export Complete' });
  };

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">My Payout Reports</h1>
            <p className="text-muted-foreground mt-1">Manage your payout reports</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportToExcel}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button size="sm" onClick={() => { setEditData(null); setFormOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Report
            </Button>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
          <DataTable
            columns={columns}
            data={reports}
            loading={loading}
            onEdit={(row) => { setEditData(row); setFormOpen(true); }}
            searchPlaceholder="Search by financier, SM name..."
          />
        </div>
      </div>

      <PayoutReportForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditData(null); }}
        onSuccess={fetchReports}
        editData={editData}
      />

      <AlertDialog open={!!deleteData} onOpenChange={() => setDeleteData(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Report</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this payout report? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
