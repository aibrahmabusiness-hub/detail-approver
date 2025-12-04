import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import KPICard from '@/components/dashboard/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, DollarSign, CheckCircle, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AgentStats {
  totalInspections: number;
  totalPayouts: number;
  pendingPayments: number;
  completedPayments: number;
}

export default function AgentDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AgentStats>({
    totalInspections: 0,
    totalPayouts: 0,
    pendingPayments: 0,
    completedPayments: 0,
  });
  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    // Fetch user's inspection reports
    const { data: inspections } = await supabase
      .from('field_inspection_reports')
      .select('*')
      .eq('created_by_user_id', user.id);

    // Fetch user's payout reports
    const { data: payouts } = await supabase
      .from('payout_reports')
      .select('*')
      .eq('created_by_user_id', user.id);

    const inspectionData = inspections || [];
    const payoutData = payouts || [];

    const pendingPayments = inspectionData.filter(i => i.payment_status === 'pending').length;
    const completedPayments = inspectionData.filter(i => i.payment_status === 'paid').length;

    setStats({
      totalInspections: inspectionData.length,
      totalPayouts: payoutData.length,
      pendingPayments,
      completedPayments,
    });

    // Process monthly data
    const monthCounts: Record<string, number> = {};
    inspectionData.forEach((item) => {
      const month = new Date(item.date).toLocaleString('default', { month: 'short' });
      monthCounts[month] = (monthCounts[month] || 0) + 1;
    });

    setMonthlyData(
      Object.entries(monthCounts).map(([name, value]) => ({ name, value }))
    );
  };

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">My Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your activities</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="My Inspections"
            value={stats.totalInspections}
            icon={FileText}
          />
          <KPICard
            title="My Payouts"
            value={stats.totalPayouts}
            icon={DollarSign}
          />
          <KPICard
            title="Pending"
            value={stats.pendingPayments}
            icon={Clock}
          />
          <KPICard
            title="Completed"
            value={stats.completedPayments}
            icon={CheckCircle}
          />
        </div>

        {/* Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">My Inspections by Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="value" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No data available yet. Start adding inspection reports!
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
