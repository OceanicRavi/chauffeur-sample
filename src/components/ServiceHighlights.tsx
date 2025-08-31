import React from 'react';
import { Car, UserCheck, Heart, Briefcase } from 'lucide-react';

const services = [
  {
    icon: Car,
    title: "Luxurious Vehicles",
    description: "Premium fleet of meticulously maintained luxury vehicles equipped with the latest amenities and comfort features."
  },
  {
    icon: UserCheck,
    title: "Professional Chauffeurs",
    description: "Highly trained, licensed professionals with extensive local knowledge and commitment to exceptional service."
  },
  {
    icon: Heart,
    title: "Personalized Experience",
    description: "Tailored services to meet your specific requirements, ensuring every journey exceeds your expectations."
  },
  {
    icon: Briefcase,
    title: "Concierge Services",
    description: "Complete travel assistance including itinerary planning, reservations, and special arrangements."
  }
];

const ServiceHighlights = () => {
  return (
    <section className="py-24 bg-slate-800/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-light text-white mb-6">
            Why Choose <span className="text-teal-600 font-medium">Our Service</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            We deliver unparalleled luxury transportation experiences with attention to every detail.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service, index) => (
            <div 
              key={index} 
              className="group bg-gradient-to-br from-gray-700/40 to-gray-800/40 backdrop-blur-sm border border-gray-600/30 rounded-2xl p-8 text-center hover:border-teal-600/50 transition-all duration-500 hover:transform hover:scale-105"
            >
              <div className="bg-teal-600/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-teal-600/30 transition-colors">
                <service.icon className="w-8 h-8 text-teal-400" />
              </div>
              
              <h3 className="text-xl font-semibold text-teal-600 mb-4">
                {service.title}
              </h3>
              
              <p className="text-gray-300 leading-relaxed">
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServiceHighlights;