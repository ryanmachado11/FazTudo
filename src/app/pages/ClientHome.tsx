import { Link } from 'react-router-dom';
import { useState, useRef } from 'react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { 
  Search, Zap, Droplet, Box, Star, MapPin, Clock, ShieldCheck, MessageCircle, Wrench, AlertCircle, 
  Sparkles, Wind, Shield, Truck, Construction, Flame, Layers, Maximize2, Armchair, Tv, Wifi, Waves, 
  Bug, LayoutGrid, Paintbrush, Hammer, TreePine, ChevronLeft, ChevronRight, X, Filter, Flame as PopularIcon
} from 'lucide-react';
import { professionals } from '../lib/mockData';
import { serviceCategories, ServiceCategory } from '../lib/categoriesData';

// Map iconName strings to Lucide Icon Components
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Zap,
  Droplet,
  Paintbrush,
  Box,
  Wrench,
  TreePine,
  Hammer,
  Wind,
  ShieldCheck,
  Sparkles,
  Maximize2,
  Armchair,
  Tv,
  Flame,
  Wifi,
  Layers,
  Truck,
  Shield,
  Waves,
  Construction,
  Bug,
  LayoutGrid,
};

const popularSearches = ['Pintor', 'Eletricista', 'Vazamento', 'Ar-Condicionado', 'Montador', 'Fechadura'];

export default function ClientHome() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Find subcategory suggestions matching current search query
  const matchingSubcategories = serviceCategories.flatMap(cat => 
    cat.subcategories.filter(sub => sub.toLowerCase().includes(searchTerm.toLowerCase()) && searchTerm.trim().length > 1)
  ).slice(0, 5);

  // Filter professionals
  const filteredProfessionals = professionals.filter((prof) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
                          prof.name.toLowerCase().includes(term) ||
                          prof.category.toLowerCase().includes(term) ||
                          prof.specialties.some(s => s.toLowerCase().includes(term)) ||
                          prof.description.toLowerCase().includes(term);

    const matchesCategory = !selectedCategory || 
                            prof.category.toLowerCase().includes(selectedCategory.name.toLowerCase()) ||
                            selectedCategory.name.toLowerCase().includes(prof.category.toLowerCase()) ||
                            selectedCategory.subcategories.some(sub => 
                              prof.category.toLowerCase().includes(sub.toLowerCase()) ||
                              prof.specialties.some(s => s.toLowerCase().includes(sub.toLowerCase()))
                            );

    const matchesSubcategory = !selectedSubcategory ||
                               prof.specialties.some(s => s.toLowerCase().includes(selectedSubcategory.toLowerCase())) ||
                               prof.category.toLowerCase().includes(selectedSubcategory.toLowerCase());

    return matchesSearch && matchesCategory && matchesSubcategory;
  });

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedCategory(null);
    setSelectedSubcategory(null);
  };

  const hasActiveFilters = searchTerm !== '' || selectedCategory !== null || selectedSubcategory !== null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <Wrench className="h-7 w-7 text-secondary" />
              <span className="text-xl font-bold text-foreground">FazTudo+</span>
            </Link>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className="font-medium">
                <MessageCircle className="h-5 w-5 mr-1.5" />
                <span className="hidden sm:inline">Mensagens</span>
              </Button>
              <Avatar className="h-9 w-9 cursor-pointer border border-border">
                <AvatarFallback className="bg-secondary text-secondary-foreground font-semibold">MC</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title & Headline */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-1.5 tracking-tight">
            Encontre o profissional ideal
          </h1>
          <p className="text-muted-foreground text-sm">
            Profissionais verificados, capacitados e avaliados perto de você
          </p>
        </div>

        {/* Dynamic Search Container */}
        <div className="bg-card border border-border/80 shadow-md rounded-2xl p-4 sm:p-5 mb-6 relative">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Main Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="O que você precisa hoje? (ex: Pintor, Ar-condicionado, Vazamento...)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                className="pl-11 pr-10 h-12 text-sm bg-input-background border-border rounded-xl focus-visible:ring-2 focus-visible:ring-secondary font-medium transition-all"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground bg-muted/60 p-1 rounded-full hover:bg-muted transition-colors cursor-pointer border-0"
                  title="Limpar pesquisa"
                >
                  <X className="h-4 w-4" />
                </button>
              )}

              {/* Search Suggestions Dropdown */}
              {isSearchFocused && matchingSubcategories.length > 0 && (
                <div className="absolute left-0 right-0 top-14 bg-card border border-border rounded-xl shadow-xl z-30 overflow-hidden py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Subcategorias sugeridas
                  </div>
                  {matchingSubcategories.map((sub) => (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => {
                        setSearchTerm(sub);
                        setIsSearchFocused(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-secondary/10 flex items-center gap-2 cursor-pointer transition-colors text-foreground"
                    >
                      <Search className="h-3.5 w-3.5 text-secondary" />
                      <span>{sub}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Emergency Service Action */}
            <Link to="/urgente" className="shrink-0">
              <Button 
                size="lg" 
                variant="secondary" 
                className="w-full md:w-auto h-12 px-6 font-semibold shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 rounded-xl"
              >
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                </span>
                <AlertCircle className="h-5 w-5" />
                <span>Atendimento Urgente</span>
              </Button>
            </Link>
          </div>

          {/* Quick Popular Search Tags */}
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground overflow-x-auto scrollbar-none">
            <span className="font-semibold shrink-0 text-foreground/80 flex items-center gap-1">
              <PopularIcon className="h-3.5 w-3.5 text-amber-500" />
              Buscas populares:
            </span>
            <div className="flex gap-1.5">
              {popularSearches.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSearchTerm(tag)}
                  className={`px-2.5 py-1 rounded-full border transition-all cursor-pointer whitespace-nowrap text-xs font-medium ${
                    searchTerm.toLowerCase() === tag.toLowerCase()
                      ? 'bg-secondary text-secondary-foreground border-secondary font-semibold'
                      : 'bg-muted/40 hover:bg-muted border-border text-foreground'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Enhanced Category Bar */}
        <div className="mb-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-secondary" />
              <h2 className="text-base font-semibold text-foreground">Categorias de Serviços</h2>
              <Badge variant="outline" className="text-xs font-normal">
                {serviceCategories.length} disponíveis
              </Badge>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-xs font-medium text-destructive hover:underline flex items-center gap-1 bg-transparent border-0 cursor-pointer p-0"
              >
                <X className="h-3.5 w-3.5" />
                Limpar todos os filtros
              </button>
            )}
          </div>

          {/* Category Carousel Container */}
          <div className="relative group">
            {/* Scroll Left Button */}
            <button
              type="button"
              onClick={() => handleScroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 h-9 w-9 rounded-full bg-card shadow-md border border-border flex items-center justify-center text-foreground hover:bg-muted transition-all opacity-90 group-hover:opacity-100 cursor-pointer"
              title="Rolar para esquerda"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {/* Scroll Right Button */}
            <button
              type="button"
              onClick={() => handleScroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 h-9 w-9 rounded-full bg-card shadow-md border border-border flex items-center justify-center text-foreground hover:bg-muted transition-all opacity-90 group-hover:opacity-100 cursor-pointer"
              title="Rolar para direita"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* Scrollable Container */}
            <div
              ref={scrollContainerRef}
              className="flex gap-2.5 overflow-x-auto scrollbar-none py-1 px-1 scroll-smooth"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {/* "Todos os Serviços" Pill */}
              <Button
                variant={selectedCategory === null ? 'secondary' : 'outline'}
                onClick={() => {
                  setSelectedCategory(null);
                  setSelectedSubcategory(null);
                }}
                className={`whitespace-nowrap shrink-0 h-10 px-4 rounded-xl text-sm font-semibold transition-all ${
                  selectedCategory === null 
                    ? 'shadow-sm border-secondary' 
                    : 'bg-card hover:bg-muted/60 border-border text-foreground'
                }`}
              >
                Todos os Serviços
              </Button>

              {/* Dynamic Category Pills with Icons */}
              {serviceCategories.map((cat) => {
                const IconComp = iconMap[cat.iconName] || Wrench;
                const isSelected = selectedCategory?.id === cat.id;

                return (
                  <Button
                    key={cat.id}
                    variant={isSelected ? 'secondary' : 'outline'}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedCategory(null);
                        setSelectedSubcategory(null);
                      } else {
                        setSelectedCategory(cat);
                        setSelectedSubcategory(null);
                      }
                    }}
                    className={`whitespace-nowrap shrink-0 h-10 px-4 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                      isSelected
                        ? 'shadow-md border-secondary font-bold scale-[1.02]'
                        : 'bg-card hover:bg-muted/60 border-border text-foreground hover:border-secondary/50'
                    }`}
                  >
                    <IconComp className={`h-4 w-4 ${isSelected ? 'text-secondary-foreground' : 'text-secondary'}`} />
                    <span>{cat.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected ? 'bg-secondary-foreground/20 text-secondary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                      {cat.subcategories.length}
                    </span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Subcategories Secondary Bar (Renders when a Main Category is Selected) */}
          {selectedCategory && (
            <div className="bg-secondary/5 border border-secondary/20 rounded-xl p-3 animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-secondary"></span>
                  Subcategorias de <strong className="text-secondary">{selectedCategory.name}</strong>:
                </span>
                {selectedSubcategory && (
                  <button
                    type="button"
                    onClick={() => setSelectedSubcategory(null)}
                    className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer underline bg-transparent border-0"
                  >
                    Ver todas de {selectedCategory.name}
                  </button>
                )}
              </div>

              <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
                <button
                  type="button"
                  onClick={() => setSelectedSubcategory(null)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                    selectedSubcategory === null
                      ? 'bg-secondary text-secondary-foreground font-semibold shadow-xs'
                      : 'bg-card hover:bg-muted border border-border text-foreground'
                  }`}
                >
                  Todas de {selectedCategory.name}
                </button>
                {selectedCategory.subcategories.map((sub) => {
                  const isSubSelected = selectedSubcategory === sub;
                  return (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => setSelectedSubcategory(isSubSelected ? null : sub)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                        isSubSelected
                          ? 'bg-secondary text-secondary-foreground font-bold shadow-xs'
                          : 'bg-card hover:bg-muted border border-border text-foreground hover:border-secondary/40'
                      }`}
                    >
                      {sub}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Professionals Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">
              {filteredProfessionals.length} {filteredProfessionals.length === 1 ? 'profissional encontrado' : 'profissionais disponíveis'}
            </h2>
            {(searchTerm || selectedCategory || selectedSubcategory) && (
              <span className="text-xs text-muted-foreground">
                Exibindo resultados filtrados
              </span>
            )}
          </div>

          {filteredProfessionals.length === 0 ? (
            <Card className="p-12 text-center border-dashed border-2">
              <div className="bg-muted/50 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">Nenhum profissional encontrado</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Tente ajustar sua busca ou limpar os filtros para ver mais resultados.
              </p>
              <Button variant="secondary" onClick={clearAllFilters}>
                Limpar Filtros
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredProfessionals.map((prof) => (
                <Card key={prof.id} className="p-6 hover:shadow-lg transition-all duration-200 border-border/80 hover:border-secondary/40">
                  <div className="flex flex-col sm:flex-row gap-6">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <Avatar className="h-20 w-20 border-2 border-secondary/20">
                        <AvatarFallback className="bg-secondary/20 text-secondary text-lg font-bold">
                          {prof.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    {/* Info */}
                    <div className="flex-1 space-y-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-xl font-semibold text-foreground">{prof.name}</h3>
                          {prof.verified && (
                            <Badge className="bg-success/10 text-success border-success/20">
                              <ShieldCheck className="h-3 w-3 mr-1" />
                              Verificado
                            </Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground text-sm font-medium">{prof.category}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                          <span className="font-semibold">{prof.rating}</span>
                          <span className="text-muted-foreground">({prof.reviews} avaliações)</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          {prof.distance}
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {prof.responseTime}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {prof.specialties.map((spec, idx) => (
                          <Badge 
                            key={idx} 
                            variant="secondary" 
                            className={`text-xs ${
                              selectedSubcategory && spec.toLowerCase().includes(selectedSubcategory.toLowerCase())
                                ? 'bg-secondary text-secondary-foreground font-semibold'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {spec}
                          </Badge>
                        ))}
                      </div>

                      <p className="text-sm font-semibold text-foreground">{prof.price}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex sm:flex-col gap-2 sm:justify-center">
                      <Link to={`/prestador/${prof.id}`} className="flex-1 sm:flex-none">
                        <Button variant="secondary" className="w-full font-semibold">
                          Ver Perfil
                        </Button>
                      </Link>
                      <Link to={`/chat/${prof.id}`} className="flex-1 sm:flex-none">
                        <Button variant="outline" className="w-full">
                          <MessageCircle className="h-4 w-4 mr-1.5" />
                          Conversar
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
