import { useEffect, useReducer, useCallback, useMemo } from 'react';
import axios, { endpoints } from 'src/utils/axios';
import { AuthContext } from './auth-context';
import { isValidToken, setSession } from './utils';
import { ActionMapType, AuthStateType, AuthUserType } from '../../types';

// ----------------------------------------------------------------------

enum Types {
  INITIAL = 'INITIAL',
  LOGIN = 'LOGIN',
  REGISTER = 'REGISTER',
  LOGOUT = 'LOGOUT',
}

type Payload = {
  [Types.INITIAL]: { user: AuthUserType | null };
  [Types.LOGIN]: { user: AuthUserType };
  [Types.REGISTER]: { user: AuthUserType };
  [Types.LOGOUT]: undefined;
};

type ActionsType = ActionMapType<Payload>[keyof ActionMapType<Payload>];

const initialState: AuthStateType = {
  user: null,
  loading: true,
};

function reducer(state: AuthStateType, action: ActionsType) {
  switch (action.type) {
    case Types.INITIAL:
      return { loading: false, user: action.payload.user };
    case Types.LOGIN:
    case Types.REGISTER:
      return { ...state, user: action.payload.user };
    case Types.LOGOUT:
      return { ...state, user: null };
    default:
      return state;
  }
}

const STORAGE_KEY = 'accessToken';

type Props = { children: React.ReactNode };

export function AuthProvider({ children }: Props) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const fetchMe = useCallback(async (accessToken: string) => {
    // vẫn set global để các request sau dùng
    setSession(accessToken);
    sessionStorage.setItem(STORAGE_KEY, accessToken);

    const res = await axios.get(endpoints.auth.me, {
      headers: { Authorization: `Bearer ${accessToken}` }, // ÉP token ở đây
    });

    return res.data?.data;
  }, []);

  const tryRefresh = useCallback(async () => {
    const res = await axios.post(endpoints.auth.refresh, null, { withCredentials: true });

    const newToken = res.data?.token as string | undefined;
    if (!newToken) throw new Error('Refresh did not return token');

    setSession(newToken);
    sessionStorage.setItem(STORAGE_KEY, newToken);

    return newToken;
  }, []);

  const initialize = useCallback(async () => {
    try {
      const storedToken = sessionStorage.getItem(STORAGE_KEY);

      if (storedToken && isValidToken(storedToken)) {
        const me = await fetchMe(storedToken);
        dispatch({ type: Types.INITIAL, payload: { user: { ...me, accessToken: storedToken } } });
        return;
      }

      // token hết hạn -> refresh
      const newToken = await tryRefresh();
      const me = await fetchMe(newToken);

      dispatch({ type: Types.INITIAL, payload: { user: { ...me, accessToken: newToken } } });
    } catch (error) {
      console.error(error);
      setSession(null);
      sessionStorage.removeItem(STORAGE_KEY);
      dispatch({ type: Types.INITIAL, payload: { user: null } });
    }
  }, [fetchMe, tryRefresh]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // LOGIN
  const login = useCallback(async (username: string, password: string) => {
    const res = await axios.post(
      endpoints.auth.login,
      { username, password },
      { withCredentials: true }
    );

    // backend: { ok: true, token, user }
    const token = res.data?.token;
    const user = res.data?.user;

    if (!token || !user) {
      throw new Error('Invalid login response (expected { token, user })');
    }

    setSession(token);
    sessionStorage.setItem(STORAGE_KEY, token);

    dispatch({
      type: Types.LOGIN,
      payload: {
        user: {
          ...user,
          accessToken: token,
        },
      },
    });
  }, []);

  // REGISTER (nếu backend bạn chưa support thì để nguyên/hoặc bỏ)
  const register = useCallback(
    async (email: string, password: string, firstName: string, lastName: string) => {
      const res = await axios.post(endpoints.auth.register, {
        email,
        password,
        firstName,
        lastName,
      });

      const accessToken = res.data?.accessToken;
      const user = res.data?.user;

      if (!accessToken || !user) throw new Error('Invalid register response');

      setSession(accessToken);
      sessionStorage.setItem(STORAGE_KEY, accessToken);

      dispatch({
        type: Types.REGISTER,
        payload: { user: { ...user, accessToken } },
      });
    },
    []
  );

  // LOGOUT
  const logout = useCallback(async () => {
    try {
      // nếu bạn có endpoint logout => revoke refresh token + clear cookie
      await axios.post(endpoints.auth.logout, null, { withCredentials: true });
    } catch (e) {
      // ignore
    }

    setSession(null);
    sessionStorage.removeItem(STORAGE_KEY);

    dispatch({ type: Types.LOGOUT });
  }, []);

  // ----------------------------------------------------------------------

  const checkAuthenticated = state.user ? 'authenticated' : 'unauthenticated';
  const status = state.loading ? 'loading' : checkAuthenticated;

  const memoizedValue = useMemo(
    () => ({
      user: state.user,
      method: 'jwt',
      loading: status === 'loading',
      authenticated: status === 'authenticated',
      unauthenticated: status === 'unauthenticated',
      login,
      register,
      logout,
    }),
    [login, logout, register, state.user, status]
  );

  return <AuthContext.Provider value={memoizedValue}>{children}</AuthContext.Provider>;
}
