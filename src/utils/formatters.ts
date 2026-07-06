export const formatCurrency = (val: number, cur: string = 'TRY') => {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: cur }).format(val);
};

export const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('tr-TR', { 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric' 
  }).format(date);
};
