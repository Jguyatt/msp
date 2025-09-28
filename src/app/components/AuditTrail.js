import React, { useState, useEffect } from 'react';
import { History, User, Edit, Plus, Trash2, Upload, Mail, Eye, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

function AuditTrail({ contractId }) {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAuditLogs = async () => {
      if (!contractId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`http://localhost:3001/api/audit-logs/${contractId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch audit logs');
        }
        
        const data = await response.json();
        const logs = data.auditLogs || [];
        
        // Ensure all logs have required fields and valid dates
        const validLogs = logs.map(log => ({
          ...log,
          created_at: log.created_at || log.timestamp || new Date().toISOString(),
          actor: log.actor || 'Unknown',
          actorEmail: log.actor_email || log.actorEmail || 'unknown@example.com',
          details: log.details || 'No details available',
          changes: log.changes || {}
        }));
        
        setAuditLogs(validLogs);
      } catch (err) {
        console.error('Error fetching audit logs:', err);
        setError(err.message);
        setAuditLogs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAuditLogs();
  }, [contractId]);

  const getActionIcon = (action) => {
    switch (action) {
      case 'contract_created':
        return <Plus className="h-4 w-4 text-green-600" />;
      case 'contract_updated':
        return <Edit className="h-4 w-4 text-blue-600" />;
      case 'contract_deleted':
        return <Trash2 className="h-4 w-4 text-red-600" />;
      case 'contract_uploaded':
        return <Upload className="h-4 w-4 text-purple-600" />;
      case 'reminder_sent':
        return <Mail className="h-4 w-4 text-orange-600" />;
      case 'contract_viewed':
        return <Eye className="h-4 w-4 text-gray-600" />;
      default:
        return <History className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'contract_created':
        return 'bg-green-100 text-green-800';
      case 'contract_updated':
        return 'bg-blue-100 text-blue-800';
      case 'contract_deleted':
        return 'bg-red-100 text-red-800';
      case 'contract_uploaded':
        return 'bg-purple-100 text-purple-800';
      case 'reminder_sent':
        return 'bg-orange-100 text-orange-800';
      case 'contract_viewed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionLabel = (action) => {
    switch (action) {
      case 'contract_created':
        return 'Contract Created';
      case 'contract_updated':
        return 'Contract Updated';
      case 'contract_deleted':
        return 'Contract Deleted';
      case 'contract_uploaded':
        return 'Contract Uploaded';
      case 'reminder_sent':
        return 'Reminder Sent';
      case 'contract_viewed':
        return 'Contract Viewed';
      default:
        return 'Action Performed';
    }
  };

  const formatChanges = (changes) => {
    if (!changes || Object.keys(changes).length === 0) return null;
    
    return Object.entries(changes).map(([field, change]) => {
      if (typeof change === 'object' && change !== null && change.from !== undefined) {
        return (
          <div key={field} className="text-xs text-gray-600">
            <span className="font-medium">{field.replace('_', ' ')}:</span> "{change.from}" → "{change.to}"
          </div>
        );
      }
      return (
        <div key={field} className="text-xs text-gray-600">
          <span className="font-medium">{field.replace('_', ' ')}:</span> {change !== null && change !== undefined ? String(change) : 'null'}
        </div>
      );
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <History className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Audit Trail</h3>
        </div>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <History className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Audit Trail</h3>
        </div>
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading audit trail</h3>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <History className="h-6 w-6 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Audit Trail</h3>
      </div>

      <div className="space-y-4">
        {auditLogs.map((log) => (
          <div key={log.id} className="border border-gray-200 rounded-lg p-4 bg-white">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                {getActionIcon(log.action)}
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                      {getActionLabel(log.action)}
                    </span>
                    {log.actor !== 'System' && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <User className="h-3 w-3" />
                        {log.actor}
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 mt-1">{log.details}</p>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                {log.created_at && !isNaN(new Date(log.created_at).getTime()) 
                  ? format(new Date(log.created_at), 'MMM dd, yyyy HH:mm')
                  : 'Invalid date'
                }
              </div>
            </div>

            {log.changes && Object.keys(log.changes).length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="text-xs font-medium text-gray-600 mb-2">Changes:</div>
                <div className="space-y-1">
                  {formatChanges(log.changes)}
                </div>
              </div>
            )}

            {log.actor !== 'System' && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="text-xs text-gray-500">
                  Actor: {log.actorEmail}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {auditLogs.length === 0 && (
        <div className="text-center py-8">
          <History className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No audit logs</h3>
          <p className="mt-1 text-sm text-gray-500">
            Contract activity will appear here.
          </p>
        </div>
      )}
    </div>
  );
}

export default AuditTrail;
