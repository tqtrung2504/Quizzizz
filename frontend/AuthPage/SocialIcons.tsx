import React from 'react';
import { GoogleIcon, GithubIcon } from './Icons';

interface SocialIconsProps {
  onGoogleSignIn?: () => void;
  onGithubSignIn?: () => void;
}

const SocialIcons: React.FC<SocialIconsProps> = ({ onGoogleSignIn, onGithubSignIn }) => {
  const iconClasses = "w-5 h-5";
  const linkClasses = "inline-flex items-center justify-center w-10 h-10 border border-gray-300 rounded-full hover:border-indigo-500 hover:bg-indigo-50 transition-all duration-300 mx-1.5 group";

  return (
    <div className="flex justify-center my-4">
      <button onClick={onGoogleSignIn} aria-label="Login with Google" className={linkClasses} type="button">
        <GoogleIcon className={`${iconClasses} text-gray-700 group-hover:scale-110 transition-transform duration-300`} />
      </button>
      <button onClick={onGithubSignIn} aria-label="Login with Github" className={linkClasses} type="button">
        <GithubIcon className={`${iconClasses} text-gray-700 group-hover:scale-110 transition-transform duration-300`} />
      </button>
    </div>
  );
};

export default SocialIcons;
