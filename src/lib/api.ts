import Cookies from 'js-cookie';

export const apiFetch = async (url: string, options: RequestInit = {}) => {
  // On récupère le token dans le cookie 'token'
 const token = typeof window !== "undefined" ? Cookies.get('token') : null;

  const defaultHeaders = {
    //"Content-Type": "application/json",
    'Accept': 'application/json',
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    
  };

  const response = await fetch(`http://resto-api.test/api${url}`, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers, // Permet d'écraser les headers si besoin
    },
  });

  // Gestion automatique de l'expiration 
  if (response.status === 401) {
    Cookies.remove('token');
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }

  return response;
};

