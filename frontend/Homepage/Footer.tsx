import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-800 text-slate-300 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-sm">
          &copy; {new Date().getFullYear()} QuizSpark. All rights reserved.
        </p>
        <p className="text-xs mt-1">
          Crafted with <span role="img" aria-label="heart"></span> for better learning.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
