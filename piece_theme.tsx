  const theme = useMemo(() => {
    switch (modalType) {
      case 'sale':
        return {
          color: 'teal',
          badge: 'Satış',
          typeLabel: 'Gelir Belgesi',
          bg: 'bg-emerald-500/10',
          text: 'text-emerald-400',
          border: 'border-emerald-500/20',
          hover: 'hover:bg-emerald-600',
          btnBg: 'bg-emerald-500',
          focusRing: 'focus:border-emerald-500/50 focus:ring-emerald-500/20',
          accentColor: '#10b981'
        };
      case 'purchase':
        return {
          color: 'rose',
          badge: 'Alış',
          typeLabel: 'Gider Belgesi',
          bg: 'bg-rose-500/10',
          text: 'text-rose-400',
          border: 'border-rose-500/20',
          hover: 'hover:bg-rose-600',
          btnBg: 'bg-rose-500',
          focusRing: 'focus:border-rose-500/50 focus:ring-rose-500/20',
          accentColor: '#f43f5e'
        };
      case 'sale_return':
        return {
          color: 'amber',
          badge: 'Satış İade',
          typeLabel: 'Giriş/İade Belgesi',
          bg: 'bg-amber-500/10',
          text: 'text-amber-400',
          border: 'border-amber-500/20',
          hover: 'hover:bg-amber-600',
          btnBg: 'bg-amber-500',
          focusRing: 'focus:border-amber-500/50 focus:ring-amber-500/20',
          accentColor: '#f59e0b'
        };
      case 'purchase_return':
        return {
          color: 'cyan',
          badge: 'Alış İade',
          typeLabel: 'Çıkış/İade Belgesi',
          bg: 'bg-cyan-500/10',
          text: 'text-cyan-400',
          border: 'border-cyan-500/20',
          hover: 'hover:bg-cyan-600',
          btnBg: 'bg-cyan-500',
          focusRing: 'focus:border-cyan-500/50 focus:ring-cyan-500/20',
          accentColor: '#06b6d4'
        };
      case 'collection':
        return {
          color: 'teal',
          badge: 'Tahsilat',
          typeLabel: 'Kasa Girişi',
          bg: 'bg-teal-500/10',
          text: 'text-teal-400',
          border: 'border-teal-500/20',
          hover: 'hover:bg-teal-600',
          btnBg: 'bg-teal-500',
          focusRing: 'focus:border-teal-500/50 focus:ring-teal-500/20',
          accentColor: '#14b8a6'
        };
      case 'payment':
        return {
          color: 'rose',
          badge: 'Ödeme',
          typeLabel: 'Kasa Çıkışı',
          bg: 'bg-rose-500/10',
          text: 'text-rose-400',
          border: 'border-rose-500/20',
          hover: 'hover:bg-rose-600',
          btnBg: 'bg-rose-500',
          focusRing: 'focus:border-rose-500/50 focus:ring-rose-500/20',
          accentColor: '#f43f5e'
        };
      default:
        return {
          color: 'teal',
          badge: 'İşlem',
          typeLabel: 'Belge',
          bg: 'bg-white/5',
          text: 'text-white',
          border: 'border-white/10',
          hover: 'hover:bg-white/10',
          btnBg: 'bg-white',
          focusRing: 'focus:border-white/30',
          accentColor: '#ffffff'
        };
    }
  }, [modalType]);
