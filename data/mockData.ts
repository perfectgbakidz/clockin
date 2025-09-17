
import { User, Role, AttendanceRecord } from '../types';

export const MOCK_USERS: User[] = [
  { id: '1', name: 'John Doe', email: 'employee@example.com', role: Role.EMPLOYEE, department: 'Engineering', status: 'Active' },
  { id: '2', name: 'Jane Smith', email: 'admin@example.com', role: Role.ADMIN, department: 'Management', status: 'Active' },
  { id: '3', name: 'Peter Jones', email: 'hr@example.com', role: Role.HR, department: 'Human Resources', status: 'Active' },
  { id: '4', name: 'Mary Jane', email: 'employee2@example.com', role: Role.EMPLOYEE, department: 'Engineering', status: 'Active' },
  { id: '5', name: 'Chris Green', email: 'employee3@example.com', role: Role.EMPLOYEE, department: 'Marketing', status: 'Inactive' },
];

const generateRandomTime = (startHour: number, endHour: number): string => {
    const hour = Math.floor(Math.random() * (endHour - startHour + 1)) + startHour;
    const minute = Math.floor(Math.random() * 60);
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
};

export const MOCK_ATTENDANCE: AttendanceRecord[] = [
    ...Array.from({ length: 15 }).map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (i + 1));
        const clockIn = generateRandomTime(8, 9);
        const clockOut = generateRandomTime(17, 18);
        const [inH, inM] = clockIn.split(':').map(Number);
        const [outH, outM] = clockOut.split(':').map(Number);
        const totalHours = (outH + outM / 60) - (inH + inM / 60);

        return {
            id: `att_1_${i}`,
            userId: '1',
            userName: 'John Doe',
            date: date.toISOString().split('T')[0],
            clockIn,
            clockOut,
            totalHours: parseFloat(totalHours.toFixed(2)),
        };
    }),
    ...Array.from({ length: 5 }).map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (i + 1));
        return {
            id: `att_4_${i}`,
            userId: '4',
            userName: 'Mary Jane',
            date: date.toISOString().split('T')[0],
            clockIn: generateRandomTime(9, 10),
            clockOut: generateRandomTime(17, 18),
            totalHours: 8,
        };
    }),
    {
        id: 'att_today_1',
        userId: '1',
        userName: 'John Doe',
        date: new Date().toISOString().split('T')[0],
        clockIn: '08:55',
        clockOut: null,
        totalHours: null,
    }
];
