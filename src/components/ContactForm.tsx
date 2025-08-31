import React, { useState } from 'react';
import { Phone, Mail, MapPin, Calendar, Users, Send } from 'lucide-react';

const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    pickupLocation: '',
    dropoffLocation: '',
    date: '',
    time: '',
    passengers: '1',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Form submitted:', formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <section id="contact" className="py-24 bg-slate-900/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          
          {/* Contact Information */}
          <div>
            <h2 className="text-4xl md:text-5xl font-light text-white mb-6">
              Get in <span className="text-teal-600 font-medium">Touch</span>
            </h2>
            
            <p className="text-xl text-gray-300 mb-12 leading-relaxed">
              Ready to book your premium chauffeur service? Contact us for personalized assistance 
              and immediate booking confirmation.
            </p>

            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="bg-teal-600/20 w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
                  <Phone className="w-6 h-6 text-teal-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-2">Phone</h3>
                  <p className="text-gray-300">+64 9 XXX XXXX</p>
                  <p className="text-gray-400 text-sm">Available 24/7 for bookings</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-teal-600/20 w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-teal-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-2">Email</h3>
                  <p className="text-gray-300">info@premiumchauffeur.nz</p>
                  <p className="text-gray-400 text-sm">Response within 2 hours</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-teal-600/20 w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-teal-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-2">Service Area</h3>
                  <p className="text-gray-300">Auckland & Greater Region</p>
                  <p className="text-gray-400 text-sm">Tours nationwide available</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-600/30 rounded-2xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-colors"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-colors"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-colors"
                  placeholder="+64 XXX XXX XXX"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="pickupLocation" className="block text-sm font-medium text-gray-300 mb-2">
                    Pick-up Location *
                  </label>
                  <input
                    type="text"
                    id="pickupLocation"
                    name="pickupLocation"
                    required
                    value={formData.pickupLocation}
                    onChange={handleChange}
                    className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-colors"
                    placeholder="Auckland Airport"
                  />
                </div>

                <div>
                  <label htmlFor="dropoffLocation" className="block text-sm font-medium text-gray-300 mb-2">
                    Drop-off Location *
                  </label>
                  <input
                    type="text"
                    id="dropoffLocation"
                    name="dropoffLocation"
                    required
                    value={formData.dropoffLocation}
                    onChange={handleChange}
                    className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-colors"
                    placeholder="City Hotel"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-300 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    required
                    value={formData.date}
                    onChange={handleChange}
                    className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="time" className="block text-sm font-medium text-gray-300 mb-2">
                    Time *
                  </label>
                  <input
                    type="time"
                    id="time"
                    name="time"
                    required
                    value={formData.time}
                    onChange={handleChange}
                    className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="passengers" className="block text-sm font-medium text-gray-300 mb-2">
                    Passengers
                  </label>
                  <select
                    id="passengers"
                    name="passengers"
                    value={formData.passengers}
                    onChange={handleChange}
                    className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-colors"
                  >
                    {[...Array(10)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1} {i === 0 ? 'passenger' : 'passengers'}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                  Special Requirements
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-colors resize-none"
                  placeholder="Any special requests or requirements..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-teal-600 hover:bg-teal-700 text-white px-8 py-4 rounded-full text-lg font-medium transition-all duration-300 hover:shadow-2xl hover:shadow-teal-500/25 flex items-center justify-center gap-3 group"
              >
                Send Enquiry
                <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactForm;