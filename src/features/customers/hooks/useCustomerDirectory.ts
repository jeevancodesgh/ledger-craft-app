import { customersApiEnabled, toCreateCustomerRequest, toUpdateCustomerRequest } from '../api/customersApi';
import { useAppData } from '@/hooks/useAppData';
import { solidDataManager } from '@/services/DataManagerSOLID';
import type { Customer } from '@/types';
import {
  useCreateCustomerMutation,
  useCustomersQuery,
  useDeleteCustomerMutation,
  useUpdateCustomerMutation,
} from './useCustomers';

export function useCustomerDirectory() {
  const appData = useAppData();
  const query = useCustomersQuery();
  const createMutation = useCreateCustomerMutation();
  const updateMutation = useUpdateCustomerMutation();
  const deleteMutation = useDeleteCustomerMutation();

  if (!customersApiEnabled()) {
    return {
      customers: appData.customers,
      isLoadingCustomers: appData.isLoadingCustomers,
      refreshCustomers: appData.refreshCustomers,
      createCustomer: appData.createCustomer,
      updateCustomer: appData.updateCustomer,
      deleteCustomer: appData.deleteCustomer,
    };
  }

  return {
    customers: query.data ?? [],
    isLoadingCustomers: query.isLoading,
    refreshCustomers: async () => {
      await query.refetch();
      await solidDataManager.fetchCustomers();
    },
    createCustomer: async (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
      const created = await createMutation.mutateAsync(toCreateCustomerRequest(customer));
      await solidDataManager.fetchCustomers();
      return created;
    },
    updateCustomer: async (
      id: string,
      customer: Partial<Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>>,
    ) => {
      const updated = await updateMutation.mutateAsync({
        id,
        input: toUpdateCustomerRequest(customer),
      });
      await solidDataManager.fetchCustomers();
      return updated;
    },
    deleteCustomer: async (id: string) => {
      await deleteMutation.mutateAsync(id);
      await solidDataManager.fetchCustomers();
    },
  };
}
