import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Loader2, Save, Building2 } from 'lucide-react';

interface HeaderDetails {
  id: string;
  company_name: string;
  address: string;
  contact_email: string;
  logo_url: string;
}

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [headerDetails, setHeaderDetails] = useState<HeaderDetails>({
    id: '',
    company_name: '',
    address: '',
    contact_email: '',
    logo_url: '',
  });

  useEffect(() => {
    fetchHeaderDetails();
  }, []);

  const fetchHeaderDetails = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('header_details')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else if (data) {
      setHeaderDetails(data);
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (headerDetails.id) {
        const { error } = await supabase
          .from('header_details')
          .update({
            company_name: headerDetails.company_name,
            address: headerDetails.address,
            contact_email: headerDetails.contact_email,
            logo_url: headerDetails.logo_url,
          })
          .eq('id', headerDetails.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('header_details')
          .insert({
            company_name: headerDetails.company_name,
            address: headerDetails.address,
            contact_email: headerDetails.contact_email,
            logo_url: headerDetails.logo_url,
          });

        if (error) throw error;
      }

      toast({ title: 'Settings saved successfully' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage company details and branding</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Company Details
            </CardTitle>
            <CardDescription>
              Update your company information displayed across the application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name</Label>
                  <Input
                    id="company_name"
                    value={headerDetails.company_name}
                    onChange={(e) =>
                      setHeaderDetails({ ...headerDetails, company_name: e.target.value })
                    }
                    placeholder="Enter company name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_email">Contact Email</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={headerDetails.contact_email}
                    onChange={(e) =>
                      setHeaderDetails({ ...headerDetails, contact_email: e.target.value })
                    }
                    placeholder="Enter contact email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={headerDetails.address}
                  onChange={(e) =>
                    setHeaderDetails({ ...headerDetails, address: e.target.value })
                  }
                  placeholder="Enter company address"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo_url">Logo URL</Label>
                <Input
                  id="logo_url"
                  type="url"
                  value={headerDetails.logo_url}
                  onChange={(e) =>
                    setHeaderDetails({ ...headerDetails, logo_url: e.target.value })
                  }
                  placeholder="https://example.com/logo.png"
                />
                {headerDetails.logo_url && (
                  <div className="mt-2 p-4 bg-secondary rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">Preview:</p>
                    <img
                      src={headerDetails.logo_url}
                      alt="Logo preview"
                      className="max-h-20 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              <Button type="submit" disabled={saving}>
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Changes
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
