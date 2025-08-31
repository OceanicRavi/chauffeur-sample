import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Users, Zap } from 'lucide-react';

const vehicles = [
  {
    name: "BMW 7 Series",
    image: "https://images.pexels.com/photos/120049/pexels-photo-120049.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
    features: ["Executive Comfort", "Advanced Technology", "Premium Interior"],
    capacity: "4 passengers"
  },
  {
    name: "Mercedes S Class",
    image: "https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
    features: ["Luxury Seating", "Climate Control", "Premium Sound"],
    capacity: "4 passengers"
  },
  {
    name: "Mercedes E Class",
    image: "https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
    features: ["Business Class", "Efficiency", "Comfort"],
    capacity: "4 passengers"
  },
  {
    name: "Mercedes V Class",
    image: "https://images.pexels.com/photos/1119796/pexels-photo-1119796.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
    features: ["Group Travel", "Spacious Interior", "Premium Comfort"],
    capacity: "7 passengers"
  },
  {
    name: "Volvo XC90",
    image: "https://images.pexels.com/photos/1213294/pexels-photo-1213294.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
    features: ["Scandinavian Luxury", "Safety First", "All-Weather"],
    capacity: "6 passengers"
  },
  {
    name: "Range Rover",
    image: "https://images.pexels.com/photos/2127022/pexels-photo-2127022.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
    features: ["British Luxury", "Off-Road Capability", "Commanding Presence"],
    capacity: "5 passengers"
  },
  {
    name: "Mercedes Sprinter",
    image: "https://images.pexels.com/photos/1319825/pexels-photo-1319825.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
    features: ["Large Groups", "Luggage Space", "Professional"],
    capacity: "16 passengers"
  },
  {
    name: "Toyota Vellfire",
    image: "https://images.pexels.com/photos/1592384/pexels-photo-1592384.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
    features: ["VIP Comfort", "Sliding Doors", "Premium MPV"],
    capacity: "7 passengers"
  },
  {
    name: "Mercedes EQE 300",
    image: "https://images.pexels.com/photos/7144188/pexels-photo-7144188.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
    features: ["Electric Luxury", "Silent Drive", "Eco-Friendly"],
    capacity: "4 passengers",
    isElectric: true
  }
];

const FleetShowcase = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % Math.ceil(vehicles.length / 3));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + Math.ceil(vehicles.length / 3)) % Math.ceil(vehicles.length / 3));
  };

  const visibleVehicles = vehicles.slice(currentIndex * 3, currentIndex * 3 + 3);

  return (
    <section className="py-24 bg-slate-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-light text-white mb-6">
            Our Premium <span className="text-teal-600 font-medium">Fleet</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Choose from our exclusive collection of luxury vehicles, each meticulously maintained 
            and equipped with premium amenities for your comfort.
          </p>
        </div>

        {/* Desktop Grid */}
        <div className="hidden lg:grid lg:grid-cols-3 gap-8 mb-12">
          {vehicles.map((vehicle, index) => (
            <div key={index} className="group bg-gray-800/50 backdrop-blur-sm rounded-2xl overflow-hidden hover:bg-gray-700/50 transition-all duration-500 hover:transform hover:scale-105">
              <div className="relative h-64 overflow-hidden">
                <img 
                  src={vehicle.image} 
                  alt={vehicle.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                {vehicle.isElectric && (
                  <div className="absolute top-4 right-4 bg-teal-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
                    <Zap className="w-4 h-4" />
                    Electric
                  </div>
                )}
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-semibold text-white mb-3">{vehicle.name}</h3>
                <div className="flex items-center gap-2 text-gray-400 mb-4">
                  <Users className="w-4 h-4" />
                  <span className="text-sm">{vehicle.capacity}</span>
                </div>
                <ul className="space-y-2">
                  {vehicle.features.map((feature, idx) => (
                    <li key={idx} className="text-gray-300 text-sm flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-teal-600 rounded-full"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile/Tablet Carousel */}
        <div className="lg:hidden">
          <div className="relative">
            <div className="flex gap-6 overflow-hidden">
              {visibleVehicles.map((vehicle, index) => (
                <div key={currentIndex * 3 + index} className="flex-shrink-0 w-full md:w-1/2 bg-gray-800/50 backdrop-blur-sm rounded-2xl overflow-hidden">
                  <div className="relative h-64 overflow-hidden">
                    <img 
                      src={vehicle.image} 
                      alt={vehicle.name}
                      className="w-full h-full object-cover"
                    />
                    {vehicle.isElectric && (
                      <div className="absolute top-4 right-4 bg-teal-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
                        <Zap className="w-4 h-4" />
                        Electric
                      </div>
                    )}
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-white mb-3">{vehicle.name}</h3>
                    <div className="flex items-center gap-2 text-gray-400 mb-4">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">{vehicle.capacity}</span>
                    </div>
                    <ul className="space-y-2">
                      {vehicle.features.map((feature, idx) => (
                        <li key={idx} className="text-gray-300 text-sm flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-teal-600 rounded-full"></div>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation Buttons */}
            <button 
              onClick={prevSlide}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-gray-800/80 hover:bg-gray-700 text-white p-3 rounded-full transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button 
              onClick={nextSlide}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-gray-800/80 hover:bg-gray-700 text-white p-3 rounded-full transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Pagination Dots */}
          <div className="flex justify-center mt-8 gap-2">
            {Array.from({ length: Math.ceil(vehicles.length / 3) }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-teal-600' : 'bg-gray-600'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FleetShowcase;