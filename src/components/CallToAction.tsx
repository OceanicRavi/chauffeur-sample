import React from 'react';
import { Phone, Mail, ChevronRight } from 'lucide-react';
import WebCallButton from './WebCallButton';

const CallToAction = () => {
  return (
    <section className="py-24 bg-gradient-to-r from-gray-700/50 to-gray-600/50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="bg-gradient-to-br from-gray-200/10 to-gray-300/10 backdrop-blur-sm border border-gray-400/20 rounded-3xl p-12">
          <h2 className="text-4xl md:text-5xl font-light text-white mb-6">
            Ready to Experience
            <span className="block text-teal-600 font-medium">Luxury Travel?</span>
          </h2>
          
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Book your premium chauffeur service today and discover the difference that true luxury makes.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <button className="group bg-teal-600 hover:bg-teal-700 text-white px-8 py-4 rounded-full text-lg font-medium transition-all duration-300 hover:shadow-2xl hover:shadow-teal-500/25 flex items-center gap-3">
              Request a Quote
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <WebCallButton />
            
            <div className="flex items-center gap-6 text-gray-300">
              <a href="tel:+64-9-XXX-XXXX" className="flex items-center gap-2 hover:text-teal-400 transition-colors">
                <Phone className="w-5 h-5" />
                <span>+64 9 XXX XXXX</span>
              </a>
              
              <a href="mailto:info@premiumchauffeur.nz" className="flex items-center gap-2 hover:text-teal-400 transition-colors">
                <Mail className="w-5 h-5" />
                <span>Book Now</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;