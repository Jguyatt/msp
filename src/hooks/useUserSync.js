import { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { userService } from '../services/supabaseService';

export function useUserSync() {
  const { user: clerkUser, isLoaded } = useUser();
  const [supabaseUser, setSupabaseUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const syncUser = async () => {
      if (!isLoaded || !clerkUser) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Sync Clerk user with Supabase
        const syncedUser = await userService.syncClerkUser(clerkUser);
        setSupabaseUser(syncedUser);

        console.log('User synced successfully:', syncedUser);
      } catch (err) {
        console.error('Error syncing user:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    syncUser();
  }, [clerkUser, isLoaded]);

  return {
    clerkUser,
    supabaseUser,
    loading,
    error,
    isLoaded
  };
}
