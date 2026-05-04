import { useAuth } from '@/hooks/useAuth';

interface CanProps {
  do: string;
  children: React.ReactNode;
}

export const Can = ({ do: permission, children }: CanProps) => {
  const { hasPermission } = useAuth();

  if (!hasPermission(permission)) {
    return null; // On n'affiche rien si la permission manque
  }

  return <>{children}</>;
};