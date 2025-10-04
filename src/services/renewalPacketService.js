import { supabase } from '../lib/supabase';

/**
 * Service for managing renewal packets and e-signatures
 */
class RenewalPacketService {
  /**
   * Get all renewal packets for a user
   */
  async getRenewalPackets(userId) {
    try {
      const response = await fetch(`http://localhost:3002/api/renewal-packets?user_id=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch renewal packets');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching renewal packets:', error);
      // Return empty array if there's an error (table doesn't exist)
      return [];
    }
  }

  /**
   * Initialize tables if they don't exist
   */
  async initializeTables() {
    try {
      const response = await fetch('http://localhost:3002/api/renewal-packets/init-tables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to initialize tables');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error initializing tables:', error);
      throw error;
    }
  }

  /**
   * Create a new renewal packet
   */
  async createRenewalPacket(packetData) {
    try {
      const response = await fetch('http://localhost:3002/api/renewal-packets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(packetData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create renewal packet');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating renewal packet:', error);
      throw error;
    }
  }

  /**
   * Create multiple renewal packets (bulk operation)
   */
  async createBulkRenewalPackets(packetsData) {
    try {
      const response = await fetch('http://localhost:3002/api/renewal-packets/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ packets: packetsData }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create bulk renewal packets');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating bulk renewal packets:', error);
      throw error;
    }
  }

  /**
   * Update renewal packet status
   */
  async updateRenewalPacketStatus(packetId, status, additionalData = {}) {
    try {
      const updateData = {
        status,
        updated_at: new Date().toISOString(),
        ...additionalData
      };

      const { data, error } = await supabase
        .from('renewal_packets')
        .update(updateData)
        .eq('id', packetId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating renewal packet status:', error);
      throw error;
    }
  }

  /**
   * Send renewal packet via e-signature service
   */
  async sendRenewalPacket(packetId, esignService = 'docusign') {
    try {
      // Get the packet data
      const { data: packet, error: fetchError } = await supabase
        .from('renewal_packets')
        .select('*')
        .eq('id', packetId)
        .single();

      if (fetchError) throw fetchError;

      // Call the server API to send via e-signature service
      const response = await fetch(`/api/renewal-packets/${packetId}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          esignService,
          packetData: packet
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send renewal packet');
      }

      const result = await response.json();
      
      // Update packet with e-signature envelope ID
      await this.updateRenewalPacketStatus(packetId, 'sent', {
        esign_envelope_id: result.envelopeId,
        esign_status: 'pending',
        sent_at: new Date().toISOString(),
        expires_at: result.expiresAt
      });

      return result;
    } catch (error) {
      console.error('Error sending renewal packet:', error);
      throw error;
    }
  }

  /**
   * Send multiple renewal packets (bulk send)
   */
  async sendBulkRenewalPackets(packetIds, esignService = 'docusign') {
    try {
      const results = [];
      
      for (const packetId of packetIds) {
        try {
          const result = await this.sendRenewalPacket(packetId, esignService);
          results.push({ packetId, success: true, result });
        } catch (error) {
          results.push({ packetId, success: false, error: error.message });
        }
      }

      return results;
    } catch (error) {
      console.error('Error sending bulk renewal packets:', error);
      throw error;
    }
  }

  /**
   * Get renewal packet templates
   */
  async getRenewalPacketTemplates(userId) {
    try {
      const { data, error } = await supabase
        .from('renewal_packet_templates')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching renewal packet templates:', error);
      throw error;
    }
  }

  /**
   * Create or update renewal packet template
   */
  async saveRenewalPacketTemplate(templateData) {
    try {
      const response = await fetch('http://localhost:3002/api/renewal-packet-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateData),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to save template';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // Response is not JSON, likely an HTML error page
          const text = await response.text();
          console.error('Server returned non-JSON response:', text.substring(0, 200));
          errorMessage = 'Server error - please ensure the database tables are created';
        }
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error('Error saving renewal packet template:', error);
      throw error;
    }
  }

  /**
   * Get a single renewal packet by ID
   */
  async getRenewalPacket(packetId) {
    try {
      const response = await fetch(`http://localhost:3002/api/renewal-packets/${packetId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch renewal packet');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching renewal packet:', error);
      throw error;
    }
  }

  /**
   * Delete renewal packet
   */
  async deleteRenewalPacket(packetId) {
    try {
      const response = await fetch(`http://localhost:3002/api/renewal-packets/${packetId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete renewal packet');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting renewal packet:', error);
      throw error;
    }
  }

  /**
   * Get renewal packet statistics
   */
  async getRenewalPacketStats(userId) {
    try {
      const response = await fetch(`http://localhost:3002/api/renewal-packets/stats?user_id=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch renewal packet stats');
      }

      const stats = await response.json();
      
      // Add additional stats that the UI expects
      return {
        ...stats,
        pendingSignature: stats.sent || 0,
        completedSignature: stats.signed || 0
      };
    } catch (error) {
      console.error('Error fetching renewal packet stats:', error);
      // Return empty stats if there's an error
      return {
        total: 0,
        draft: 0,
        sent: 0,
        signed: 0,
        expired: 0,
        pendingSignature: 0,
        completedSignature: 0
      };
    }
  }

  /**
   * Get all renewal packet templates for a user
   */
  async getRenewalPacketTemplates(userId) {
    try {
      const response = await fetch(`http://localhost:3002/api/renewal-packet-templates?user_id=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch templates');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching templates:', error);
      return [];
    }
  }

  /**
   * Delete a renewal packet template
   */
  async deleteRenewalPacketTemplate(templateId) {
    try {
      const response = await fetch(`http://localhost:3002/api/renewal-packet-templates/${templateId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete template');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting template:', error);
      throw error;
    }
  }

  /**
   * Generate renewal packet content from contract data
   */
  generateRenewalPacketContent(contract, template = null) {
    const defaultTemplate = `
Dear ${contract.vendor},

We hope this message finds you well. We are writing to discuss the renewal of our contract agreement.

Contract Details:
- Contract Name: ${contract.name}
- Current End Date: ${contract.end_date ? new Date(contract.end_date).toLocaleDateString() : 'Not specified'}
- Contract Value: $${contract.value || 'Not specified'}

We would like to discuss renewing this contract for another term. Please review the attached renewal agreement and let us know if you have any questions or concerns.

We look forward to continuing our partnership.

Best regards,
[Your Name]
[Your Company]
    `.trim();

    const content = template || defaultTemplate;
    
    return content
      .replace(/\${contract\.name}/g, contract.name || '')
      .replace(/\${contract\.vendor}/g, contract.vendor || '')
      .replace(/\${contract\.end_date}/g, contract.end_date ? new Date(contract.end_date).toLocaleDateString() : 'Not specified')
      .replace(/\${contract\.value}/g, contract.value ? `$${contract.value}` : 'Not specified')
      .replace(/\${contract\.start_date}/g, contract.start_date ? new Date(contract.start_date).toLocaleDateString() : 'Not specified');
  }
}

export const renewalPacketService = new RenewalPacketService();
