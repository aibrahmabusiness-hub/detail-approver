import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import DataTable from '@/components/tables/DataTable';
import InspectionReportForm from '@/components/forms/InspectionReportForm';
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

const STATES = [
  'All States', 'Andhra Pradesh', 'Bihar', 'Delhi', 'Gujarat', 'Haryana', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Punjab', 'Rajasthan',
  'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'West Bengal', 'Other'
];

const REGIONS = ['All Regions', 'North', 'South', 'East', 'West', 'Central'];
const PAYMENT_STATUSES = ['All Status', 'pending', 'paid', 'partial', 'overdue'];

export default function AdminInspections() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [deleteData, setDeleteData] = useState<any>(null);
  
  // Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [regionFilter, setRegionFilter] = useState('All Regions');
  const [stateFilter, setStateFilter] = useState('All States');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [showFilters, setShowFilters] = useState(false);

  const columns = [
    { key: 'date', label: 'Date', render: (v: string) => new Date(v).toLocaleDateString() },
    { key: 'loan_ac_no', label: 'Loan A/C No' },
    { key: 'customer_name', label: 'Customer Name' },
    { key: 'loan_amount', label: 'Loan Amount', render: (v: number) => `₹${v?.toLocaleString() || 0}` },
    { key: 'location', label: 'Location' },
    { key: 'region', label: 'Region' },
    { key: 'state', label: 'State' },
    { key: 'payment_status', label: 'Payment Status' },
    { key: 'invoice_status', label: 'Invoice Status' },
  ];

  useEffect(() => {
    fetchReports();
  }, [dateFrom, dateTo, regionFilter, stateFilter, statusFilter]);

  const fetchReports = async () => {
    setLoading(true);
    let query = supabase.from('field_inspection_reports').select('*').order('created_at', { ascending: false });

    if (dateFrom) query = query.gte('date', dateFrom);
    if (dateTo) query = query.lte('date', dateTo);
    if (regionFilter !== 'All Regions') query = query.eq('region', regionFilter);
    if (stateFilter !== 'All States') query = query.eq('state', stateFilter);
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
      .from('field_inspection_reports')
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
      'Date': new Date(r.date).toLocaleDateString(),
      'Loan A/C No': r.loan_ac_no,
      'Customer Name': r.customer_name,
      'Loan Amount': r.loan_amount,
      'Location': r.location,
      'Region': r.region,
      'LAR Remarks': r.lar_remarks || '',
      'State': r.state,
      'Payment Status': r.payment_status,
      'Invoice Status': r.invoice_status,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inspection Reports');
    XLSX.writeFile(wb, `inspection_reports_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast({ title: 'Export Complete' });
  };

  const sendViaOutlook = () => {
    exportToExcel();
    const subject = encodeURIComponent('Inspection Reports');
    const body = encodeURIComponent('Please find the attached inspection reports.');
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    toast({ title: 'Outlook opened', description: 'Attach the downloaded Excel file to your email.' });
  };

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Inspection Reports</h1>
              <p className="text-muted-foreground mt-1">Manage all field inspection reports</p>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">From Date</label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">To Date</label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Region</label>
                  <Select value={regionFilter} onValueChange={setRegionFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REGIONS.map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">State</label>
                  <Select value={stateFilter} onValueChange={setStateFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
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
                  setDateFrom('');
                  setDateTo('');
                  setRegionFilter('All Regions');
                  setStateFilter('All States');
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
            searchPlaceholder="Search by name, loan number..."
          />
        </div>
      </div>

      <InspectionReportForm
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
              Are you sure you want to delete this inspection report? This action cannot be undone.
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
