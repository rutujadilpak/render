import { apiClient } from './api';
import { 
  ServiceDetails, 
  ServiceStats, 
  ServiceType, 
  ServiceAssignmentRequest,
  ServiceStartRequest,
  ServiceCompleteRequest,
  FinalPhotoRequest,
  WorkflowCompleteRequest
} from '@/types';
import { useState, useEffect } from 'react';

const API_BASE = '/api/services';

export const serviceApiService = {
  // Get all service stage enquiries
  async getServiceEnquiries(): Promise<ServiceDetails[]> {
    try {
      const url = `${API_BASE}/enquiries`;
      console.log('🔍 serviceApiService.getServiceEnquiries - Calling URL:', url);
      console.log('🔍 serviceApiService.getServiceEnquiries - API_BASE:', API_BASE);
      
      const response = await apiClient.get(`${API_BASE}/enquiries`);
      console.log('🔍 serviceApiService.getServiceEnquiries - Response:', response);
      
      return response.data || [];
    } catch (error) {
      console.error('Error fetching service enquiries:', error);
      throw new Error('Failed to fetch service enquiries');
    }
  },

  // Get service statistics
  async getServiceStats(): Promise<ServiceStats> {
    try {
      const response = await apiClient.get(`${API_BASE}/stats`);
      return response.data || {
        pendingCount: 0,
        inProgressCount: 0,
        doneCount: 0,
        totalServices: 0
      };
    } catch (error) {
      console.error('Error fetching service stats:', error);
      throw new Error('Failed to fetch service statistics');
    }
  },

  // Get specific enquiry service details
  async getEnquiryServiceDetails(enquiryId: number): Promise<ServiceDetails | null> {
    try {
      const response = await apiClient.get(`${API_BASE}/enquiries/${enquiryId}`);
      return response.data || null;
    } catch (error) {
      console.error('Error fetching enquiry service details:', error);
      throw new Error('Failed to fetch enquiry service details');
    }
  },

  // Assign services to an enquiry
  async assignServices(enquiryId: number, serviceTypes: ServiceType[]): Promise<void> {
    try {
      const request: ServiceAssignmentRequest = {
        enquiryId,
        serviceTypes
      };
      
      await apiClient.post(`${API_BASE}/enquiries/${enquiryId}/assign`, request);
    } catch (error) {
      console.error('Error assigning services:', error);
      throw new Error('Failed to assign services');
    }
  },

  // Start a service
  async startService(enquiryId: number, serviceTypeId: number, beforePhoto: string, notes?: string): Promise<void> {
    try {
      const request: ServiceStartRequest = {
        serviceTypeId,
        beforePhoto,
        notes
      };
      
      await apiClient.post(`${API_BASE}/enquiries/${enquiryId}/start`, request);
    } catch (error) {
      console.error('Error starting service:', error);
      throw new Error('Failed to start service');
    }
  },

  // Complete a service
  async completeService(enquiryId: number, serviceTypeId: number, afterPhoto: string, notes?: string): Promise<void> {
    try {
      const request: ServiceCompleteRequest = {
        serviceTypeId,
        afterPhoto,
        notes
      };
      
      await apiClient.post(`${API_BASE}/enquiries/${enquiryId}/complete`, request);
    } catch (error) {
      console.error('Error completing service:', error);
      throw new Error('Failed to complete service');
    }
  },

  // Save final overall photo
  async saveFinalPhoto(enquiryId: number, afterPhoto: string, notes?: string): Promise<void> {
    try {
      const request: FinalPhotoRequest = {
        enquiryId,
        afterPhoto,
        notes
      };
      
      await apiClient.post(`${API_BASE}/enquiries/${enquiryId}/final-photo`, request);
    } catch (error) {
      console.error('Error saving final photo:', error);
      throw new Error('Failed to save final photo');
    }
  },

  // Complete workflow and move to billing
  async completeWorkflow(enquiryId: number, actualCost: number, workNotes?: string): Promise<void> {
    try {
      const request: WorkflowCompleteRequest = {
        enquiryId,
        actualCost,
        workNotes
      };
      
      await apiClient.post(`${API_BASE}/enquiries/${enquiryId}/complete-workflow`, request);
    } catch (error) {
      console.error('Error completing workflow:', error);
      throw new Error('Failed to complete workflow');
    }
  }
};

// Custom hook for service enquiries with polling
export const useServiceEnquiries = (pollingInterval: number = 2000) => {
  const [enquiries, setEnquiries] = useState<ServiceDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const fetchEnquiries = async () => {
      try {
        setError(null);
        const data = await serviceApiService.getServiceEnquiries();
        setEnquiries(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch enquiries');
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchEnquiries();

    // Set up polling
    if (pollingInterval > 0) {
      intervalId = setInterval(fetchEnquiries, pollingInterval);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [pollingInterval]);

  const refetch = async () => {
    try {
      console.log('🔄 useServiceEnquiries.refetch - Starting manual refetch...');
      setError(null);
      const data = await serviceApiService.getServiceEnquiries();
      console.log('🔄 useServiceEnquiries.refetch - Got data:', data);
      setEnquiries(data);
      console.log('✅ useServiceEnquiries.refetch - Data updated successfully');
    } catch (err) {
      console.error('❌ useServiceEnquiries.refetch - Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch enquiries');
    }
  };

  return { enquiries, loading, error, refetch };
};

// Custom hook for service stats with polling
export const useServiceStats = (pollingInterval: number = 200000) => {
  const [stats, setStats] = useState<ServiceStats>({
    pendingCount: 0,
    inProgressCount: 0,
    doneCount: 0,
    totalServices: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const fetchStats = async () => {
      try {
        setError(null);
        const data = await serviceApiService.getServiceStats();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch stats');
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchStats();

    // Set up polling
    if (pollingInterval > 0) {
      intervalId = setInterval(fetchStats, pollingInterval);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [pollingInterval]);

  return { stats, loading, error };
};