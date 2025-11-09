import React from "react";

interface Props {
  className?: string;
}

const IconFaceTime = ({ className }: Props) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M15 10l5 5V9l-5 5" />
      <rect width="14" height="14" x="2" y="5" rx="2" />
    </svg>
  );
};

export default IconFaceTime;