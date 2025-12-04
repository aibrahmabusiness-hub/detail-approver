import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import KPICard from '@/components/dashboard/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileText, DollarSign, Users, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface DashboardStats {
  totalInspections: number;
  totalPayouts: number;
  totalUsers: number;
  pendingPayments: number;
  completedPayments: number;
  totalLoanAmount: number;
}

const COLORS = ['hsl(217, 91%, 60%)', 'hsl(142, 71%, 45%)', 'hsl(38, 92%, 50%)', 'hsl(0, 72%, 51%)'];

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalInspections: 0,
    totalPayouts: 0,
    totalUsers: 0,
    pendingPayments: 0,
    completedPayments: 0,
    totalLoanAmount: 0,
  });
  const [dateFilter, setDateFilter] = useState('all');
  const [regionData, setRegionData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, [dateFilter]);

  const fetchDashboardData = async () => {
    // Fetch inspection reports
    const { data: inspections } = await supabase
      .from('field_inspection_reports')
      .select('*');

    // Fetch payout reports
    const { data: payouts } = await supabase
      .from('payout_reports')
      .select('*');

    // Fetch users
    const { data: users } = await supabase
      .from('user_roles')
      .select('*');

    const inspectionData = inspections || [];
    const payoutData = payouts || [];
    const userData = users || [];

    // Calculate stats
    const pendingPayments = inspectionData.filter(i => i.payment_status === 'pending').length;
    const completedPayments = inspectionData.filter(i => i.payment_status === 'paid').length;
    const totalLoanAmount = inspectionData.reduce((sum, i) => sum + (i.loan_amount || 0), 0);

    setStats({
      totalInspections: inspectionData.length,
      totalPayouts: payoutData.length,
      totalUsers: userData.length,
      pendingPayments,
      completedPayments,
      totalLoanAmount,
    });

    // Process region data for chart
    const regionCounts = inspectionData.reduce((acc: any, item) => {
      const region = item.region || 'Unknown';
      acc[region] = (acc[region] || 0) + 1;
      return acc;
    }, {});

    setRegionData(
      Object.entries(regionCounts).map(([name, value]) => ({ name, value }))
    );

    // Process status data for pie chart
    const statusCounts = inspectionData.reduce((acc: any, item) => {
      const status = item.payment_status || 'pending';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    setStatusData(
      Object.entries(statusCounts).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
      }))
    );
  };

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Overview of all activities</p>
          </div>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <KPICard
            title="Total Inspections"
            value={stats.totalInspections}
            icon={FileText}
          />
          <KPICard
            title="Total Payouts"
            value={stats.totalPayouts}
            icon={DollarSign}
          />
          <KPICard
            title="Total Users"
            value={stats.totalUsers}
            icon={Users}
          />
          <KPICard
            title="Pending Payments"
            value={stats.pendingPayments}
            icon={Clock}
          />
          <KPICard
            title="Completed"
            value={stats.completedPayments}
            icon={CheckCircle}
          />
          <KPICard
            title="Total Loan Amount"
            value={`₹${(stats.totalLoanAmount / 100000).toFixed(1)}L`}
            icon={TrendingUp}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Inspections by Region</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={regionData}>
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
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payment Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {statusData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
