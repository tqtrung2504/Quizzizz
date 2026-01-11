import React from 'react';
export interface IconProps {
    className?: string;
    strokeWidth?: string | number;
    fill?: string;
  }
  
export interface SidebarItemInfo {
    id: string;
    label: string;
    icon: React.ElementType<IconProps>;
    action?: () => void;
  }

interface SidebarItemProps {
  item: SidebarItemInfo;
  isActive: boolean;
  isExpanded: boolean;
  onClick: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ item, isActive, isExpanded, onClick }) => {
  const IconComponent = item.icon;

  const baseClasses = "flex items-center rounded-lg my-0.5 md:my-1 transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-opacity-75";
  const expandedClasses = `w-full px-3 py-2.5 justify-start text-sm ${isActive ? 'bg-sky-600 text-white font-medium' : 'text-slate-300 hover:bg-slate-700/60 hover:text-sky-300 focus-visible:bg-slate-700/60 focus-visible:text-sky-300'}`;
  const collapsedClasses = `w-12 h-12 md:w-14 md:h-14 justify-center relative group ${isActive ? 'bg-sky-600 text-white shadow-md scale-105' : 'text-slate-400 hover:bg-slate-700 hover:text-sky-400 focus-visible:bg-slate-700 focus-visible:text-sky-400'}`;

  return (
    <div className={isExpanded ? 'w-full' : 'relative'}>
      <button
        onClick={onClick}
        aria-label={item.label}
        aria-current={isActive ? 'page' : undefined}
        className={`${baseClasses} ${isExpanded ? expandedClasses : collapsedClasses}`}
      >
        <IconComponent className={`flex-shrink-0 ${isExpanded ? 'w-5 h-5' : 'w-5 h-5 md:w-6 md:h-6'}`} />
        {isExpanded && <span className="ml-3 truncate">{item.label}</span>}
      </button>
      {!isExpanded && (
        <div
          className="absolute left-full ml-3 px-3 py-2 text-sm font-medium text-white bg-slate-800/95 backdrop-blur-sm rounded-md shadow-lg 
                     opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none
                     transform translate-x-[-8px] group-hover:translate-x-0 z-50"
          role="tooltip"
          id={`tooltip-${item.id}`}
        >
          {item.label}
          <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-800/95 transform rotate-45"></div>
        </div>
      )}
    </div>
  );
};

export default SidebarItem;
