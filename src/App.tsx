import React from 'react';
import Hero from './components/Hero';
import FleetShowcase from './components/FleetShowcase';
import ServiceHighlights from './components/ServiceHighlights';
import ToursPackages from './components/ToursPackages';
import Testimonials from './components/Testimonials';
import CallToAction from './components/CallToAction';
import ContactForm from './components/ContactForm';
import Footer from './components/Footer';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-950">
      <Hero />
      <FleetShowcase />
      <ServiceHighlights />
      <ToursPackages />
      <Testimonials />
      <CallToAction />
      <ContactForm />
      <Footer />
    </div>
  );
}

export default App;