export interface MobileCustomerDto {
  id: string;
  name: string;
  email: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string;
  phone: string | null;
  isVip: boolean | null;
  tags: string[] | null;
  createdAt: string;
  updatedAt: string;
}

export function customersApiEnabled(): boolean {
  return process.env.EXPO_PUBLIC_CUSTOMERS_API !== 'false';
}

function apiBase(): string {
  return (process.env.EXPO_PUBLIC_API_URL ?? 'http://127.0.0.1:3001').replace(/\/$/, '');
}

async function parseError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: { message?: string } };
    return body.error?.message ?? response.statusText;
  } catch {
    return response.statusText;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBase()}${path}`, {
    credentials: 'include',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  if (response.status === 204) {
    return undefined as T;
  }
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return (await response.json()) as T;
}

export const customersApi = {
  async list(): Promise<MobileCustomerDto[]> {
    const body = await request<{ customers: MobileCustomerDto[] }>('/api/customers');
    return body.customers;
  },

  async get(id: string): Promise<MobileCustomerDto> {
    return request<MobileCustomerDto>(`/api/customers/${id}`);
  },

  async create(input: Record<string, unknown>): Promise<MobileCustomerDto> {
    return request<MobileCustomerDto>('/api/customers', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async update(id: string, input: Record<string, unknown>): Promise<MobileCustomerDto> {
    return request<MobileCustomerDto>(`/api/customers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },

  async remove(id: string): Promise<void> {
    await request<void>(`/api/customers/${id}`, { method: 'DELETE' });
  },
};
