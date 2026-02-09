import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { logout, refreshTokenSuccess } from '../slices/authSlice'

const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5000/api',
  timeout: 10000, // 10 second timeout
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token
    if (token) {
      headers.set('authorization', `Bearer ${token}`)
    }
    return headers
  },
})

const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions)

  // Handle rate limit errors
  if (result?.error?.status === 429) {
    console.warn('Rate limit exceeded. Please wait before trying again.')
    return result
  }

  if (result?.error?.status === 401) {
    // Try to refresh the token
    const refreshToken = api.getState().auth.refreshToken
    if (refreshToken) {
      const refreshResult = await baseQuery(
        {
          url: '/auth/refresh',
          method: 'POST',
          body: { refreshToken },
        },
        api,
        extraOptions
      )

      if (refreshResult?.data) {
        // Store the new tokens
        api.dispatch(refreshTokenSuccess(refreshResult.data.data))
        // Retry the original query
        result = await baseQuery(args, api, extraOptions)
      } else {
        // Refresh failed, logout user with full cleanup
        api.dispatch(apiSlice.util.resetApiState())
        api.dispatch(logout())
      }
    } else {
      // No refresh token, logout user with full cleanup
      api.dispatch(apiSlice.util.resetApiState())
      api.dispatch(logout())
    }
  }

  return result
}

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User', 'Client', 'Bill', 'OCRJob', 'Dashboard', 'Item', 'Salary', 'Expense'],
  endpoints: (builder) => ({
    // Auth endpoints
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    register: builder.mutation({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: userData,
      }),
    }),
    getProfile: builder.query({
      query: () => '/auth/profile',
      providesTags: ['User'],
    }),
    updateProfile: builder.mutation({
      query: (userData) => ({
        url: '/auth/profile',
        method: 'PUT',
        body: userData,
      }),
      invalidatesTags: ['User'],
    }),
    changePassword: builder.mutation({
      query: (passwordData) => ({
        url: '/auth/profile/password',
        method: 'PUT',
        body: passwordData,
      }),
    }),

    // Client endpoints
    getClients: builder.query({
      query: ({ page = 1, limit = 10, search = '' } = {}) => 
        `/clients?page=${page}&limit=${limit}&search=${search}`,
      providesTags: ['Client'],
    }),
    getClient: builder.query({
      query: (id) => `/clients/${id}`,
      providesTags: (result, error, id) => [{ type: 'Client', id }],
    }),
    createClient: builder.mutation({
      query: (clientData) => ({
        url: '/clients',
        method: 'POST',
        body: clientData,
      }),
      invalidatesTags: ['Client'],
    }),
    updateClient: builder.mutation({
      query: ({ id, ...clientData }) => ({
        url: `/clients/${id}`,
        method: 'PUT',
        body: clientData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Client', id }, 'Client'],
    }),
    deleteClient: builder.mutation({
      query: (id) => ({
        url: `/clients/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Client'],
    }),
    uploadClientDocuments: builder.mutation({
      query: ({ id, formData }) => ({
        url: `/clients/${id}/documents`,
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Client', id }],
    }),

    // Bill endpoints
    getBills: builder.query({
      query: ({ page = 1, limit = 10, status = '', clientId = '', search = '' } = {}) => 
        `/bills?page=${page}&limit=${limit}&status=${status}&clientId=${clientId}&search=${search}`,
      providesTags: ['Bill'],
    }),
    getBill: builder.query({
      query: (id) => `/bills/${id}`,
      providesTags: (result, error, id) => [{ type: 'Bill', id }],
      // Force fresh data for edit mode
      keepUnusedDataFor: 0,
      refetchOnMountOrArgChange: true,
    }),
    createBill: builder.mutation({
      query: (billData) => ({
        url: '/bills',
        method: 'POST',
        body: billData,
      }),
      invalidatesTags: ['Bill', 'Dashboard'],
    }),
    updateBill: builder.mutation({
      query: ({ id, ...billData }) => ({
        url: `/bills/${id}`,
        method: 'PUT',
        body: billData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Bill', id }, 'Bill', 'Dashboard'],
    }),
    deleteBill: builder.mutation({
      query: (id) => ({
        url: `/bills/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Bill', 'Dashboard'],
    }),
    addPayment: builder.mutation({
      query: ({ billId, paymentData }) => ({
        url: `/bills/${billId}/payments`,
        method: 'POST',
        body: paymentData,
      }),
      invalidatesTags: (result, error, { billId }) => [{ type: 'Bill', id: billId }, 'Bill', 'Dashboard'],
    }),
    deletePayment: builder.mutation({
      query: ({ billId, paymentId }) => ({
        url: `/bills/${billId}/payments/${paymentId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { billId }) => [{ type: 'Bill', id: billId }, 'Bill', 'Dashboard', { type: 'Payment', id: billId }],
    }),
    getPaymentHistory: builder.query({
      query: (billId) => `/bills/${billId}/payments`,
      providesTags: (result, error, billId) => [{ type: 'Payment', id: billId }],
    }),

    // Item endpoints
    getItems: builder.query({
      query: () => '/items',
      providesTags: ['Item'],
    }),
    getActiveItems: builder.query({
      query: () => '/items/active',
      providesTags: ['Item'],
    }),
    createItem: builder.mutation({
      query: (itemData) => ({
        url: '/items',
        method: 'POST',
        body: itemData,
      }),
      invalidatesTags: ['Item'],
    }),
    updateItem: builder.mutation({
      query: ({ id, ...itemData }) => ({
        url: `/items/${id}`,
        method: 'PUT',
        body: itemData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Item', id }, 'Item'],
    }),
    deleteItem: builder.mutation({
      query: (id) => ({
        url: `/items/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Item'],
    }),

    // OCR endpoints
    processAadhaar: builder.mutation({
      query: (formData) => ({
        url: '/ocr/aadhaar',
        method: 'POST',
        body: formData,
      }),
    }),
    processPAN: builder.mutation({
      query: (formData) => ({
        url: '/ocr/pan',
        method: 'POST',
        body: formData,
      }),
    }),
    getOCRStatus: builder.query({
      query: (jobId) => `/ocr/status/${jobId}`,
      providesTags: (result, error, jobId) => [{ type: 'OCRJob', id: jobId }],
    }),

    // Admin endpoints
    getDashboard: builder.query({
      query: () => '/admin/dashboard',
      providesTags: ['Dashboard'],
    }),
    testUsers: builder.query({
      query: () => '/admin/test-users',
    }),
    getUsers: builder.query({
      query: ({ page = 1, limit = 10, role = '', isActive = '', search = '' } = {}) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });
        
        if (role) {
          params.append('role', role);
        }
        
        if (isActive) {
          params.append('isActive', isActive);
        }

        if (search) {
          params.append('search', search);
        }
        
        return `/admin/users?${params.toString()}`;
      },
      providesTags: ['User'],
    }),
    updateUserRole: builder.mutation({
      query: ({ id, role }) => ({
        url: `/admin/users/${id}/role`,
        method: 'PUT',
        body: { role },
      }),
      invalidatesTags: ['User'],
    }),
    updateUserStatus: builder.mutation({
      query: ({ id, isActive }) => ({
        url: `/admin/users/${id}/status`,
        method: 'PUT',
        body: { isActive },
      }),
      invalidatesTags: ['User'],
    }),
    createUser: builder.mutation({
      query: (userData) => ({
        url: '/admin/users',
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: ['User'],
    }),
    updateUser: builder.mutation({
      query: ({ id, ...userData }) => ({
        url: `/admin/users/${id}`,
        method: 'PUT',
        body: userData,
      }),
      invalidatesTags: ['User'],
    }),
    checkEmailAvailability: builder.query({
      query: ({ email, userId }) => 
        `/admin/users/check-email/${encodeURIComponent(email)}${userId ? `?userId=${userId}` : ''}`,
    }),
    checkPhoneAvailability: builder.query({
      query: ({ phone, userId }) => 
        `/admin/users/check-phone/${encodeURIComponent(phone)}${userId ? `?userId=${userId}` : ''}`,
    }),
    getAdminClients: builder.query({
      query: ({ page = 1, limit = 10, userId = '' } = {}) => 
        `/admin/clients?page=${page}&limit=${limit}&userId=${userId}`,
      providesTags: ['Client'],
    }),
    getReports: builder.query({
      query: ({ startDate = '', endDate = '', userId = '' } = {}) => 
        `/admin/reports?startDate=${startDate}&endDate=${endDate}&userId=${userId}`,
      providesTags: ['Dashboard'],
    }),

    // Salary endpoints
    getSalaries: builder.query({
      query: ({ page = 1, limit = 10, userId = '', status = '', month = '', year = '' } = {}) => 
        `/salaries?page=${page}&limit=${limit}&userId=${userId}&status=${status}&month=${month}&year=${year}`,
      providesTags: ['Salary'],
    }),
    getMySalary: builder.query({
      query: () => '/salaries/my-salary',
      providesTags: ['Salary'],
    }),
    getMySalaryHistory: builder.query({
      query: ({ page = 1, limit = 10, status = '' } = {}) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });
        
        if (status) {
          params.append('status', status);
        }
        
        return `/salaries/my-salary-history?${params.toString()}`;
      },
      providesTags: ['Salary'],
    }),
    getSalary: builder.query({
      query: (id) => `/salaries/${id}`,
      providesTags: (result, error, id) => [{ type: 'Salary', id }],
    }),
    createSalary: builder.mutation({
      query: (salaryData) => ({
        url: '/salaries',
        method: 'POST',
        body: salaryData,
      }),
      invalidatesTags: ['Salary'],
    }),
    updateSalary: builder.mutation({
      query: ({ id, ...salaryData }) => ({
        url: `/salaries/${id}`,
        method: 'PUT',
        body: salaryData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Salary', id }, 'Salary'],
    }),
    deleteSalary: builder.mutation({
      query: (id) => ({
        url: `/salaries/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Salary'],
    }),
    getSalaryHistory: builder.query({
      query: ({ userId, page = 1, limit = 10 } = {}) => 
        `/salaries/user/${userId}/history?page=${page}&limit=${limit}`,
      providesTags: ['Salary'],
    }),

    // Expense endpoints
    getExpenses: builder.query({
      query: ({ page = 1, limit = 10, userId = '', status = '', category = '', startDate = '', endDate = '' } = {}) => 
        `/expenses?page=${page}&limit=${limit}&userId=${userId}&status=${status}&category=${category}&startDate=${startDate}&endDate=${endDate}`,
      providesTags: ['Expense'],
    }),
    getExpense: builder.query({
      query: (id) => `/expenses/${id}`,
      providesTags: (result, error, id) => [{ type: 'Expense', id }],
    }),
    createExpense: builder.mutation({
      query: (expenseData) => {
        const formData = new FormData()
        Object.keys(expenseData).forEach(key => {
          if (expenseData[key] !== null && expenseData[key] !== undefined) {
            formData.append(key, expenseData[key])
          }
        })
        return {
          url: '/expenses',
          method: 'POST',
          body: formData,
        }
      },
      invalidatesTags: ['Expense'],
    }),
    updateExpense: builder.mutation({
      query: ({ id, ...expenseData }) => {
        const formData = new FormData()
        Object.keys(expenseData).forEach(key => {
          if (expenseData[key] !== null && expenseData[key] !== undefined) {
            formData.append(key, expenseData[key])
          }
        })
        return {
          url: `/expenses/${id}`,
          method: 'PUT',
          body: formData,
        }
      },
      invalidatesTags: (result, error, { id }) => [{ type: 'Expense', id }, 'Expense'],
    }),
    updateExpenseStatus: builder.mutation({
      query: ({ id, status, rejectionReason }) => ({
        url: `/expenses/${id}/status`,
        method: 'PATCH',
        body: { status, rejectionReason },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Expense', id }, 'Expense'],
    }),
    deleteExpense: builder.mutation({
      query: (id) => ({
        url: `/expenses/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Expense'],
    }),
    getExpenseStats: builder.query({
      query: ({ userId = '', startDate = '', endDate = '' } = {}) => 
        `/expenses/stats/summary?userId=${userId}&startDate=${startDate}&endDate=${endDate}`,
      providesTags: ['Expense'],
    }),

    // Company Settings endpoints
    getCompanySettings: builder.query({
      query: () => '/company-settings',
      providesTags: ['CompanySettings'],
    }),
    updateCompanySettings: builder.mutation({
      query: (settingsData) => {
        const formData = new FormData()
        Object.keys(settingsData).forEach(key => {
          if (settingsData[key] !== null && settingsData[key] !== undefined) {
            formData.append(key, settingsData[key])
          }
        })
        return {
          url: '/company-settings',
          method: 'PUT',
          body: formData,
        }
      },
      invalidatesTags: ['CompanySettings'],
    }),
  }),
})

export const {
  // Auth hooks
  useLoginMutation,
  useRegisterMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,

  // Client hooks
  useGetClientsQuery,
  useGetClientQuery,
  useCreateClientMutation,
  useUpdateClientMutation,
  useDeleteClientMutation,
  useUploadClientDocumentsMutation,

  // Bill hooks
  useGetBillsQuery,
  useGetBillQuery,
  useCreateBillMutation,
  useUpdateBillMutation,
  useDeleteBillMutation,
  useAddPaymentMutation,
  useDeletePaymentMutation,
  useGetPaymentHistoryQuery,

  // Item hooks
  useGetItemsQuery,
  useGetActiveItemsQuery,
  useCreateItemMutation,
  useUpdateItemMutation,
  useDeleteItemMutation,

  // OCR hooks
  useProcessAadhaarMutation,
  useProcessPANMutation,
  useGetOCRStatusQuery,

  // Admin hooks
  useGetDashboardQuery,
  useTestUsersQuery,
  useGetUsersQuery,
  useUpdateUserRoleMutation,
  useUpdateUserStatusMutation,
  useCreateUserMutation,
  useUpdateUserMutation,
  useCheckEmailAvailabilityQuery,
  useCheckPhoneAvailabilityQuery,
  useGetAdminClientsQuery,
  useGetReportsQuery,

  // Salary hooks
  useGetSalariesQuery,
  useGetMySalaryQuery,
  useGetMySalaryHistoryQuery,
  useGetSalaryQuery,
  useCreateSalaryMutation,
  useUpdateSalaryMutation,
  useDeleteSalaryMutation,
  useGetSalaryHistoryQuery,

  // Expense hooks
  useGetExpensesQuery,
  useGetExpenseQuery,
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
  useUpdateExpenseStatusMutation,
  useDeleteExpenseMutation,
  useGetExpenseStatsQuery,

  // Company Settings hooks
  useGetCompanySettingsQuery,
  useUpdateCompanySettingsMutation,
} = apiSlice