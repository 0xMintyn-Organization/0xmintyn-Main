import React from "react";

const Spinner = () => {
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-zinc-800">
      <div className="w-12 h-12 border-4 border-t-4 border-t-green-500 border-green-300 rounded-full animate-spin-glow"></div>

      <style jsx>{`
        @keyframes spin-glow {
          0% {
            transform: rotate(0deg);
            box-shadow: 0 0 5px rgba(34, 197, 94, 0.6);
          }
          50% {
            box-shadow: 0 0 20px rgba(34, 197, 94, 1);
          }
          100% {
            transform: rotate(360deg);
            box-shadow: 0 0 5px rgba(34, 197, 94, 0.6);
          }
        }
        .animate-spin-glow {
          animation: spin-glow 1.5s linear infinite;
        }
          
      `}</style>



    </div>
  );
};

export default Spinner;
