
import React, { useState, useMemo } from 'react';
import { MOCK_USERS } from '../../data/mockData';
import { User, Role } from '../../types';
import { Edit, Trash2, PlusCircle, Search } from 'lucide-react';

const EmployeeManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const filteredUsers = useMemo(() =>
    users.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.department.toLowerCase().includes(searchTerm.toLowerCase())
    ), [users, searchTerm]);

  const handleAddUser = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleDeleteUser = (userId: string) => {
    if(window.confirm('Are you sure you want to deactivate this employee?')) {
        setUsers(users.map(u => u.id === userId ? {...u, status: 'Inactive'} : u));
    }
  };

  const handleSaveUser = (user: User) => {
    if (editingUser) {
        setUsers(users.map(u => u.id === user.id ? user : u));
    } else {
        setUsers([...users, { ...user, id: String(users.length + 1) }]);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Employee Management</h1>
        <div className="flex items-center space-x-2 mt-4 md:mt-0">
          <div className="relative">
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          </div>
          <button
            onClick={handleAddUser}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <PlusCircle size={16} className="mr-2" /> Add Employee
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th scope="col" className="px-6 py-3">Name</th>
              <th scope="col" className="px-6 py-3">Department</th>
              <th scope="col" className="px-6 py-3">Role</th>
              <th scope="col" className="px-6 py-3">Status</th>
              <th scope="col" className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{user.name} ({user.email})</td>
                <td className="px-6 py-4">{user.department}</td>
                <td className="px-6 py-4 capitalize">{user.role}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4 flex space-x-2">
                  <button onClick={() => handleEditUser(user)} className="text-blue-500 hover:text-blue-700"><Edit size={18} /></button>
                  <button onClick={() => handleDeleteUser(user.id)} className="text-red-500 hover:text-red-700"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {isModalOpen && <EmployeeModal user={editingUser} onSave={handleSaveUser} onClose={() => setIsModalOpen(false)} />}
    </div>
  );
};


// Note: Defining component inside another component is an anti-pattern,
// but for this single-file generation, it's a simplification.
// In a real project, this would be in its own file `components/EmployeeModal.tsx`.
interface EmployeeModalProps {
  user: User | null;
  onSave: (user: User) => void;
  onClose: () => void;
}

const EmployeeModal: React.FC<EmployeeModalProps> = ({ user, onSave, onClose }) => {
    const [formData, setFormData] = useState<User>(user || { id: '', name: '', email: '', department: '', role: Role.EMPLOYEE, status: 'Active' });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-lg">
                <h2 className="text-xl font-bold mb-4">{user ? 'Edit' : 'Add'} Employee</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Name" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" required />
                    <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" required />
                    <input type="text" name="department" value={formData.department} onChange={handleChange} placeholder="Department" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" required />
                    <select name="role" value={formData.role} onChange={handleChange} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
                        <option value={Role.EMPLOYEE}>Employee</option>
                        <option value={Role.ADMIN}>Admin</option>
                        <option value={Role.HR}>HR</option>
                    </select>
                    <div className="flex justify-end space-x-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


export default EmployeeManagementPage;
