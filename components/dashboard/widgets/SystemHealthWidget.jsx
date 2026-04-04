'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Database, 
  Server, 
  AlertTriangle, 
  CheckCircle2,
  Clock,
  HardDrive,
  Zap
} from 'lucide-react';
import { useLanguage } from '@/lib/context/LanguageContext';
import { translations } from '@/lib/translations';

/**
 * SystemHealthWidget
 * 
 * Displays system health indicators for owner/admin dashboard
 * Shows server status, database performance, and error logs
 * 
 * Requirements: 6.3
 * 
 * @param {Object} props
 * @param {string} props.businessId - Business ID
 * @param {Function} props.onViewLogs - Callback when user clicks to view system logs
 */
export function SystemHealthWidget({ 
  businessId,
  onViewLogs 
}) {
  const { language } = useLanguage();
  const t = translations[language] || translations['en'] || {};
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSystemHealth();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadSystemHealth, 30000);
    return () => clearInterval(interval);
  }, [businessId]);

  const loadSystemHealth = async () => {
    try {
      // In a real implementation, this would fetch from a monitoring API
      // For now, we'll simulate system health data
      const mockHealth = {
        server: {
          status: 'healthy',
          uptime: 99.98,
          responseTime: 45, // ms
          lastCheck: new Date()
        },
        database: {
          status: 'healthy',
          connections: 12,
          maxConnections: 100,
          queryTime: 23, // ms
          storageUsed: 45, // percentage
        },
        errors: {
          count: 3,
          critical: 0,
          warnings: 3,
          lastError: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
        }
      };
      
      setHealth(mockHealth);
    } catch (err) {
      console.error('Failed to load system health:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      healthy: 'text-green-600 bg-green-50 border-green-200',
      warning: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      critical: 'text-red-600 bg-red-50 border-red-200'
    };
    return colors[status] || colors.warning;
  };

  const getStatusIcon = (status) => {
    if (status === 'healthy') {
      return <CheckCircle2 className="w-4 h-4" />;
    }
    return <AlertTriangle className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <Card className="glass-card border-none">
        <CardHeader className="pb-3">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-32 mb-2" />
          <div className="h-3 bg-gray-100 rounded animate-pulse w-24" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-12 bg-gray-100 rounded animate-pulse" />
            <div className="h-12 bg-gray-100 rounded animate-pulse" />
            <div className="h-12 bg-gray-100 rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const overallStatus = health?.errors?.critical > 0 ? 'critical' : 
                       health?.errors?.warnings > 0 ? 'warning' : 'healthy';

  return (
    <Card className="glass-card border-none">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-gray-900">
              {t.system_health || 'System Health'}
            </CardTitle>
            <CardDescription className="text-xs">
              {t.real_time_monitoring || 'Real-time monitoring'}
            </CardDescription>
          </div>
          <div className="p-2.5 rounded-2xl bg-blue-50 border border-blue-200 shadow-inner">
            <Activity className="w-5 h-5 text-blue-600" />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Overall Status Badge */}
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <span className="text-xs font-medium text-gray-600">
            {t.overall_status || 'Overall Status'}
          </span>
          <Badge className={`${getStatusColor(overallStatus)} border font-bold text-xs`}>
            {getStatusIcon(overallStatus)}
            <span className="ml-1 capitalize">{overallStatus}</span>
          </Badge>
        </div>

        {/* Server Status */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50/50 border border-gray-100">
          <div className="p-2 rounded-lg bg-white border border-gray-200">
            <Server className="w-4 h-4 text-gray-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-gray-900">
                {t.server_status || 'Server Status'}
              </span>
              <Badge className={`${getStatusColor(health?.server?.status)} text-[10px] font-bold`}>
                {health?.server?.status}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-gray-600">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{health?.server?.uptime}% {t.uptime || 'uptime'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3" />
                <span>{health?.server?.responseTime}ms</span>
              </div>
            </div>
          </div>
        </div>

        {/* Database Performance */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50/50 border border-gray-100">
          <div className="p-2 rounded-lg bg-white border border-gray-200">
            <Database className="w-4 h-4 text-gray-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-gray-900">
                {t.database_performance || 'Database Performance'}
              </span>
              <Badge className={`${getStatusColor(health?.database?.status)} text-[10px] font-bold`}>
                {health?.database?.status}
              </Badge>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-gray-600">
                <span>{t.connections || 'Connections'}</span>
                <span className="font-bold">
                  {health?.database?.connections}/{health?.database?.maxConnections}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                  style={{ 
                    width: `${(health?.database?.connections / health?.database?.maxConnections) * 100}%` 
                  }}
                />
              </div>
              <div className="flex items-center gap-3 text-[10px] text-gray-600">
                <div className="flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  <span>{health?.database?.queryTime}ms {t.avg_query || 'avg query'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <HardDrive className="w-3 h-3" />
                  <span>{health?.database?.storageUsed}% {t.storage || 'storage'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Logs */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50/50 border border-gray-100">
          <div className="p-2 rounded-lg bg-white border border-gray-200">
            <AlertTriangle className="w-4 h-4 text-gray-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-gray-900">
                {t.error_logs || 'Error Logs'}
              </span>
              <Badge variant="outline" className="text-[10px] font-bold">
                {health?.errors?.count} {t.total || 'total'}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-gray-600">
              {health?.errors?.critical > 0 && (
                <div className="flex items-center gap-1 text-red-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                  <span>{health?.errors?.critical} {t.critical || 'critical'}</span>
                </div>
              )}
              {health?.errors?.warnings > 0 && (
                <div className="flex items-center gap-1 text-yellow-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-600" />
                  <span>{health?.errors?.warnings} {t.warnings || 'warnings'}</span>
                </div>
              )}
              {health?.errors?.count === 0 && (
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{t.no_errors || 'No errors'}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Action */}
        <Button
          onClick={onViewLogs}
          variant="outline"
          size="sm"
          className="w-full text-xs font-bold"
        >
          {t.view_system_logs || 'View System Logs'}
        </Button>

        {/* Last Updated */}
        <div className="text-center text-[10px] text-gray-400">
          {t.last_updated || 'Last updated'}: {new Date().toLocaleTimeString()}
        </div>
      </CardContent>
    </Card>
  );
}
