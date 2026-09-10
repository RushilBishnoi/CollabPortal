import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import { SystemHealthData } from '../types/api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Server,
  Database,
  RefreshCw,
} from 'lucide-react';

export const StatusPage: React.FC = () => {
  const { data, isLoading, isError, refetch, isFetching } =
    useQuery<SystemHealthData>({
      queryKey: ['systemHealth'],
      queryFn: () => apiClient.get<SystemHealthData>('/health'),
      refetchInterval: 30000, // auto refresh every 30s
    });

  const isAppOperational = data?.status === 'ok';
  const isDbOperational = data?.services?.database?.status === 'connected';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-brand-600 font-semibold text-xs uppercase tracking-wider mb-1">
            <Activity className="w-4 h-4" />
            PLATFORM STATUS
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            System Status
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Current availability of CollabPortal services and platform components.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-sm transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <LoadingSpinner text="Checking system status..." />
        </div>
      ) : isError ? (
        <div className="bg-white rounded-2xl border border-red-200 p-8 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-red-900">
                System Status Unavailable
              </h3>
              <p className="text-sm text-red-700 mt-1">
                Unable to connect to system health services. Please try refreshing or check back shortly.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Status summary card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    isAppOperational
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-amber-50 text-amber-600'
                  }`}
                >
                  {isAppOperational ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <AlertTriangle className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900">
                      Overall System Status:
                    </h2>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                        isAppOperational
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {isAppOperational ? 'Operational' : 'Degraded'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Checked at {new Date(data?.timestamp || '').toLocaleTimeString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6 text-xs text-slate-600 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                {data?.uptime !== undefined && (
                  <div>
                    <span className="text-slate-400 block font-medium">Uptime</span>
                    <span className="font-semibold text-slate-900 font-mono">
                      {data.uptime >= 3600
                        ? `${Math.floor(data.uptime / 3600)}h ${Math.floor((data.uptime % 3600) / 60)}m`
                        : `${data.uptime}s`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Subsystem breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <Server className="w-4 h-4 text-slate-700" />
                  <span className="text-sm font-semibold text-slate-900">
                    Application Services
                  </span>
                </div>
                <span
                  className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md ${
                    isAppOperational
                      ? 'text-emerald-600 bg-emerald-50'
                      : 'text-amber-700 bg-amber-50'
                  }`}
                >
                  {isAppOperational ? (
                    <>
                      <CheckCircle2 className="w-3 h-3" />
                      Operational
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3 h-3" />
                      Degraded
                    </>
                  )}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Core CollabPortal services are operating normally.
              </p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <Database className="w-4 h-4 text-slate-700" />
                  <span className="text-sm font-semibold text-slate-900">
                    Database Services
                  </span>
                </div>
                <span
                  className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md ${
                    isDbOperational
                      ? 'text-emerald-600 bg-emerald-50'
                      : 'text-amber-700 bg-amber-50'
                  }`}
                >
                  {isDbOperational ? (
                    <>
                      <CheckCircle2 className="w-3 h-3" />
                      Operational
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3 h-3" />
                      Degraded
                    </>
                  )}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Platform data services are operating normally.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
