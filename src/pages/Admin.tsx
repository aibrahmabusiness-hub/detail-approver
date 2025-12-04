import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LogOut,
  Users,
  FileText,
  Shield,
  Loader2,
  Home,
  Download,
} from 'lucide-react';
import UserManagement from '@/components/UserManagement';
import * as XLSX from 'xlsx';

interface Submission {
  id: string;
  date: string;
  loan_ac_no: string;
  name: string;
  loan_amount: number;
  location: string;
  bob_region: string;
  our_region: string;
  lar_remarks: string | null;
  zone: string;
  state: string;
  payment_status: string;
  invoice_status: string;
  created_at: string;
}

export default function Admin() {
  const { user, userRole, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/auth');
      } else if (userRole && userRole !== 'admin') {
        toast({
          title: 'Access Denied',
          description: 'You do not have admin privileges.',
          variant: 'destructive',
        });
        navigate('/');
      }
    }
  }, [user, userRole, authLoading, navigate]);

  useEffect(() => {
    if (userRole === 'admin') {
      fetchSubmissions();
    }
  }, [userRole]);

  const fetchSubmissions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch submissions.',
        variant: 'destructive',
      });
    } else {
      setSubmissions(data || []);
    }
    setLoading(false);
  };

  const exportToExcel = () => {
    const exportData = submissions.map((s) => ({
      'Date': new Date(s.date).toLocaleDateString(),
      'Loan A/C No': s.loan_ac_no,
      'Name': s.name,
      'Loan Amount': s.loan_amount,
      'Location': s.location,
      'BOB Region': s.bob_region,
      'Our Region': s.our_region,
      'LAR REMARKS': s.lar_remarks || '',
      'ZONE': s.zone,
      'STATE': s.state,
      'PAYMENT STATUS': s.payment_status,
      'INVOICE STATUS': s.invoice_status,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Loan Transactions');
    XLSX.writeFile(wb, `loan_transactions_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast({
      title: 'Export Complete',
      description: 'Excel file has been downloaded.',
    });
  };

  const getStatusBadge = (status: string, type: 'payment' | 'invoice') => {
    const styles: Record<string, string> = {
      pending: 'bg-warning/10 text-warning border-warning/20',
      paid: 'bg-success/10 text-success border-success/20',
      overdue: 'bg-destructive/10 text-destructive border-destructive/20',
      partial: 'bg-primary/10 text-primary border-primary/20',
      generated: 'bg-primary/10 text-primary border-primary/20',
      sent: 'bg-success/10 text-success border-success/20',
      cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
    };
    return (
      <Badge className={styles[status] || styles.pending}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (authLoading || (user && !userRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || userRole !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="submissions" className="space-y-6">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="submissions" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Submissions
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              User Management
            </TabsTrigger>
          </TabsList>

          <TabsContent value="submissions" className="animate-fade-in">
            <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
              <div className="p-6 border-b border-border flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Loan Transactions</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    View and export all loan submissions
                  </p>
                </div>
                <Button onClick={exportToExcel} disabled={submissions.length === 0}>
                  <Download className="w-4 h-4 mr-2" />
                  Export to Excel
                </Button>
              </div>
              
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : submissions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No submissions yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Loan A/C No</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Loan Amount</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>BOB Region</TableHead>
                        <TableHead>Our Region</TableHead>
                        <TableHead>LAR Remarks</TableHead>
                        <TableHead>Zone</TableHead>
                        <TableHead>State</TableHead>
                        <TableHead>Payment Status</TableHead>
                        <TableHead>Invoice Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {submissions.map((submission) => (
                        <TableRow key={submission.id}>
                          <TableCell>{new Date(submission.date).toLocaleDateString()}</TableCell>
                          <TableCell className="font-medium">{submission.loan_ac_no}</TableCell>
                          <TableCell>{submission.name}</TableCell>
                          <TableCell>₹{submission.loan_amount.toLocaleString()}</TableCell>
                          <TableCell>{submission.location}</TableCell>
                          <TableCell>{submission.bob_region}</TableCell>
                          <TableCell>{submission.our_region}</TableCell>
                          <TableCell className="max-w-[150px] truncate">{submission.lar_remarks}</TableCell>
                          <TableCell>{submission.zone}</TableCell>
                          <TableCell>{submission.state}</TableCell>
                          <TableCell>{getStatusBadge(submission.payment_status, 'payment')}</TableCell>
                          <TableCell>{getStatusBadge(submission.invoice_status, 'invoice')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="users" className="animate-fade-in">
            <UserManagement />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
