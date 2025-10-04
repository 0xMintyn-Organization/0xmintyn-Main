'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star, TrendingUp, Users, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

const heroSlides = [
  {
    id: 1,
    title: "Digital Products Marketplace",
    subtitle: "Access premium templates, design assets, and digital tools instantly",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop",
    cta: "Explore Products",
    badge: "New Arrivals"
  },
  {
    id: 2,
    title: "Professional Services",
    subtitle: "Connect with skilled professionals for your digital projects",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop",
    cta: "Browse Services",
    badge: "Top Rated"
  },
  {
    id: 3,
    title: "Instant Downloads",
    subtitle: "Get immediate access to templates, assets, and digital resources",
    image: "https://images.unsplash.com/photo-1558655146-d09347e92766?w=800&h=400&fit=crop",
    cta: "Start Shopping",
    badge: "Best Sellers"
  }
];

const stats = [
  { icon: Package, label: "Digital Products", value: "2,500+" },
  { icon: Users, label: "Active Sellers", value: "1,200+" },
  { icon: Star, label: "Happy Customers", value: "25,000+" },
  { icon: TrendingUp, label: "Success Rate", value: "98%" }
];

export default function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  return (
    <div className="mb-12">
      {/* Hero Carousel */}
            <div className="relative bg-gradient-to-r from-green-900 to-green-800 rounded-2xl overflow-hidden mb-8">
        <div className="relative h-96">
          {heroSlides.map((slide, index) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-500 ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <div className="relative h-full">
                <Image
                  src={slide.image}
                  alt={slide.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-40" />
                <div className="absolute inset-0 flex items-center">
                  <div className="container mx-auto px-8">
                    <div className="max-w-2xl">
                      <Badge className="mb-4 bg-green-100 text-green-800 border-0">
                        {slide.badge}
                      </Badge>
                      <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                        {slide.title}
                      </h1>
                      <p className="text-xl text-gray-200 mb-6">
                        {slide.subtitle}
                      </p>
                      <Button size="lg" className="bg-green-900 hover:bg-green-800 text-white">
                        {slide.cta}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        <Button
          variant="ghost"
          size="sm"
          onClick={prevSlide}
          className="absolute left-4 top-1/2 transform -translate-y-1/2  bg-opacity-20 hover:bg-opacity-30 text-white"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={nextSlide}
          className="absolute right-4 top-1/2 transform -translate-y-1/2  bg-opacity-20 hover:bg-opacity-30 text-white"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>

        {/* Dots Indicator */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentSlide ? '' : ' bg-opacity-50'
              }`}
            />
          ))}
        </div>
      </div>

    

    </div>
  );
}
