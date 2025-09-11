import React from 'react';
import { Phone, Mail, MessageCircle, Clock } from 'lucide-react';
import WebCallButton from './WebCallButton';

const CallToAction = () => {
  return (
    <section className="py-24 bg-gradient-to-r from-gray-700/50 to-gray-600/50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="bg-gradient-to-br from-gray-200/10 to-gray-300/10 backdrop-blur-sm border border-gray-400/20 rounded-3xl p-12">
          <h2 className="text-4xl md:text-5xl font-light text-white mb-6">
            Experience Luxury Travel
            <span className="block text-teal-600 font-medium">Call Us Today</span>
          </h2>
          
          <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Speak directly with our premium chauffeur service team. Get instant quotes, 
            personalized recommendations, and immediate booking confirmation.
          </p>

          {/* Main Call Button */}
          <div className="mb-12">
            <WebCallButton />
          </div>

          {/* Alternative Contact Methods */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-600/20 hover:border-teal-600/40 transition-all duration-300">
              <div className="bg-teal-600/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-6 h-6 text-teal-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Traditional Call</h3>
              <a href="tel:+64-9-XXX-XXXX" className="text-teal-400 hover:text-teal-300 transition-colors font-medium">
                +64 9 XXX XXXX
              </a>
              <p className="text-gray-400 text-sm mt-2">Available 24/7</p>
            </div>

            <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-600/20 hover:border-teal-600/40 transition-all duration-300">
              <div className="bg-teal-600/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-teal-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Email Enquiry</h3>
              <a href="mailto:info@blackstonechauffeur.co.nz" className="text-teal-400 hover:text-teal-300 transition-colors font-medium">
                Send Message
              </a>
              <p className="text-gray-400 text-sm mt-2">Response within 2 hours</p>
            </div>

            <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-600/20 hover:border-teal-600/40 transition-all duration-300">
              <div className="bg-teal-600/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-6 h-6 text-teal-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Live Chat</h3>
              <button className="text-teal-400 hover:text-teal-300 transition-colors font-medium">
                Start Chat
              </button>
              <p className="text-gray-400 text-sm mt-2">Instant support</p>
            </div>
          </div>

          {/* Service Promise */}
          <div className="mt-12 pt-8 border-t border-gray-600/30">
            <div className="flex items-center justify-center gap-8 text-gray-300 flex-wrap">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-teal-400" />
                <span className="text-sm">Instant Response</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm">Expert Consultation</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
                <span className="text-sm">Personalized Service</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;