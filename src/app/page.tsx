'use client'

import { useState, useEffect } from 'react'
import { Calendar, Scissors, Clock, Phone, User, Check, ChevronRight, Menu, X, Star, Award, Instagram, AlertCircle } from 'lucide-react'
import { fetchOccupiedSlots, createAppointment } from '@/lib/supabase'

type Step = 'service' | 'professional' | 'datetime' | 'contact' | 'confirmation'

interface Service {
  id: string
  name: string
  duration: string
  price: string
  description: string
}

interface Professional {
  id: string
  name: string
  specialty: string
  image: string
  bio: string
}

interface Booking {
  service?: Service
  professional?: Professional
  date?: string
  time?: string
  name?: string
  phone?: string
}

const services: Service[] = [
  { id: '1', name: 'Corte Premium', duration: '45min', price: 'R$ 120', description: 'Corte personalizado com acabamento impecável' },
  { id: '2', name: 'Barba Clássica', duration: '30min', price: 'R$ 80', description: 'Aparar e modelar com navalha e toalha quente' },
  { id: '3', name: 'Combo Executivo', duration: '75min', price: 'R$ 180', description: 'Corte + Barba + Tratamento facial' },
]

const professionals: Professional[] = [
  { 
    id: '1', 
    name: 'Ricardo Silva', 
    specialty: 'Especialista em Navalha', 
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop',
    bio: '15 anos de experiência em técnicas clássicas'
  },
  { 
    id: '2', 
    name: 'Carlos Mendes', 
    specialty: 'Visagismo', 
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&h=800&fit=crop',
    bio: 'Especialista em harmonização facial'
  },
  { 
    id: '3', 
    name: 'André Costa', 
    specialty: 'Master Barber', 
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=800&fit=crop',
    bio: 'Certificado internacional em barbering'
  },
]

const portfolioImages = [
  'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=600&h=800&fit=crop',
  'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=600&h=900&fit=crop',
  'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&h=600&fit=crop',
  'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=600&h=800&fit=crop',
  'https://images.unsplash.com/photo-1621607512214-68297480165e?w=600&h=700&fit=crop',
]

const availableDates = [
  { date: '2024-02-15', label: 'Qui, 15 Fev' },
  { date: '2024-02-16', label: 'Sex, 16 Fev' },
  { date: '2024-02-17', label: 'Sáb, 17 Fev' },
  { date: '2024-02-19', label: 'Seg, 19 Fev' },
]

const allAvailableTimes = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00']

export default function BarberShop() {
  const [showBooking, setShowBooking] = useState(false)
  const [currentStep, setCurrentStep] = useState<Step>('service')
  const [booking, setBooking] = useState<Booking>({})
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [occupiedSlots, setOccupiedSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [bookingError, setBookingError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Buscar horários ocupados quando barbeiro e data forem selecionados
  useEffect(() => {
    if (booking.professional?.id && booking.date) {
      loadOccupiedSlots(booking.professional.id, booking.date)
    }
  }, [booking.professional?.id, booking.date])

  const loadOccupiedSlots = async (barberId: string, date: string) => {
    setLoadingSlots(true)
    try {
      const slots = await fetchOccupiedSlots(barberId, date)
      setOccupiedSlots(slots)
    } catch (error) {
      console.error('Erro ao carregar horários:', error)
    } finally {
      setLoadingSlots(false)
    }
  }

  const handleServiceSelect = (service: Service) => {
    setBooking({ ...booking, service })
    setCurrentStep('professional')
  }

  const handleProfessionalSelect = (professional: Professional) => {
    setBooking({ ...booking, professional })
    setCurrentStep('datetime')
  }

  const handleDateTimeSelect = (date: string, time: string) => {
    setBooking({ ...booking, date, time })
    setCurrentStep('contact')
  }

  const handleContactSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setBookingError(null)
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const phone = formData.get('phone') as string

    try {
      // Criar agendamento com verificação de conflito
      const result = await createAppointment({
        barber_id: booking.professional!.id,
        client_name: name,
        client_phone: phone,
        date: booking.date!,
        time_slot: booking.time!,
        service_id: booking.service!.id,
      })

      if (result.success) {
        setBooking({ ...booking, name, phone })
        setCurrentStep('confirmation')
      } else {
        setBookingError(result.message)
        // Recarregar horários ocupados para atualizar a UI
        if (booking.professional?.id && booking.date) {
          await loadOccupiedSlots(booking.professional.id, booking.date)
        }
      }
    } catch (error) {
      console.error('Erro ao criar agendamento:', error)
      setBookingError('Erro ao processar agendamento. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetBooking = () => {
    setBooking({})
    setCurrentStep('service')
    setShowBooking(false)
    setOccupiedSlots([])
    setBookingError(null)
  }

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
      setMobileMenuOpen(false)
    }
  }

  // Filtrar horários disponíveis (remover ocupados)
  const availableTimes = allAvailableTimes.filter(time => !occupiedSlots.includes(time))

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header Sticky com Blur */}
      <header 
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${
          scrolled 
            ? 'bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-[#D4AF37]/10 shadow-2xl' 
            : 'bg-transparent'
        }`}
      >
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex-shrink-0">
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#D4AF37] tracking-tight">
                ÉLITE
              </h1>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <button 
                onClick={() => scrollToSection('experiencia')}
                className="text-sm font-medium text-gray-300 hover:text-[#D4AF37] transition-colors duration-300 tracking-wider uppercase"
              >
                A Experiência
              </button>
              <button 
                onClick={() => scrollToSection('mestres')}
                className="text-sm font-medium text-gray-300 hover:text-[#D4AF37] transition-colors duration-300 tracking-wider uppercase"
              >
                Nossos Mestres
              </button>
              <button 
                onClick={() => scrollToSection('galeria')}
                className="text-sm font-medium text-gray-300 hover:text-[#D4AF37] transition-colors duration-300 tracking-wider uppercase"
              >
                Galeria
              </button>
              <button 
                onClick={() => scrollToSection('servicos')}
                className="text-sm font-medium text-gray-300 hover:text-[#D4AF37] transition-colors duration-300 tracking-wider uppercase"
              >
                Serviços
              </button>
            </div>

            {/* CTA Button Desktop */}
            <div className="hidden md:block">
              <button
                onClick={() => setShowBooking(true)}
                className="px-6 py-3 bg-[#D4AF37] text-black font-semibold text-sm rounded-sm
                         hover:bg-[#c4a137] transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]
                         border border-[#D4AF37] hover:scale-105 tracking-wider uppercase"
              >
                Reservar Agora
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-[#D4AF37] hover:text-[#c4a137] transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-6 border-t border-[#D4AF37]/10">
              <div className="flex flex-col space-y-4">
                <button 
                  onClick={() => scrollToSection('experiencia')}
                  className="text-sm font-medium text-gray-300 hover:text-[#D4AF37] transition-colors tracking-wider uppercase text-left"
                >
                  A Experiência
                </button>
                <button 
                  onClick={() => scrollToSection('mestres')}
                  className="text-sm font-medium text-gray-300 hover:text-[#D4AF37] transition-colors tracking-wider uppercase text-left"
                >
                  Nossos Mestres
                </button>
                <button 
                  onClick={() => scrollToSection('galeria')}
                  className="text-sm font-medium text-gray-300 hover:text-[#D4AF37] transition-colors tracking-wider uppercase text-left"
                >
                  Galeria
                </button>
                <button 
                  onClick={() => scrollToSection('servicos')}
                  className="text-sm font-medium text-gray-300 hover:text-[#D4AF37] transition-colors tracking-wider uppercase text-left"
                >
                  Serviços
                </button>
                <button
                  onClick={() => {
                    setShowBooking(true)
                    setMobileMenuOpen(false)
                  }}
                  className="px-6 py-3 bg-[#D4AF37] text-black font-semibold text-sm rounded-sm
                           hover:bg-[#c4a137] transition-all duration-300 tracking-wider uppercase text-center"
                >
                  Reservar Agora
                </button>
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* Hero Section Reformulada */}
      <section 
        className="relative h-screen flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1920&h=1080&fit=crop)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Overlay com gradiente */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/90"></div>
        
        {/* Conteúdo Hero */}
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold mb-8 tracking-tight leading-none">
            Sua Estética,<br />
            <span className="text-[#D4AF37]">Nossa Excelência</span>
          </h1>
          
          <p className="text-gray-300 text-base sm:text-lg md:text-xl lg:text-2xl mb-12 max-w-3xl mx-auto font-light tracking-wide">
            Onde a tradição encontra o estilo moderno
          </p>
          
          <button
            onClick={() => setShowBooking(true)}
            className="group relative px-10 sm:px-14 py-5 sm:py-6 bg-[#D4AF37] text-black font-bold text-base sm:text-lg rounded-sm
                     hover:bg-[#c4a137] transition-all duration-500 hover:shadow-[0_0_40px_rgba(212,175,55,0.6)]
                     border-2 border-[#D4AF37] hover:scale-105 tracking-wider uppercase"
          >
            <span className="flex items-center gap-3">
              Agendar Horário
              <ChevronRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
            </span>
          </button>

          {/* Social Proof */}
          <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-12 text-sm">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-[#D4AF37]/20 border-2 border-[#0a0a0a]"></div>
                ))}
              </div>
              <span className="text-gray-400 ml-2">+500 clientes este mês</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-4 h-4 fill-[#D4AF37] text-[#D4AF37]" />
                ))}
              </div>
              <span className="text-gray-400">4.9/5 avaliação</span>
            </div>
          </div>
        </div>

        {/* Decoração dourada */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent"></div>
      </section>

      {/* Seção "A Experiência" */}
      <section id="experiencia" className="py-32 px-4 sm:px-6 lg:px-8 bg-[#0a0a0a]">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            {/* Texto */}
            <div className="space-y-8">
              <div>
                <p className="text-[#D4AF37] text-xs sm:text-sm font-semibold tracking-[0.3em] uppercase mb-4">
                  Tradição & Excelência
                </p>
                <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                  A Arte de<br />
                  <span className="text-[#D4AF37]">Cuidar</span>
                </h2>
              </div>
              
              <div className="space-y-6 text-gray-400 text-base sm:text-lg leading-relaxed">
                <p>
                  Desde 2010, a <span className="text-white font-semibold">ÉLITE Barbearia</span> redefine 
                  o conceito de cuidado masculino. Combinamos técnicas clássicas de barbering com 
                  o que há de mais moderno em estética.
                </p>
                <p>
                  Cada visita é uma experiência única: ambiente sofisticado, profissionais certificados 
                  internacionalmente e produtos premium selecionados especialmente para você.
                </p>
                <p>
                  Não é apenas um corte. É um ritual de autocuidado, confiança e estilo.
                </p>
              </div>

              <div className="flex flex-wrap gap-8 pt-4">
                <div className="flex items-start gap-3">
                  <Award className="w-6 h-6 text-[#D4AF37] flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-white">Certificação Internacional</p>
                    <p className="text-sm text-gray-500">Master Barbers Academy</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Star className="w-6 h-6 text-[#D4AF37] flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-white">Excelência Comprovada</p>
                    <p className="text-sm text-gray-500">4.9/5 em +2000 avaliações</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Composição de Imagens */}
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="relative overflow-hidden rounded-lg group">
                    <img 
                      src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&h=700&fit=crop" 
                      alt="Interior da barbearia"
                      className="w-full h-[300px] sm:h-[400px] object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                  </div>
                </div>
                <div className="space-y-4 pt-12">
                  <div className="relative overflow-hidden rounded-lg group">
                    <img 
                      src="https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=600&h=700&fit=crop" 
                      alt="Ambiente premium"
                      className="w-full h-[300px] sm:h-[400px] object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                  </div>
                </div>
              </div>
              
              {/* Decoração */}
              <div className="absolute -top-8 -right-8 w-32 h-32 border border-[#D4AF37]/20 rounded-lg -z-10"></div>
              <div className="absolute -bottom-8 -left-8 w-32 h-32 border border-[#D4AF37]/20 rounded-lg -z-10"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Seção "Nossos Mestres" */}
      <section id="mestres" className="py-32 px-4 sm:px-6 lg:px-8 bg-black">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-20">
            <p className="text-[#D4AF37] text-xs sm:text-sm font-semibold tracking-[0.3em] uppercase mb-4">
              Equipe de Elite
            </p>
            <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold">
              Nossos <span className="text-[#D4AF37]">Mestres</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
            {professionals.map((professional) => (
              <div key={professional.id} className="group">
                <div className="relative overflow-hidden rounded-lg mb-6">
                  <img 
                    src={professional.image} 
                    alt={professional.name}
                    className="w-full h-[500px] object-cover grayscale group-hover:grayscale-0 
                             transition-all duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent 
                                opacity-60 group-hover:opacity-40 transition-opacity duration-500"></div>
                  
                  {/* Badge flutuante */}
                  <div className="absolute top-4 right-4 bg-[#D4AF37] text-black px-3 py-1 rounded-full text-xs font-bold">
                    MASTER
                  </div>
                </div>

                <div className="text-center space-y-2">
                  <h3 className="font-serif text-2xl sm:text-3xl font-bold group-hover:text-[#D4AF37] 
                               transition-colors duration-300">
                    {professional.name}
                  </h3>
                  <p className="text-[#D4AF37] text-sm font-semibold tracking-wider uppercase">
                    {professional.specialty}
                  </p>
                  <p className="text-gray-400 text-sm max-w-xs mx-auto">
                    {professional.bio}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Seção "Portfolio Real" (Galeria) */}
      <section id="galeria" className="py-32 px-4 sm:px-6 lg:px-8 bg-[#0a0a0a]">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-20">
            <p className="text-[#D4AF37] text-xs sm:text-sm font-semibold tracking-[0.3em] uppercase mb-4">
              Nosso Trabalho
            </p>
            <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold">
              Portfolio <span className="text-[#D4AF37]">Real</span>
            </h2>
          </div>

          {/* Masonry Grid */}
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
            {portfolioImages.map((image, index) => (
              <div 
                key={index} 
                className="break-inside-avoid group relative overflow-hidden rounded-lg cursor-pointer"
              >
                <img 
                  src={image} 
                  alt={`Portfolio ${index + 1}`}
                  className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-500 
                              flex items-center justify-center">
                  <Instagram className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 
                                      transition-opacity duration-500 transform group-hover:scale-110" />
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-16">
            <p className="text-gray-400 text-sm">
              Siga-nos no Instagram <span className="text-[#D4AF37] font-semibold">@elitebarbearia</span> para mais
            </p>
          </div>
        </div>
      </section>

      {/* Seção de Serviços */}
      <section id="servicos" className="py-32 px-4 sm:px-6 lg:px-8 bg-black">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-20">
            <p className="text-[#D4AF37] text-xs sm:text-sm font-semibold tracking-[0.3em] uppercase mb-4">
              Nossos Serviços
            </p>
            <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
              Experiências <span className="text-[#D4AF37]">Premium</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Cada serviço é uma jornada de cuidado e transformação
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {services.map((service) => (
              <div 
                key={service.id}
                className="group relative p-8 bg-white/5 backdrop-blur-sm rounded-lg border border-gray-800
                         hover:border-[#D4AF37] hover:bg-white/10 transition-all duration-500
                         hover:shadow-[0_0_40px_rgba(212,175,55,0.2)]"
              >
                <div className="flex flex-col h-full">
                  <Scissors className="w-10 h-10 text-[#D4AF37] mb-6 group-hover:scale-110 transition-transform duration-300" />
                  
                  <h3 className="font-serif text-2xl sm:text-3xl font-bold mb-3 group-hover:text-[#D4AF37] transition-colors">
                    {service.name}
                  </h3>
                  
                  <p className="text-gray-400 mb-6 flex-1 leading-relaxed">
                    {service.description}
                  </p>
                  
                  <div className="flex items-center justify-between pt-6 border-t border-gray-800">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Clock className="w-4 h-4" />
                      {service.duration}
                    </div>
                    <span className="text-[#D4AF37] font-bold text-2xl">{service.price}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-16">
            <button
              onClick={() => setShowBooking(true)}
              className="group px-10 py-5 bg-[#D4AF37] text-black font-bold text-lg rounded-sm
                       hover:bg-[#c4a137] transition-all duration-300 hover:shadow-[0_0_30px_rgba(212,175,55,0.5)]
                       border-2 border-[#D4AF37] hover:scale-105 tracking-wider uppercase"
            >
              <span className="flex items-center gap-3">
                Agendar Agora
                <ChevronRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-4 sm:px-6 lg:px-8 bg-[#0a0a0a] border-t border-[#D4AF37]/10">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center space-y-6">
            <h3 className="font-serif text-3xl font-bold text-[#D4AF37]">ÉLITE</h3>
            <p className="text-gray-400 text-sm max-w-md mx-auto">
              Onde a tradição encontra o estilo moderno. Sua experiência premium em cuidados masculinos.
            </p>
            <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
              <span>© 2024 ÉLITE Barbearia</span>
              <span>•</span>
              <span>Todos os direitos reservados</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Modal de Agendamento */}
      {showBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[#1a1a1a]/95 backdrop-blur-xl rounded-lg border border-[#D4AF37]/20 shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 bg-[#1a1a1a]/95 backdrop-blur-xl border-b border-[#D4AF37]/20 p-6 z-10">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#D4AF37]">
                  {currentStep === 'confirmation' ? 'Confirmação' : 'Agendar Experiência'}
                </h2>
                <button
                  onClick={resetBooking}
                  className="text-gray-400 hover:text-white transition-colors text-2xl"
                >
                  ×
                </button>
              </div>
              
              {/* Progress Steps */}
              {currentStep !== 'confirmation' && (
                <div className="flex items-center gap-2 mt-6">
                  {['service', 'professional', 'datetime', 'contact'].map((step, index) => (
                    <div key={step} className="flex items-center flex-1">
                      <div className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                        ['service', 'professional', 'datetime', 'contact'].indexOf(currentStep) >= index
                          ? 'bg-[#D4AF37]'
                          : 'bg-gray-700'
                      }`}></div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-6 sm:p-8">
              {/* Step 1: Serviços */}
              {currentStep === 'service' && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                    <Scissors className="w-5 h-5 text-[#D4AF37]" />
                    Escolha seu Serviço
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {services.map((service) => (
                      <button
                        key={service.id}
                        onClick={() => handleServiceSelect(service)}
                        className="group relative p-6 bg-white/5 backdrop-blur-sm rounded-lg border border-gray-800
                                 hover:border-[#D4AF37] hover:bg-white/10 transition-all duration-300
                                 hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] text-left"
                      >
                        <div className="flex flex-col h-full">
                          <h4 className="font-semibold text-lg mb-2 group-hover:text-[#D4AF37] transition-colors">
                            {service.name}
                          </h4>
                          <p className="text-sm text-gray-400 mb-4 flex-1">{service.description}</p>
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-1 text-gray-400">
                              <Clock className="w-4 h-4" />
                              {service.duration}
                            </span>
                            <span className="text-[#D4AF37] font-semibold text-lg">{service.price}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Profissionais */}
              {currentStep === 'professional' && (
                <div className="space-y-4">
                  <button
                    onClick={() => setCurrentStep('service')}
                    className="text-gray-400 hover:text-[#D4AF37] transition-colors text-sm mb-4"
                  >
                    ← Voltar
                  </button>
                  <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                    <User className="w-5 h-5 text-[#D4AF37]" />
                    Escolha seu Profissional
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {professionals.map((professional) => (
                      <button
                        key={professional.id}
                        onClick={() => handleProfessionalSelect(professional)}
                        className="group relative p-6 bg-white/5 backdrop-blur-sm rounded-lg border border-gray-800
                                 hover:border-[#D4AF37] hover:bg-white/10 transition-all duration-300
                                 hover:shadow-[0_0_20px_rgba(212,175,55,0.3)]"
                      >
                        <div className="flex flex-col items-center text-center">
                          <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border-2 border-[#D4AF37]/50 group-hover:border-[#D4AF37] transition-colors">
                            <img src={professional.image} alt={professional.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                          </div>
                          <h4 className="font-semibold text-lg mb-1 group-hover:text-[#D4AF37] transition-colors">
                            {professional.name}
                          </h4>
                          <p className="text-sm text-[#D4AF37] mb-2">{professional.specialty}</p>
                          <p className="text-xs text-gray-400">{professional.bio}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Data e Hora */}
              {currentStep === 'datetime' && (
                <div className="space-y-6">
                  <button
                    onClick={() => setCurrentStep('professional')}
                    className="text-gray-400 hover:text-[#D4AF37] transition-colors text-sm mb-4"
                  >
                    ← Voltar
                  </button>
                  <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[#D4AF37]" />
                    Escolha Data e Horário
                  </h3>
                  
                  {/* Datas */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-400 mb-3">Data</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {availableDates.map((dateObj) => (
                        <button
                          key={dateObj.date}
                          onClick={() => setBooking({ ...booking, date: dateObj.date })}
                          className={`p-4 rounded-lg border transition-all duration-300 ${
                            booking.date === dateObj.date
                              ? 'bg-[#D4AF37] border-[#D4AF37] text-black font-semibold shadow-[0_0_20px_rgba(212,175,55,0.4)]'
                              : 'bg-white/5 border-gray-800 hover:border-[#D4AF37] hover:bg-white/10'
                          }`}
                        >
                          {dateObj.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Horários */}
                  {booking.date && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-400 mb-3">
                        Horário {loadingSlots && <span className="text-xs">(carregando...)</span>}
                      </h4>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                        {allAvailableTimes.map((time) => {
                          const isOccupied = occupiedSlots.includes(time)
                          return (
                            <button
                              key={time}
                              onClick={() => !isOccupied && handleDateTimeSelect(booking.date!, time)}
                              disabled={isOccupied}
                              className={`p-3 rounded-lg border transition-all duration-300 ${
                                isOccupied
                                  ? 'opacity-50 cursor-not-allowed bg-gray-900 border-gray-800 text-gray-600'
                                  : booking.time === time
                                  ? 'bg-[#D4AF37] border-[#D4AF37] text-black font-semibold shadow-[0_0_20px_rgba(212,175,55,0.4)]'
                                  : 'bg-white/5 border-gray-800 hover:border-[#D4AF37] hover:bg-white/10'
                              }`}
                            >
                              {time}
                            </button>
                          )
                        })}
                      </div>
                      {occupiedSlots.length > 0 && (
                        <p className="text-xs text-gray-500 mt-3">
                          * Horários em cinza já estão reservados
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Step 4: Contato */}
              {currentStep === 'contact' && (
                <div className="space-y-4">
                  <button
                    onClick={() => setCurrentStep('datetime')}
                    className="text-gray-400 hover:text-[#D4AF37] transition-colors text-sm mb-4"
                  >
                    ← Voltar
                  </button>
                  <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                    <Phone className="w-5 h-5 text-[#D4AF37]" />
                    Seus Dados
                  </h3>

                  {/* Mensagem de erro */}
                  {bookingError && (
                    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-red-400 text-sm font-semibold">Erro ao agendar</p>
                        <p className="text-red-300 text-sm">{bookingError}</p>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleContactSubmit} className="space-y-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-400 mb-2">
                        Nome Completo
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        className="w-full px-4 py-3 bg-white/5 border border-gray-800 rounded-lg
                                 focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20
                                 transition-all duration-300"
                        placeholder="Digite seu nome completo"
                      />
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-400 mb-2">
                        WhatsApp / Telefone
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        required
                        className="w-full px-4 py-3 bg-white/5 border border-gray-800 rounded-lg
                                 focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20
                                 transition-all duration-300"
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full px-8 py-4 bg-[#D4AF37] text-black font-semibold text-lg rounded-lg
                               hover:bg-[#c4a137] transition-all duration-300 hover:shadow-[0_0_30px_rgba(212,175,55,0.5)]
                               border border-[#D4AF37] hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Processando...' : 'Confirmar Experiência'}
                    </button>
                  </form>
                </div>
              )}

              {/* Step 5: Confirmação */}
              {currentStep === 'confirmation' && (
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-[#D4AF37] rounded-full flex items-center justify-center mx-auto mb-6
                                shadow-[0_0_40px_rgba(212,175,55,0.6)]">
                    <Check className="w-10 h-10 text-black" />
                  </div>
                  <h3 className="font-serif text-3xl font-bold text-[#D4AF37] mb-4">
                    Agendamento Confirmado!
                  </h3>
                  <p className="text-gray-300 mb-8">
                    Sua experiência premium foi agendada com sucesso.
                  </p>
                  
                  {/* Resumo */}
                  <div className="bg-white/5 backdrop-blur-sm rounded-lg border border-[#D4AF37]/20 p-6 text-left max-w-md mx-auto mb-8">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <span className="text-gray-400">Serviço:</span>
                        <span className="font-semibold text-right">{booking.service?.name}</span>
                      </div>
                      <div className="flex justify-between items-start">
                        <span className="text-gray-400">Profissional:</span>
                        <span className="font-semibold text-right">{booking.professional?.name}</span>
                      </div>
                      <div className="flex justify-between items-start">
                        <span className="text-gray-400">Data:</span>
                        <span className="font-semibold text-right">
                          {availableDates.find(d => d.date === booking.date)?.label}
                        </span>
                      </div>
                      <div className="flex justify-between items-start">
                        <span className="text-gray-400">Horário:</span>
                        <span className="font-semibold text-right">{booking.time}</span>
                      </div>
                      <div className="border-t border-gray-700 pt-4 flex justify-between items-start">
                        <span className="text-gray-400">Cliente:</span>
                        <span className="font-semibold text-right">{booking.name}</span>
                      </div>
                      <div className="flex justify-between items-start">
                        <span className="text-gray-400">Contato:</span>
                        <span className="font-semibold text-right">{booking.phone}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-400 mb-6">
                    Enviamos uma confirmação para seu WhatsApp.<br />
                    Aguardamos você!
                  </p>

                  <button
                    onClick={resetBooking}
                    className="px-8 py-3 bg-white/10 border border-[#D4AF37] text-[#D4AF37] font-semibold rounded-lg
                             hover:bg-[#D4AF37] hover:text-black transition-all duration-300"
                  >
                    Fechar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
