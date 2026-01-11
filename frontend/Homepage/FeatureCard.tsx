import React from 'react';

interface FeatureCardProps {
  icon: React.ReactElement<React.SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => {
  return (
    <div className="bg-white p-3 sm:p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col items-center text-center h-full">
      <div className="flex-shrink-0 mb-2 sm:mb-4 p-2 sm:p-3 bg-sky-100 text-sky-600 rounded-full">
        {React.cloneElement(icon, { className: "w-6 h-6 sm:w-8 sm:h-8" })}
      </div>
      <h3 className="text-base sm:text-xl font-semibold text-slate-800 mb-1 sm:mb-2">{title}</h3>
      <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">{description}</p>
    </div>
  );
};

export default FeatureCard;