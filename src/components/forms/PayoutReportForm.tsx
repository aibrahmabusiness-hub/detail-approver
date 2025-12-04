import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const PAYMENT_STATUSES = ['pending', 'paid', 'partial', 'overdue'];

interface PayoutReportFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editData?: any;
}

export default function PayoutReportForm({
  open,
  onClose,
  onSuccess,
  editData,
}: PayoutReportFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    month: editData?.month || '',
    financier: editData?.financier || '',
    loan_amount: editData?.loan_amount || '',
    payout_percentage: editData?.payout_percentage || '',
    amount_paid: editData?.amount_paid || '',
    less_tds: editData?.less_tds || '',
    nett: editData?.nett || '',
    bank_details: editData?.bank_details || '',
    pan: editData?.pan || '',
    sm_name: editData?.sm_name || '',
    contact_no: editData?.contact_no || '',
    mail_sent: editData?.mail_sent || 'No',
    payment_status: editData?.payment_status || 'pending',
  });

  const calculateNett = (amountPaid: number, lessTds: number) => {
    return amountPaid - lessTds;
  };

  const handleAmountChange = (field: string, value: string) => {
    const newFormData = { ...formData, [field]: value };
    
    if (field === 'amount_paid' || field === 'less_tds') {
      const amountPaid = parseFloat(field === 'amount_paid' ? value : formData.amount_paid) || 0;
      const lessTds = parseFloat(field === 'less_tds' ? value : formData.less_tds) || 0;
      newFormData.nett = calculateNett(amountPaid, lessTds).toString();
    }
    
    setFormData(newFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const payload = {
        ...formData,
        loan_amount: parseFloat(formData.loan_amount) || 0,
        payout_percentage: parseFloat(formData.payout_percentage) || 0,
        amount_paid: parseFloat(formData.amount_paid) || 0,
        less_tds: parseFloat(formData.less_tds) || 0,
        nett: parseFloat(formData.nett) || 0,
        created_by_user_id: user.id,
      };

      if (editData?.id) {
        const { error } = await supabase
          .from('payout_reports')
          .update(payload)
          .eq('id', editData.id);
        
        if (error) throw error;
        toast({ title: 'Payout report updated successfully' });
      } else {
        const { error } = await supabase
          .from('payout_reports')
          .insert(payload);
        
        if (error) throw error;
        toast({ title: 'Payout report created successfully' });
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editData ? 'Edit Payout Report' : 'New Payout Report'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="month">Month</Label>
              <Select
                value={formData.month}
                onValueChange={(value) => setFormData({ ...formData, month: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((month) => (
                    <SelectItem key={month} value={month}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="financier">Financier</Label>
              <Input
                id="financier"
                value={formData.financier}
                onChange={(e) => setFormData({ ...formData, financier: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="loan_amount">Loan Amount</Label>
              <Input
                id="loan_amount"
                type="number"
                value={formData.loan_amount}
                onChange={(e) => setFormData({ ...formData, loan_amount: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payout_percentage">Payout %</Label>
              <Input
                id="payout_percentage"
                type="number"
                step="0.01"
                value={formData.payout_percentage}
                onChange={(e) => setFormData({ ...formData, payout_percentage: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount_paid">Amount Paid</Label>
              <Input
                id="amount_paid"
                type="number"
                value={formData.amount_paid}
                onChange={(e) => handleAmountChange('amount_paid', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="less_tds">Less TDS</Label>
              <Input
                id="less_tds"
                type="number"
                value={formData.less_tds}
                onChange={(e) => handleAmountChange('less_tds', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nett">Nett</Label>
              <Input
                id="nett"
                type="number"
                value={formData.nett}
                readOnly
                className="bg-muted"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bank_details">Bank Details</Label>
            <Input
              id="bank_details"
              value={formData.bank_details}
              onChange={(e) => setFormData({ ...formData, bank_details: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pan">PAN</Label>
              <Input
                id="pan"
                value={formData.pan}
                onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                maxLength={10}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sm_name">SM Name</Label>
              <Input
                id="sm_name"
                value={formData.sm_name}
                onChange={(e) => setFormData({ ...formData, sm_name: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact_no">Contact No</Label>
              <Input
                id="contact_no"
                value={formData.contact_no}
                onChange={(e) => setFormData({ ...formData, contact_no: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mail_sent">Mail Sent</Label>
              <Select
                value={formData.mail_sent}
                onValueChange={(value) => setFormData({ ...formData, mail_sent: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Yes">Yes</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_status">Payment Status</Label>
            <Select
              value={formData.payment_status}
              onValueChange={(value) => setFormData({ ...formData, payment_status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editData ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
