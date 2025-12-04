import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Send, CheckCircle, LogIn, LogOut, Shield, FileText } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const ZONES = ['North', 'South', 'East', 'West', 'Central'];
const STATES = [
  'Andhra Pradesh', 'Bihar', 'Gujarat', 'Karnataka', 'Kerala',
  'Madhya Pradesh', 'Maharashtra', 'Punjab', 'Rajasthan', 'Tamil Nadu',
  'Telangana', 'Uttar Pradesh', 'West Bengal', 'Delhi', 'Other'
];
const PAYMENT_STATUSES = ['pending', 'paid', 'overdue', 'partial'];
const INVOICE_STATUSES = ['pending', 'generated', 'sent', 'cancelled'];

export default function Index() {
  const { user, userRole, signOut } = useAuth();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    loan_ac_no: '',
    name: '',
    loan_amount: '',
    location: '',
    bob_region: '',
    our_region: '',
    lar_remarks: '',
    zone: '',
    state: '',
    payment_status: 'pending',
    invoice_status: 'pending',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.loan_ac_no || !formData.name || !formData.loan_amount || !formData.location) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('submissions').insert({
        date: formData.date,
        loan_ac_no: formData.loan_ac_no,
        name: formData.name,
        loan_amount: parseFloat(formData.loan_amount),
        location: formData.location,
        bob_region: formData.bob_region,
        our_region: formData.our_region,
        lar_remarks: formData.lar_remarks,
        zone: formData.zone,
        state: formData.state,
        payment_status: formData.payment_status,
        invoice_status: formData.invoice_status,
      });

      if (error) throw error;

      setSubmitted(true);
      toast({
        title: 'Success!',
        description: 'Your submission has been received.',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to submit. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNewSubmission = () => {
    setSubmitted(false);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      loan_ac_no: '',
      name: '',
      loan_amount: '',
      location: '',
      bob_region: '',
      our_region: '',
      lar_remarks: '',
      zone: '',
      state: '',
      payment_status: 'pending',
      invoice_status: 'pending',
    });
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md animate-slide-up">
          <div className="bg-card rounded-2xl shadow-elevated p-8 border border-border text-center">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-3">
              Submission Received!
            </h1>
            <p className="text-muted-foreground mb-6">
              Thank you for your submission. An admin will review your details shortly.
            </p>
            <Button variant="outline" onClick={handleNewSubmission}>
              Submit Another
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Loan Tracker</h1>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {userRole === 'admin' && (
                  <Link to="/admin">
                    <Button variant="outline" size="sm">
                      <Shield className="w-4 h-4 mr-2" />
                      Admin
                    </Button>
                  </Link>
                )}
                <Button variant="ghost" size="sm" onClick={signOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Link to="/auth">
                <Button variant="outline" size="sm">
                  <LogIn className="w-4 h-4 mr-2" />
                  Login
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-2xl text-center animate-fade-in">
          <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FileText className="w-8 h-8 text-primary-foreground" />
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Loan Submission Form
          </h2>
          <p className="text-lg text-muted-foreground">
            Fill out the loan details below for tracking and management.
          </p>
        </div>
      </section>

      {/* Form Section */}
      <section className="pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-card rounded-2xl shadow-elevated p-8 border border-border animate-slide-up">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="loan_ac_no">Loan A/C No *</Label>
                  <Input
                    id="loan_ac_no"
                    name="loan_ac_no"
                    placeholder="Enter loan account number"
                    value={formData.loan_ac_no}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Enter borrower name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="loan_amount">Loan Amount *</Label>
                  <Input
                    id="loan_amount"
                    name="loan_amount"
                    type="number"
                    step="0.01"
                    placeholder="Enter loan amount"
                    value={formData.loan_amount}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    name="location"
                    placeholder="Enter location"
                    value={formData.location}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bob_region">BOB Region</Label>
                  <Input
                    id="bob_region"
                    name="bob_region"
                    placeholder="Enter BOB region"
                    value={formData.bob_region}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="our_region">Our Region</Label>
                  <Input
                    id="our_region"
                    name="our_region"
                    placeholder="Enter our region"
                    value={formData.our_region}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zone">Zone</Label>
                  <Select value={formData.zone} onValueChange={(v) => handleSelectChange('zone', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select zone" />
                    </SelectTrigger>
                    <SelectContent>
                      {ZONES.map((zone) => (
                        <SelectItem key={zone} value={zone}>{zone}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Select value={formData.state} onValueChange={(v) => handleSelectChange('state', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATES.map((state) => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment_status">Payment Status</Label>
                  <Select value={formData.payment_status} onValueChange={(v) => handleSelectChange('payment_status', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment status" />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_STATUSES.map((status) => (
                        <SelectItem key={status} value={status} className="capitalize">{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invoice_status">Invoice Status</Label>
                  <Select value={formData.invoice_status} onValueChange={(v) => handleSelectChange('invoice_status', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select invoice status" />
                    </SelectTrigger>
                    <SelectContent>
                      {INVOICE_STATUSES.map((status) => (
                        <SelectItem key={status} value={status} className="capitalize">{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lar_remarks">LAR Remarks</Label>
                <Textarea
                  id="lar_remarks"
                  name="lar_remarks"
                  placeholder="Enter any remarks..."
                  value={formData.lar_remarks}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>

              <Button
                type="submit"
                variant="hero"
                size="lg"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  'Submitting...'
                ) : (
                  <>
                    Submit Loan Details
                    <Send className="w-5 h-5" />
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
