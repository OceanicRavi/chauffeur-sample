import React from 'react';
import { MapPin, Clock, ChevronRight } from 'lucide-react';

const tours = [
  {
    destination: "Auckland",
    description: "Explore New Zealand's largest city with visits to Sky Tower, Harbour Bridge, and waterfront dining.",
    duration: "Half/Full Day",
    image: "https://images.pexels.com/photos/1108701/pexels-photo-1108701.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop"
  },
  {
    destination: "Hamilton",
    description: "Discover the heart of Waikato with gardens, cultural sites, and scenic river walks.",
    duration: "Full Day",
    image: "https://images.pexels.com/photos/1054218/pexels-photo-1054218.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop"
  },
  {
    destination: "Paihia",
    description: "Bay of Islands adventure featuring historic Waitangi, dolphin watching, and coastal beauty.",
    duration: "2-3 Days",
    image: "https://images.pexels.com/photos/1118873/pexels-photo-1118873.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop"
  },
  {
    destination: "Rotorua",
    description: "Geothermal wonders, Maori culture, and adventure activities in this unique thermal city.",
    duration: "1-2 Days",
    image: "https://images.pexels.com/photos/2835436/pexels-photo-2835436.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop"
  },
  {
    destination: "Taupo",
    description: "Lake Taupo's pristine waters, thermal pools, and stunning volcanic landscapes await.",
    duration: "1-2 Days",
    image: "https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop"
  }
];

const ToursPackages = () => {
  return (
    <section className="py-24 bg-slate-900/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-light text-white mb-6">
            Bespoke <span className="text-teal-600 font-medium">Tours & Packages</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Discover New Zealand's most captivating destinations with our expertly crafted tour packages.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tours.map((tour, index) => (
            <div 
              key={index}
              className="group bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl overflow-hidden hover:transform hover:scale-105 transition-all duration-500 border border-gray-700/30 hover:border-teal-600/50"
            >
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={tour.image} 
                  alt={tour.destination}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent"></div>
                
                <div className="absolute bottom-4 left-4">
                  <div className="flex items-center gap-2 text-gray-300 text-sm mb-2">
                    <Clock className="w-4 h-4" />
                    {tour.duration}
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-5 h-5 text-teal-400" />
                  <h3 className="text-2xl font-semibold text-white">{tour.destination}</h3>
                </div>
                
                <p className="text-gray-300 mb-6 leading-relaxed">
                  {tour.description}
                </p>

                <button className="group/btn bg-teal-600/20 hover:bg-teal-600 text-teal-400 hover:text-white px-6 py-3 rounded-full transition-all duration-300 flex items-center gap-2 w-full justify-center border border-teal-600/30 hover:border-teal-600">
                  Learn More
                  <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ToursPackages;