import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <h1 className="text-9xl font-extrabold text-gray-200 tracking-widest">404</h1>
        <div className="bg-blue-600 text-white px-2 text-sm rounded rotate-12 absolute -mt-16 ml-14">
          Page Not Found
        </div>
        <div className="mt-8">
          <p className="text-xl text-gray-600 mb-6">Sorry, the page you are looking for doesn't exist.</p>
          <Link
            to="/"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
          >
            Go back home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
