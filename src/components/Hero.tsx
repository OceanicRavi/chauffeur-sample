import React from 'react';
import { Phone, Star } from 'lucide-react';
import WebCallButton from './WebCallButton';

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
          
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Luxury transportation redefined. Professional chauffeurs, premium vehicles, 
            and personalized service for every journey.
          </p>

          {/* Call to Action Section */}
          <div className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-sm border border-gray-600/20 rounded-3xl p-8 mb-8 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="text-gray-300 text-sm">Rated 5/5 by our clients</span>
            </div>
            
            <h2 className="text-2xl md:text-3xl font-medium text-white mb-4">
              Ready to Experience Luxury?
            </h2>
            
            <p className="text-gray-300 mb-6 text-lg">
              Speak directly with our premium service team
            </p>

            <WebCallButton />
            
            <div className="flex items-center justify-center gap-6 mt-6 text-gray-300">
              <a href="tel:+64-9-377-5466" className="flex items-center gap-2 hover:text-teal-400 transition-colors">
                <Phone className="w-4 h-4" />
                <span className="text-sm">+64 9 377 5466</span>
              </a>
              <span className="text-gray-500">•</span>
              <span className="text-sm text-gray-400">Available 24/7</span>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto text-center">
            <div className="bg-gray-800/20 backdrop-blur-sm rounded-2xl p-6 border border-gray-600/20">
              <div className="text-3xl font-bold text-teal-400 mb-2">500+</div>
              <div className="text-gray-300 text-sm">Happy Clients</div>
            </div>
            <div className="bg-gray-800/20 backdrop-blur-sm rounded-2xl p-6 border border-gray-600/20">
              <div className="text-3xl font-bold text-teal-400 mb-2">24/7</div>
              <div className="text-gray-300 text-sm">Premium Service</div>
            </div>
            <div className="bg-gray-800/20 backdrop-blur-sm rounded-2xl p-6 border border-gray-600/20">
              <div className="text-3xl font-bold text-teal-400 mb-2">15+</div>
              <div className="text-gray-300 text-sm">Luxury Vehicles</div>
            </div>
          </div>
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