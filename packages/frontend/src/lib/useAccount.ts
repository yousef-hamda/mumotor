import { useQuery } from '@tanstack/react-query';
import { authApi } from './api';
import { tokenStore } from './api';

/**
 * The signed-in teacher's free-trial / paywall state. Drives the dashboard trial
 * banner + lock screen and the "add another website" upsell. Cached briefly so it
 * refreshes after a subscribe without hammering the API.
 */
export function useAccount() {
  return useQuery({
    queryKey: ['account'],
    queryFn: authApi.account,
    enabled: Boolean(tokenStore.get()),
    staleTime: 30_000,
  });
}
