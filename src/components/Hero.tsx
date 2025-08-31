import React from 'react';
import { ChevronRight } from 'lucide-react';

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('https://images.pexels.com/photos/3972755/pexels-photo-3972755.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop')"
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-800/80 to-transparent"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="animate-fade-in-up">
          <h1 className="text-5xl md:text-7xl font-light text-white mb-6 tracking-tight">
            Experience Premium
            <span className="block text-teal-600 font-medium">Chauffeur Services</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Luxury transportation redefined. Professional chauffeurs, premium vehicles, 
            and personalized service for every journey.
          </p>

          <button className="group bg-teal-600 hover:bg-teal-700 text-white px-12 py-4 rounded-full text-lg font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-teal-500/25 flex items-center gap-3 mx-auto">
            Book a Ride
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/50 rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;