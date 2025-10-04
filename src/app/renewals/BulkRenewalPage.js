import React, { useState, useEffect } from 'react';
import { 
  Send, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Plus, 
  Trash2, 
  Edit3,
  Eye,
  Download,
  Mail,
  Calendar,
  DollarSign,
  Building2,
  Filter,
  Search,
  RefreshCw,
  X,
  Copy
} from 'lucide-react';
import { renewalPacketService } from '../../services/renewalPacketService';
import { contractService } from '../../services/supabaseService';
import { formatDate, formatCurrency } from '../utils/formatters';
import { useUserSync } from '../../hooks/useUserSync';
import TemplateLibrary from '../components/TemplateLibrary';

function BulkRenewalPage() {
  const { supabaseUser, loading: userLoading } = useUserSync();
  const [renewalPackets, setRenewalPackets] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [selectedContracts, setSelectedContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const [selectedPacket, setSelectedPacket] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    sent: 0,
    signed: 0,
    expired: 0
  });

  useEffect(() => {
    if (supabaseUser?.id) {
      fetchData();
    }
  }, [supabaseUser?.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [packetsData, contractsData, statsData] = await Promise.all([
        renewalPacketService.getRenewalPackets(supabaseUser.id),
        contractService.getContracts(supabaseUser.company_id),
        renewalPacketService.getRenewalPacketStats(supabaseUser.id)
      ]);
      
      setRenewalPackets(packetsData);
      setContracts(contractsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBulkPackets = async (packetData) => {
    try {
      setSending(true);
      console.log('Creating bulk packets with data:', packetData);
      console.log('Selected contracts:', selectedContracts);
      
      const packetsToCreate = selectedContracts.map(contract => ({
        user_id: supabaseUser.id,
        contract_id: contract.id,
        template_id: packetData.templateId || null,
        packet_name: `${contract.name || contract.contract_name || contract.vendor || 'Contract'} - Renewal Packet`,
        recipient_email: contract.contact_email || 'vendor@example.com',
        recipient_name: contract.vendor,
        packet_data: {
          content: renewalPacketService.generateRenewalPacketContent(contract, packetData.template),
          template: packetData.template,
          templateFileUrl: packetData.useUploadedTemplate ? packetData.template : null,
          isUploadedTemplate: packetData.useUploadedTemplate || false
        },
        expires_at: new Date(Date.now() + (packetData.expiryDays || 30) * 24 * 60 * 60 * 1000).toISOString()
      }));

      console.log('Packets to create:', packetsToCreate);
      const createdPackets = await renewalPacketService.createBulkRenewalPackets(packetsToCreate);
      console.log('Created packets:', createdPackets);
      
      setRenewalPackets(prev => [...createdPackets, ...prev]);
      setSelectedContracts([]);
      setSelectedTemplate(null);
      setShowCreateModal(false);
      
      // Refresh stats
      const statsData = await renewalPacketService.getRenewalPacketStats(supabaseUser.id);
      setStats(statsData);
      
      alert(`Successfully created ${createdPackets.length} renewal packet(s)!`);
    } catch (error) {
      console.error('Error creating bulk packets:', error);
      alert(`Failed to create renewal packets: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  const handleSendBulkPackets = async (packetIds) => {
    try {
      setSending(true);
      const results = await renewalPacketService.sendBulkRenewalPackets(packetIds);
      
      // Update local state with results
      const updatedPackets = renewalPackets.map(packet => {
        const result = results.find(r => r.packetId === packet.id);
        if (result && result.success) {
          return { ...packet, status: 'sent', esign_status: 'pending' };
        }
        return packet;
      });
      
      setRenewalPackets(updatedPackets);
    } catch (error) {
      console.error('Error sending bulk packets:', error);
    } finally {
      setSending(false);
    }
  };

  const handleViewPacket = async (packet) => {
    try {
      const fullPacket = await renewalPacketService.getRenewalPacket(packet.id);
      setSelectedPacket(fullPacket);
      setShowViewModal(true);
    } catch (error) {
      console.error('Error fetching packet details:', error);
      alert('Failed to load packet details. Please try again.');
    }
  };

  const handleDownloadPacket = (packet) => {
    const displayName = packet.packet_name || `${packet.recipient_name || 'Contract'} - Renewal Packet`;
    const content = packet.packet_data?.content || 'Renewal packet content not available';
    
    // Create a blob and download
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${displayName.replace(/[^a-z0-9]/gi, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleDeletePacket = async (packetId) => {
    if (window.confirm('Are you sure you want to delete this renewal packet?')) {
      try {
        await renewalPacketService.deleteRenewalPacket(packetId);
        setRenewalPackets(renewalPackets.filter(p => p.id !== packetId));
        alert('Renewal packet deleted successfully');
      } catch (error) {
        console.error('Error deleting packet:', error);
        alert('Failed to delete renewal packet');
      }
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'draft': return <Edit3 className="h-4 w-4 text-gray-500" />;
      case 'sent': return <Send className="h-4 w-4 text-blue-500" />;
      case 'signed': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'expired': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'signed': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredPackets = renewalPackets.filter(packet => {
    const matchesFilter = filter === 'all' || packet.status === filter;
    const matchesSearch = packet.packet_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         packet.recipient_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (userLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Loading renewal packets...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
                Bulk Renewal Packets
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl">
                Streamline your contract renewals with automated e-signature workflows
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowTemplateLibrary(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/80 backdrop-blur-sm text-gray-700 rounded-xl hover:bg-white transition-all duration-200 shadow-md hover:shadow-lg border border-gray-200"
              >
                <FileText className="h-5 w-5" />
                <span className="font-semibold">Manage Templates</span>
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-200" />
                <span className="font-semibold">Create Bulk Packets</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="group relative bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Packets</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl group-hover:from-gray-200 group-hover:to-gray-300 transition-all duration-300">
                <FileText className="h-6 w-6 text-gray-700" />
              </div>
            </div>
          </div>
          
          <div className="group relative bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-orange-100 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Draft</p>
                <p className="text-3xl font-bold text-amber-600">{stats.draft}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-amber-100 to-orange-200 rounded-xl group-hover:from-amber-200 group-hover:to-orange-300 transition-all duration-300">
                <Edit3 className="h-6 w-6 text-amber-700" />
              </div>
            </div>
          </div>
          
          <div className="group relative bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Sent</p>
                <p className="text-3xl font-bold text-blue-600">{stats.sent}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-xl group-hover:from-blue-200 group-hover:to-indigo-300 transition-all duration-300">
                <Send className="h-6 w-6 text-blue-700" />
              </div>
            </div>
          </div>
          
          <div className="group relative bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Signed</p>
                <p className="text-3xl font-bold text-green-600">{stats.signed}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-200 rounded-xl group-hover:from-green-200 group-hover:to-emerald-300 transition-all duration-300">
                <CheckCircle2 className="h-6 w-6 text-green-700" />
              </div>
            </div>
          </div>
          
          <div className="group relative bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-rose-100 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Expired</p>
                <p className="text-3xl font-bold text-red-600">{stats.expired}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-red-100 to-rose-200 rounded-xl group-hover:from-red-200 group-hover:to-rose-300 transition-all duration-300">
                <AlertCircle className="h-6 w-6 text-red-700" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex items-center gap-4 bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-white/20 shadow-lg mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-lg">
              <Filter className="h-5 w-5 text-blue-600" />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm font-medium"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="signed">Signed</option>
              <option value="expired">Expired</option>
            </select>
          </div>
          <div className="flex items-center gap-3 flex-1">
            <div className="p-2 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg">
              <Search className="h-5 w-5 text-gray-600" />
            </div>
            <input
              type="text"
              placeholder="Search packets by name or vendor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm font-medium placeholder-gray-400"
            />
          </div>
        </div>

        {/* Packets Table */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg overflow-hidden">
          {filteredPackets.length === 0 ? (
            <div className="text-center py-16 px-8">
              <div className="mx-auto w-32 h-32 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full flex items-center justify-center mb-6 shadow-lg">
                <Send className="h-16 w-16 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No renewal packets yet</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg leading-relaxed">
                Streamline your contract renewal process by creating your first bulk renewal packet with e-signature capabilities.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-200" />
                <span className="font-semibold">Create Your First Packet</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200/50">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Packet Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Vendor
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Contract
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      E-Sign Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Sent Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white/50 divide-y divide-gray-200/30">
                  {filteredPackets.map((packet) => (
                    <tr key={packet.id} className="hover:bg-white/80 transition-colors duration-200">
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-lg mr-3">
                            <FileText className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{packet.packet_name || `${packet.recipient_name || 'Contract'} - Renewal Packet`}</div>
                            <div className="text-sm text-gray-500">{packet.recipient_email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="p-2 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mr-3">
                            <Building2 className="h-4 w-4 text-gray-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-900">{packet.recipient_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{packet.contracts?.name}</div>
                        <div className="text-sm text-gray-500">
                          {packet.contracts?.value && formatCurrency(packet.contracts.value)}
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(packet.status)}`}>
                          {getStatusIcon(packet.status)}
                          {packet.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(packet.esign_status)}`}>
                          {packet.esign_status === 'completed' ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                          {packet.esign_status || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-500">
                        {packet.sent_at ? formatDate(packet.sent_at) : '-'}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-3">
                          {packet.status === 'draft' && (
                            <button
                              onClick={() => handleSendBulkPackets([packet.id])}
                              className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                              disabled={sending}
                            >
                              <Send className="h-4 w-4" />
                            </button>
                          )}
                          <button 
                            onClick={() => handleViewPacket(packet)}
                            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDownloadPacket(packet)}
                            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDeletePacket(packet.id)}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </div>

        {/* Create Bulk Packets Modal */}
        {showCreateModal && (
          <CreateBulkPacketsModal
            contracts={contracts}
            selectedContracts={selectedContracts}
            setSelectedContracts={setSelectedContracts}
            selectedTemplate={selectedTemplate}
            onCreate={handleCreateBulkPackets}
            onClose={() => {
              setShowCreateModal(false);
              setSelectedTemplate(null);
            }}
            sending={sending}
          />
        )}

        {/* View Packet Modal */}
        {showViewModal && selectedPacket && (
          <ViewPacketModal
            packet={selectedPacket}
            onClose={() => {
              setShowViewModal(false);
              setSelectedPacket(null);
            }}
          />
        )}

        {/* Template Library Modal */}
        {showTemplateLibrary && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto border border-white/20">
              <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-gray-200/50 px-8 py-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent">
                      Template Library
                    </h2>
                    <p className="text-gray-600 mt-2">Upload and manage your contract renewal templates</p>
                  </div>
                  <button 
                    onClick={() => setShowTemplateLibrary(false)}
                    className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100/80 rounded-xl transition-all duration-200"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="p-8">
                <TemplateLibrary 
                  userId={supabaseUser?.id} 
                  onSelectTemplate={(template) => {
                    console.log('Selected template:', template);
                    setSelectedTemplate(template);
                    setShowTemplateLibrary(false);
                    setShowCreateModal(true);
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Create Bulk Packets Modal Component
function CreateBulkPacketsModal({ contracts, selectedContracts, setSelectedContracts, selectedTemplate, onCreate, onClose, sending }) {
  const [template, setTemplate] = useState('');
  const [expiryDays, setExpiryDays] = useState(30);
  const [useUploadedTemplate, setUseUploadedTemplate] = useState(!!selectedTemplate);
  
  useEffect(() => {
    if (selectedTemplate) {
      setUseUploadedTemplate(true);
    }
  }, [selectedTemplate]);

  const handleContractSelect = (contract) => {
    if (selectedContracts.find(c => c.id === contract.id)) {
      setSelectedContracts(prev => prev.filter(c => c.id !== contract.id));
    } else {
      setSelectedContracts(prev => [...prev, contract]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedContracts.length === 0) {
      alert('Please select at least one contract.');
      return;
    }
    if (!selectedTemplate && !template) {
      alert('Please enter a template or select one from your library.');
      return;
    }
    onCreate({ 
      template: selectedTemplate ? selectedTemplate.template_content || selectedTemplate.template_file_url : template,
      templateId: selectedTemplate?.id,
      useUploadedTemplate: !!selectedTemplate,
      expiryDays 
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-white/20">
        <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-gray-200/50 px-8 py-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent">
                Create Bulk Renewal Packets
              </h2>
              <p className="text-gray-600 mt-2">Select contracts and create renewal packets with e-signature</p>
            </div>
            <button 
              onClick={onClose} 
              className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100/80 rounded-xl transition-all duration-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Template Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Renewal Template
              </label>
              
              {selectedTemplate ? (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-green-100 rounded-xl">
                        <FileText className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-green-900">{selectedTemplate.template_name}</div>
                        <div className="text-sm text-green-600">
                          {selectedTemplate.is_uploaded ? `${selectedTemplate.template_file_type?.toUpperCase()} Template` : 'Text Template'}
                        </div>
                        {selectedTemplate.description && (
                          <div className="text-sm text-green-700 mt-1">{selectedTemplate.description}</div>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedTemplate(null)}
                      className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <textarea
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none shadow-sm font-medium"
                  placeholder="Enter your renewal packet template, or click 'Manage Templates' to use an uploaded template..."
                />
              )}
              
              <p className="text-sm text-gray-500 mt-2">
                {selectedTemplate 
                  ? 'This template will be applied to all selected contracts.' 
                  : 'Enter a template or select one from your template library.'}
              </p>
            </div>

            {/* Contract Selection */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-semibold text-gray-700">
                  Select Contracts
                </label>
                <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full">
                  {selectedContracts.length} selected
                </span>
              </div>
              
              {contracts.length === 0 ? (
                <div className="border border-gray-200 rounded-xl p-12 text-center bg-gray-50/50">
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Building2 className="h-8 w-8 text-gray-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No contracts available</h3>
                  <p className="text-gray-600">You need to have contracts in your system to create renewal packets.</p>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-xl max-h-80 overflow-y-auto bg-white/50">
                  {contracts.map((contract) => (
                    <div
                      key={contract.id}
                      className={`p-5 border-b border-gray-200/50 last:border-b-0 cursor-pointer transition-all duration-200 ${
                        selectedContracts.find(c => c.id === contract.id) 
                          ? 'bg-blue-50/80 border-blue-200' 
                          : 'hover:bg-white/80'
                      }`}
                      onClick={() => handleContractSelect(contract)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                            selectedContracts.find(c => c.id === contract.id)
                              ? 'bg-blue-600 border-blue-600 shadow-lg'
                              : 'border-gray-300 hover:border-blue-400'
                          }`}>
                            {selectedContracts.find(c => c.id === contract.id) && (
                              <CheckCircle2 className="h-3 w-3 text-white" />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{contract.name}</div>
                            <div className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                              <Building2 className="h-3 w-3" />
                              {contract.vendor}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-gray-900">
                            {contract.value && formatCurrency(contract.value)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {contract.end_date && `Expires ${formatDate(contract.end_date)}`}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200/50">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-gray-700 bg-gray-100/80 rounded-xl hover:bg-gray-200/80 transition-all duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={selectedContracts.length === 0 || sending}
                className="group px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
              >
                {sending ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span className="font-semibold">Creating...</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-200" />
                    <span className="font-semibold">Create {selectedContracts.length} Packet{selectedContracts.length !== 1 ? 's' : ''}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// View Packet Modal Component
function ViewPacketModal({ packet, onClose }) {
  if (!packet) return null;

  const displayName = packet.packet_name || `${packet.recipient_name || 'Contract'} - Renewal Packet`;
  const content = packet.packet_data?.content || 'Renewal packet content not available';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
    alert('Packet content copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-white/20">
        <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-gray-200/50 px-8 py-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent">
                {displayName}
              </h2>
              <p className="text-gray-600 mt-2">Renewal Packet Details</p>
            </div>
            <button 
              onClick={onClose} 
              className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100/80 rounded-xl transition-all duration-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-8 space-y-6">
          {/* Packet Information */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/80 backdrop-blur-sm p-4 rounded-xl border border-blue-200/30">
              <div className="text-sm text-blue-600 font-semibold mb-1">Recipient</div>
              <div className="text-gray-900 font-medium">{packet.recipient_name}</div>
            </div>
            <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/80 backdrop-blur-sm p-4 rounded-xl border border-blue-200/30">
              <div className="text-sm text-blue-600 font-semibold mb-1">Email</div>
              <div className="text-gray-900 font-medium">{packet.recipient_email}</div>
            </div>
            <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/80 backdrop-blur-sm p-4 rounded-xl border border-blue-200/30">
              <div className="text-sm text-blue-600 font-semibold mb-1">Status</div>
              <div className="text-gray-900 font-medium capitalize">{packet.status}</div>
            </div>
            <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/80 backdrop-blur-sm p-4 rounded-xl border border-blue-200/30">
              <div className="text-sm text-blue-600 font-semibold mb-1">E-Sign Status</div>
              <div className="text-gray-900 font-medium capitalize">{packet.esign_status || 'N/A'}</div>
            </div>
          </div>

          {/* Packet Content */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Packet Content</h3>
              <button
                onClick={copyToClipboard}
                className="px-4 py-2 text-sm bg-blue-100/80 text-blue-700 rounded-lg hover:bg-blue-200/80 transition-all duration-200 flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                Copy Content
              </button>
            </div>
            <div className="bg-gradient-to-br from-gray-50/80 to-slate-50/80 backdrop-blur-sm p-6 rounded-xl border border-gray-200/30 font-mono text-sm whitespace-pre-wrap text-gray-800">
              {content}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 text-gray-700 bg-gray-100/80 rounded-xl hover:bg-gray-200/80 transition-all duration-200 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BulkRenewalPage;
