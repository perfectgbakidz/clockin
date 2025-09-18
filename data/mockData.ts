
import { User, Role, AttendanceRecord } from '../types';

export const MOCK_USERS: User[] = [
  { id: '1', name: 'Alice Admin', email: 'admin@pardee.com', role: Role.ADMIN, department: 'Management', status: 'Active' },
  { id: '2', name: 'Bob Employee', email: 'employee@pardee.com', role: Role.EMPLOYEE, department: 'Engineering', status: 'Active' },
  { id: '3', name: 'Charlie HR', email: 'hr@pardee.com', role: Role.HR, department: 'Human Resources', status: 'Active' },
  { id: '4', name: 'David Developer', email: 'dev@pardee.com', role: Role.EMPLOYEE, department: 'Engineering', status: 'Active' },
  { id: '5', name: 'Eve Engineer', email: 'eng@pardee.com', role: Role.EMPLOYEE, department: 'Engineering', status: 'Inactive' },
  { id: '6', name: 'Frank Finance', email: 'finance@pardee.com', role: Role.EMPLOYEE, department: 'Finance', status: 'Active' },
];

const today = new Date();
const yesterday = new Date(new Date().setDate(today.getDate() - 1));
const dayBefore = new Date(new Date().setDate(today.getDate() - 2));
const threeDaysAgo = new Date(new Date().setDate(today.getDate() - 3));

const formatDate = (d: Date) => d.toISOString().split('T')[0];

export const MOCK_ATTENDANCE: AttendanceRecord[] = [
  // Bob Employee (ID 2)
  { id: 'a1', userId: '2', userName: 'Bob Employee', date: formatDate(yesterday), clockIn: '08:55:12', clockOut: '17:05:30', totalHours: 8.17, isLate: false },
  { id: 'a2', userId: '2', userName: 'Bob Employee', date: formatDate(dayBefore), clockIn: '09:15:05', clockOut: '17:30:15', totalHours: 8.25, isLate: true },
  { id: 'a3', userId: '2', userName: 'Bob Employee', date: formatDate(threeDaysAgo), clockIn: '08:59:00', clockOut: '17:01:00', totalHours: 8.03, isLate: false },
  
  // David Developer (ID 4)
  { id: 'a4', userId: '4', userName: 'David Developer', date: formatDate(today), clockIn: '08:58:11', clockOut: null, totalHours: null, isLate: false },
  { id: 'a5', userId: '4', userName: 'David Developer', date: formatDate(yesterday), clockIn: '09:01:45', clockOut: '17:00:50', totalHours: 7.98, isLate: true },
  { id: 'a6', userId: '4', userName: 'David Developer', date: formatDate(dayBefore), clockIn: '08:45:20', clockOut: '16:45:30', totalHours: 8.00, isLate: false },
  
  // Frank Finance (ID 6)
  { id: 'a7', userId: '6', userName: 'Frank Finance', date: formatDate(yesterday), clockIn: '08:30:00', clockOut: '17:30:00', totalHours: 9.00, isLate: false },
  { id: 'a8', userId: '6', userName: 'Frank Finance', date: formatDate(dayBefore), clockIn: '08:25:00', clockOut: '17:35:00', totalHours: 9.17, isLate: false },
];

export const MOCK_WEBAUTHN_REGISTRATIONS: { userId: string, credentialId: string }[] = [
    { userId: '2', credentialId: 'bob-device-1' }
];
