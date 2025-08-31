import React from 'react';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: "Sarah Mitchell",
    role: "Corporate Executive",
    content: "Exceptional service from start to finish. The chauffeur was professional, the vehicle immaculate, and the entire experience seamless. Highly recommended for business travel.",
    rating: 5,
    image: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
  },
  {
    name: "David Chen",
    role: "Wedding Client",
    content: "Made our special day even more memorable. The Mercedes S Class was pristine and the chauffeur went above and beyond to ensure everything was perfect.",
    rating: 5,
    image: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
  },
  {
    name: "Emma Thompson",
    role: "Tourist",
    content: "The Rotorua tour was absolutely fantastic. Our chauffeur's local knowledge enhanced the experience tremendously. Luxury travel at its finest.",
    rating: 5,
    image: "https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
  },
  {
    name: "Michael Foster",
    role: "Airport Transfer",
    content: "Reliable, punctual, and comfortable. The airport transfer service exceeded expectations with flight tracking and complimentary refreshments.",
    rating: 5,
    image: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
  }
];

const Testimonials = () => {
  return (
    <section className="py-24 bg-slate-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-light text-white mb-6">
            Client <span className="text-teal-600 font-medium">Testimonials</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Hear from our satisfied clients who have experienced our premium chauffeur services.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index}
              className="bg-gradient-to-br from-gray-700/40 to-gray-800/40 backdrop-blur-sm border border-gray-600/30 rounded-2xl p-8 hover:border-teal-600/50 transition-all duration-500"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="text-white font-semibold">{testimonial.name}</h4>
                    <p className="text-gray-400 text-sm">{testimonial.role}</p>
                  </div>
                </div>
                
                <Quote className="w-8 h-8 text-teal-600/50" />
              </div>

              <div className="flex items-center gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              <p className="text-gray-300 leading-relaxed italic">
                "{testimonial.content}"
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;