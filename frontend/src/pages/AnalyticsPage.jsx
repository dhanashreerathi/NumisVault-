import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend,
} from 'recharts';
import { analyticsApi } from '../services/api';

const GOLD    = '#fbbf24';
const COLORS  = ['#fbbf24','#f59e0b','#d97706','#b45309','#92400e','#78350f','#60a5fa','#34d399','#f87171','#a78bfa'];

const Card = ({ title, children, style = {} }) => (
  <div style={{
    background: 'rgba(30,41,59,0.7)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    padding: '20px',
    backdropFilter: 'blur(12px)',
    ...style,
  }}>
    {title && <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', color: GOLD, textTransform: 'uppercase', letterSpacing: '1px' }}>{title}</h3>}
    {children}
  </div>
);

const StatBox = ({ label, value, sub, color = GOLD }) => (
  <div style={{ textAlign: 'center', padding: '8px' }}>
    <div style={{ fontSize: '32px', fontWeight: '900', color }}>{value}</div>
    <div style={{ fontSize: '12px', color: '#f8fafc', fontWeight: '600', marginTop: '4px' }}>{label}</div>
    {sub && <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{sub}</div>}
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'rgba(15,23,42,0.97)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 14px' }}>
        <p style={{ margin: 0, color: '#f8fafc', fontSize: '12px', fontWeight: '600' }}>{label}</p>
        <p style={{ margin: '4px 0 0', color: GOLD, fontSize: '14px', fontWeight: '900' }}>{payload[0].value} items</p>
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  const navigate  = useNavigate();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  useEffect(() => {
    analyticsApi.get()
      .then(res => setData(res))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ width: '100%', textAlign: 'center', padding: '80px', color: '#94a3b8' }}>
      <div style={{ fontSize: '36px', marginBottom: '12px' }}>📊</div>
      <p>Loading analytics...</p>
    </div>
  );

  if (error) return (
    <div style={{ width: '100%', textAlign: 'center', padding: '60px', color: '#ef4444' }}>
      <p>{error}</p>
    </div>
  );

  if (data?.empty) return (
    <div style={{ width: '100%', textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
      <p>No data available yet. Add items to the vault first.</p>
    </div>
  );

  const pieDataType = [
    { name: 'Notes', value: data.byType.note },
    { name: 'Coins', value: data.byType.coin },
  ];

  const pieDataSpecial = data.bySpecial.filter(d => d.count > 0);

  return (
    <div style={{ width: '100%', maxWidth: 1200 }}>
      <div className="page-header">
        <div className="header-buttons">
          <button className="btn-back" onClick={() => navigate('/')}>🏠 Home</button>
        </div>
        <h2 className="page-title">📊 Collection Analytics</h2>
      </div>

      {/* Top stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        <Card><StatBox label="Total Items" value={data.total} sub="in the vault" /></Card>
        <Card><StatBox label="Currency Notes" value={data.byType.note} sub={`${Math.round(data.byType.note / data.total * 100)}% of vault`} color="#60a5fa" /></Card>
        <Card><StatBox label="Coins" value={data.byType.coin} sub={`${Math.round(data.byType.coin / data.total * 100)}% of vault`} color="#34d399" /></Card>
        <Card><StatBox label="Error Items" value={data.errorItems} sub="printing / mint errors" color="#f87171" /></Card>
        <Card><StatBox label="Unique Serials" value={data.serialItems} sub="special serial numbers" color="#a78bfa" /></Card>
        <Card><StatBox label="Countries" value={data.byCountry.length} sub="represented" color={GOLD} /></Card>
      </div>

      {/* Row 1 — Bar + Pie */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>

        <Card title="Top 10 Countries">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.byCountry} layout="vertical" margin={{ left: 10, right: 20 }}>
              <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#f8fafc', fontSize: 11 }} width={100} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill={GOLD} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Notes vs Coins">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pieDataType} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={{ stroke: '#94a3b8' }}>
                {pieDataType.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ background: 'rgba(15,23,42,0.97)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Row 2 — Era + Decade */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>

        <Card title="By Historical Era">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.byEra} layout="vertical" margin={{ left: 10, right: 20 }}>
              <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#f8fafc', fontSize: 11 }} width={130} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {data.byEra.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="By Decade">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data.byDecade} margin={{ left: 0, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="count" stroke={GOLD} strokeWidth={2} dot={{ fill: GOLD, r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Row 3 — Special items + Recent */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>

        <Card title="Item Classification">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieDataSpecial} cx="50%" cy="50%" outerRadius={75} dataKey="count" label={({ name, count }) => `${name}: ${count}`} labelLine={{ stroke: '#94a3b8' }}>
                {pieDataSpecial.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ background: 'rgba(15,23,42,0.97)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Recent Additions (Last 6 Months)">
          {data.recentAdditions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '13px' }}>No recent additions data.</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.recentAdditions} margin={{ left: 0, right: 20 }}>
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#60a5fa" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </div>
  );
}
