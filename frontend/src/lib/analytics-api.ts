import { apiClient } from './api-client';
import {
  InstitutionAnalyticsOverview,
  PlatformAnalyticsOverview,
} from '../types/analytics';

export interface AnalyticsFilterParams {
  department?: string;
  graduationYear?: number;
  degree?: string;
}

export const analyticsApi = {
  /**
   * Institution Admin: Get comprehensive institutional & placement analytics
   */
  async getInstitutionOverview(
    params?: AnalyticsFilterParams,
  ): Promise<InstitutionAnalyticsOverview> {
    const query = new URLSearchParams();
    if (params?.department) query.set('department', params.department);
    if (params?.graduationYear) query.set('graduationYear', String(params.graduationYear));
    if (params?.degree) query.set('degree', params.degree);

    const qs = query.toString();
    return apiClient.get<InstitutionAnalyticsOverview>(
      `/analytics/institution/overview${qs ? `?${qs}` : ''}`,
    );
  },

  /**
   * Super Admin: Get platform-wide overview
   */
  async getPlatformOverview(): Promise<PlatformAnalyticsOverview> {
    return apiClient.get<PlatformAnalyticsOverview>('/analytics/platform/overview');
  },
};
