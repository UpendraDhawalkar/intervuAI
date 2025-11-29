'use client';

import { useClerk } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';

export default function SignOutButton() {
  const { signOut } = useClerk();

  const handleSignOut = async () => {
    await signOut();
    // Force hard redirect to /sign-in
    window.location.href = '/sign-in';
  };

  return (
    <Button variant="ghost" onClick={handleSignOut}>
      Sign out
    </Button>
  );
}