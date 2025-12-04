import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import DataTable from '@/components/tables/DataTable';
import PayoutReportForm from '@/components/forms/PayoutReportForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Plus, Download, Mail, Filter } from 'lucide-react';
import * as XLSX from 'xlsx';

const MONTHS = [
  'All Months', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const PAYMENT_STATUSES = ['All Status', 'pending', 'paid', 'partial', 'overdue'];

export default function AdminPayouts() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [deleteData, setDeleteData] = useState<any>(null);
  
  // Filters
  const [monthFilter, setMonthFilter] = useState('All Months');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [showFilters, setShowFilters] = useState(false);

  const columns = [
    { key: 'month', label: 'Month' },
    { key: 'financier', label: 'Financier' },
    { key: 'loan_amount', label: 'Loan Amount', render: (v: number) => `₹${v?.toLocaleString() || 0}` },
    { key: 'payout_percentage', label: 'Payout %', render: (v: number) => `${v}%` },
    { key: 'amount_paid', label: 'Amount Paid', render: (v: number) => `₹${v?.toLocaleString() || 0}` },
    { key: 'less_tds', label: 'Less TDS', render: (v: number) => `₹${v?.toLocaleString() || 0}` },
    { key: 'nett', label: 'Nett', render: (v: number) => `₹${v?.toLocaleString() || 0}` },
    { key: 'sm_name', label: 'SM Name' },
    { key: 'mail_sent', label: 'Mail Sent' },
    { key: 'payment_status', label: 'Status' },
  ];

  useEffect(() => {
    fetchReports();
  }, [monthFilter, statusFilter]);

  const fetchReports = async () => {
    setLoading(true);
    let query = supabase.from('payout_reports').select('*').order('created_at', { ascending: false });

    if (monthFilter !== 'All Months') query = query.eq('month', monthFilter);
    if (statusFilter !== 'All Status') query = query.eq('payment_status', statusFilter);

    const { data, error } = await query;

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
      .eq('id', deleteData.id);

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
    XLSX.utils.book_append_sheet(wb, ws, 'Payout Reports');
    XLSX.writeFile(wb, `payout_reports_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast({ title: 'Export Complete' });
  };

  const sendViaOutlook = () => {
    exportToExcel();
    const subject = encodeURIComponent('Payout Reports');
    const body = encodeURIComponent('Please find the attached payout reports.');
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    toast({ title: 'Outlook opened', description: 'Attach the downloaded Excel file to your email.' });
  };

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Payout Reports</h1>
              <p className="text-muted-foreground mt-1">Manage all agency payout reports</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
              <Button variant="outline" size="sm" onClick={exportToExcel}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={sendViaOutlook}>
                <Mail className="w-4 h-4 mr-2" />
                Email
              </Button>
              <Button size="sm" onClick={() => { setEditData(null); setFormOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Report
              </Button>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="bg-card border border-border rounded-lg p-4 space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Month</label>
                  <Select value={monthFilter} onValueChange={setMonthFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Payment Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s === 'All Status' ? s : s.charAt(0).toUpperCase() + s.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setMonthFilter('All Months');
                  setStatusFilter('All Status');
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
          <DataTable
            columns={columns}
            data={reports}
            loading={loading}
            onEdit={(row) => { setEditData(row); setFormOpen(true); }}
            onDelete={(row) => setDeleteData(row)}
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
