
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User, AttendanceRecord, Role } from '../types';
import { MOCK_USERS, MOCK_ATTENDANCE, MOCK_WEBAUTHN_REGISTRATIONS } from '../data/mockData';

// --- In-memory Mock Data Store ---
// Deep copy to prevent mutations from affecting the original mock data during hot reloads
let usersStore: User[] = JSON.parse(JSON.stringify(MOCK_USERS));
let attendanceStore: AttendanceRecord[] = JSON.parse(JSON.stringify(MOCK_ATTENDANCE));
let webAuthnStore: { userId: string, credentialId: string }[] = JSON.parse(JSON.stringify(MOCK_WEBAUTHN_REGISTRATIONS));
let nextUserId = usersStore.length + 1;
let nextAttendanceId = attendanceStore.length + 1;

// This will be set on login/logout to give context to the mock API
let currentMockUser: User | null = null;
const setMockUser = (user: User | null) => {
    currentMockUser = user;
};


// --- Mock API Simulator ---
export const apiRequest = async <T,>(endpoint: string, options: Omit<RequestInit, 'body'> & { body?: any } = {}): Promise<T> => {
    console.log(`%c[Mock API]%c ${options.method || 'GET'} ${endpoint}`, 'color: #7c3aed; font-weight: bold;', 'color: default;', options.body || '');
    
    // Simulate network delay
    await new Promise(res => setTimeout(res, Math.random() * 400 + 100));

    const url = new URL(`https://mockapi.com${endpoint}`);
    const params = url.searchParams;

    // --- AUTH ---
    if (endpoint === '/auth/login') {
        const { email, password } = options.body;
        const user = usersStore.find(u => u.email === email);
        if (user && password && user.status === 'Active') { // Simplified password check: any password works
            return { token: `mock-token-for-${user.id}`, user } as T;
        }
        throw new Error('Invalid credentials');
    }
    
    if (endpoint === '/auth/change-password') {
        return null as T; // Simulate success
    }
    
    // --- WEBAUTHN SIMULATION ---
    if (endpoint.startsWith('/webauthn/register/begin')) {
         return { publicKey: { challenge: 'mockChallenge', user: { id: currentMockUser?.id || 'mockUserId' } } } as T;
    }
    if (endpoint === '/webauthn/register/finish') {
        const userId = options.body.rawId; // simple mock
        if (userId && !webAuthnStore.find(r => r.userId === userId)) {
            webAuthnStore.push({ userId, credentialId: `cred-${Date.now()}` });
        }
        return { verified: true } as T;
    }
     if (endpoint.startsWith('/webauthn/login/begin')) {
        return { publicKey: { challenge: 'mockChallenge', allowCredentials: [{id: 'mockCredId'}] } } as T;
    }
    if (endpoint === '/webauthn/registration-status') {
        const isRegistered = currentMockUser ? webAuthnStore.some(r => r.userId === currentMockUser.id) : false;
        return { isRegistered } as T;
    }

    // --- ATTENDANCE ---
    if (endpoint.startsWith('/attendance/history')) {
        const userId = params.get('user_id');
        return attendanceStore.filter(r => r.userId === userId) as T;
    }
    if (endpoint === '/attendance/clock-in') {
        if (!currentMockUser) throw new Error("Not logged in");
        const { id: userId, name: userName } = currentMockUser;
        const todayStr = new Date().toISOString().split('T')[0];
        const existing = attendanceStore.find(r => r.userId === userId && r.date === todayStr);
        if (existing) throw new Error('You have already clocked in today.');
        
        const newRecord: AttendanceRecord = {
            id: `a-sim-${nextAttendanceId++}`,
            userId: userId,
            userName: userName,
            date: todayStr,
            clockIn: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit'}),
            clockOut: null,
            totalHours: null,
            isLate: new Date().getHours() >= 9,
        };
        attendanceStore.unshift(newRecord);
        return { message: 'Clock-in successful' } as T;
    }
     if (endpoint === '/attendance/clock-out') {
        if (!currentMockUser) throw new Error("Not logged in");
        const userId = currentMockUser.id;
        const todayStr = new Date().toISOString().split('T')[0];
        const record = attendanceStore.find(r => r.userId === userId && r.date === todayStr);
        if (!record) throw new Error("You haven't clocked in today.");
        if (record.clockOut) throw new Error("You have already clocked out today.");
        
        record.clockOut = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit'});
        const clockInDate = new Date(`${record.date}T${record.clockIn}`);
        const clockOutDate = new Date(`${record.date}T${record.clockOut}`);
        record.totalHours = (clockOutDate.getTime() - clockInDate.getTime()) / (1000 * 60 * 60);
        
        return { message: 'Clock-out successful' } as T;
    }

    // --- ADMIN / HR ---
    if (endpoint === '/admin/employees') {
        if (options.method === 'POST') {
            const newUser: User = { ...options.body, id: `u-sim-${nextUserId++}`, status: 'Active' };
            usersStore.push(newUser);
            return newUser as T;
        }
        return usersStore as T;
    }
    if (endpoint.startsWith('/admin/employees/')) {
        const id = endpoint.split('/').pop()!;
        if (options.method === 'PUT') {
            const updatedUser = options.body;
            usersStore = usersStore.map(u => u.id === id ? { ...u, ...updatedUser } : u);
            return updatedUser as T;
        }
        if (options.method === 'DELETE') {
            const user = usersStore.find(u => u.id === id);
            if (user) user.status = 'Inactive';
            return {} as T;
        }
    }
    if (endpoint.startsWith('/admin/attendance-logs')) {
         let logs = [...attendanceStore];
         if (params.get('date')) {
            logs = logs.filter(l => l.date === params.get('date'));
         }
         if (params.get('search')) {
             const search = params.get('search')!.toLowerCase();
             logs = logs.filter(l => l.userName.toLowerCase().includes(search));
         }
         return logs as T;
    }
    
    // --- REPORTS ---
    if (endpoint === '/reports/absenteeism-trends') {
        return [
          { name: "Mon", Present: 140, Absent: 10 },
          { name: "Tue", Present: 145, Absent: 5 },
          { name: "Wed", Present: 142, Absent: 8 },
          { name: "Thu", Present: 148, Absent: 2 },
          { name: "Fri", Present: 135, Absent: 15 },
        ] as T;
    }
    if (endpoint === '/reports/working-hours') {
        return [
          { name: "Mon", avgHours: 7.8 },
          { name: "Tue", avgHours: 8.1 },
          { name: "Wed", avgHours: 7.9 },
          { name: "Thu", avgHours: 8.2 },
          { name: "Fri", avgHours: 7.5 },
        ] as T;
    }

    throw new Error(`Mock API endpoint not found: ${endpoint}`);
};
// --- End Mock API Simulator ---


interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('authUser');
      if (storedToken && storedUser) {
        const userObj = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(userObj);
        setMockUser(userObj); // Set mock user on initial load
      }
    } catch (error) {
      console.error("Failed to parse auth data from localStorage", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
        const response = await apiRequest<{token: string, user: User}>('/auth/login', {
            method: 'POST',
            body: { email, password }
        });

        if (response.token && response.user) {
            setUser(response.user);
            setToken(response.token);
            setMockUser(response.user); // Set mock user on login
            localStorage.setItem('authToken', response.token);
            localStorage.setItem('authUser', JSON.stringify(response.user));
            return true;
        }
        return false;
    } catch (error) {
        console.error("Login failed:", error);
        return false;
    } finally {
        setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setMockUser(null); // Clear mock user on logout
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
