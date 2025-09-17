
import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 dark:bg-gray-900 text-center">
      <h1 className="text-9xl font-extrabold text-indigo-600 tracking-widest">404</h1>
      <div className="bg-white dark:bg-gray-800 px-2 text-sm rounded rotate-12 absolute text-gray-800 dark:text-gray-200">
        Page Not Found
      </div>
      <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
        Sorry, the page you are looking for does not exist.
      </p>
      <Link to="/" className="mt-6 px-5 py-3 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
        Go Home
      </Link>
    </div>
  );
};

export default NotFoundPage;
