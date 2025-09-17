
export enum Role {
  ADMIN = 'admin',
  EMPLOYEE = 'employee',
  HR = 'hr',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string;
  status: 'Active' | 'Inactive';
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  totalHours: number | null;
}
