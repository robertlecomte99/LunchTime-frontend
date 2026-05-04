import Cookies from 'js-cookie';

export const useAuth = () => {
  
  const getPermissions = (): string[] => {
    const perms = Cookies.get('permissions');
    return perms ? JSON.parse(perms) : [];
  };

  const hasPermission = (permission: string) => {
    return getPermissions().includes(permission);
  };

  const hasAnyPermission = (permissions: string[]) => {
    const userPerms = getPermissions();
    return permissions.some(p => userPerms.includes(p));
  };

  return { hasPermission, hasAnyPermission };
};