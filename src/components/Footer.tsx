import React from 'react';
import { Car, Facebook, Instagram, Twitter, Linkedin, Phone, Mail, MapPin } from 'lucide-react';

const Footer = () => {
  const navigationLinks = [
    { name: 'How We Work', href: '#services' },
    { name: 'FAQ', href: '#faq' },
    { name: 'Services', href: '#fleet' },
    { name: 'Contact', href: '#contact' }
  ];

  const socialLinks = [
    { name: 'Facebook', icon: Facebook, href: '#' },
    { name: 'Instagram', icon: Instagram, href: '#' },
    { name: 'Twitter', icon: Twitter, href: '#' },
    { name: 'LinkedIn', icon: Linkedin, href: '#' }
  ];

  return (
    <footer className="bg-slate-950 border-t border-gray-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-teal-600 w-10 h-10 rounded-full flex items-center justify-center">
                <Car className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-white">Premium Chauffeur</h3>
            </div>
            
            <p className="text-gray-300 mb-8 leading-relaxed max-w-md">
              New Zealand's premier luxury transportation service, providing exceptional chauffeur 
              experiences with professional drivers and premium vehicles.
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-gray-300">
                <Phone className="w-5 h-5 text-teal-400" />
                <span>+64 9 XXX XXXX</span>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <Mail className="w-5 h-5 text-teal-400" />
                <span>info@premiumchauffeur.nz</span>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <MapPin className="w-5 h-5 text-teal-400" />
                <span>Auckland, New Zealand</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-6">Quick Links</h4>
            <ul className="space-y-4">
              {navigationLinks.map((link, index) => (
                <li key={index}>
                  <a 
                    href={link.href}
                    className="text-gray-300 hover:text-teal-400 transition-colors duration-300"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-6">Follow Us</h4>
            <div className="flex gap-4">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  className="bg-gray-800/50 hover:bg-teal-600 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:transform hover:scale-110"
                >
                  <social.icon className="w-5 h-5 text-gray-300 hover:text-white" />
                </a>
              ))}
            </div>

            {/* Partner Logos Placeholder */}
            <div className="mt-8">
              <h5 className="text-sm font-medium text-gray-400 mb-4">Trusted Partners</h5>
              <div className="flex gap-4 opacity-60">
                <div className="bg-gray-700/30 w-16 h-8 rounded flex items-center justify-center">
                  <span className="text-xs text-gray-400">BMW</span>
                </div>
                <div className="bg-gray-700/30 w-16 h-8 rounded flex items-center justify-center">
                  <span className="text-xs text-gray-400">Mercedes</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800/50 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-sm">
            © 2025 Premium Chauffeur Services. All rights reserved.
          </p>
          
          <div className="flex gap-6 text-sm text-gray-400">
            <a href="#" className="hover:text-teal-400 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-teal-400 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-teal-400 transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;