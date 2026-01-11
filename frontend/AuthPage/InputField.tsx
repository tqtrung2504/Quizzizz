import React from 'react';

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

const InputField: React.FC<InputFieldProps> = ({ icon, ...props }) => {
  return (
    <div className="relative w-full mb-4">
      {icon && (
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          {icon}
        </span>
      )}
      <input
        {...props}
        className={`w-full p-3 ${icon ? 'pl-10' : ''} bg-slate-100 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-500 text-sm`}
      />
    </div>
  );
};

export default InputField;
