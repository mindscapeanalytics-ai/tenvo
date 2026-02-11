'use client';

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = ['#8B1538', '#A01A42', '#C41E3A', '#DC143C', '#FF6B6B', '#FF8787'];

/**
 * @param {Object} props
 * @param {any[]} props.data
 * @param {any} [props.colors]
 */
export function SalesChart({ data, colors }) {
  const primary = colors?.primary || '#8B1538';
  const secondary = colors?.primaryLight || '#A01A42';

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip contentStyle={{ borderRadius: '12px', borderColor: '#f0f0f0' }} />
        <Legend />
        <Line type="monotone" dataKey="sales" stroke={primary} strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 8 }} />
        <Line type="monotone" dataKey="revenue" stroke={secondary} strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

/**
 * @param {Object} props
 * @param {any[]} props.data
 * @param {any} [props.colors]
 */
export function RevenueBarChart({ data, colors }) {
  const primary = colors?.primary || '#8B1538';
  const secondary = colors?.primaryLight || '#A01A42';

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="revenue" fill={primary} />
        <Bar dataKey="profit" fill={secondary} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/**
 * @param {Object} props
 * @param {any[]} props.data
 */
export function CategoryPieChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}

/**
 * @param {Object} props
 * @param {any[]} props.data
 * @param {any} [props.colors]
 */
export function RevenueAreaChart({ data, colors }) {
  const primary = colors?.primary || '#8B1538';
  const secondary = colors?.primaryLight || '#A01A42';

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
        <Legend />
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={primary} stopOpacity={0.1} />
            <stop offset="95%" stopColor={primary} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={secondary} stopOpacity={0.1} />
            <stop offset="95%" stopColor={secondary} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="revenue" stackId="1" stroke={primary} strokeWidth={3} fill="url(#colorRevenue)" />
        <Area type="monotone" dataKey="expenses" stackId="2" stroke={secondary} strokeWidth={3} fill="url(#colorExpenses)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/**
 * @param {Object} props
 * @param {any[]} props.data
 * @param {any} [props.colors]
 */
export function TopProductsChart({ data, colors }) {
  const primary = colors?.primary || '#8B1538';

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis dataKey="name" type="category" width={100} />
        <Tooltip />
        <Bar dataKey="sales" fill={primary} />
      </BarChart>
    </ResponsiveContainer>
  );
}








