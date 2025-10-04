import { format, formatDistance, isFuture, isPast, differenceInDays } from 'date-fns';

export function formatDate(date, formatStr = 'MMM dd, yyyy') {
  if (!date) return 'N/A';
  
  const dateObj = new Date(date);
  
  // Check if the date is valid
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }
  
  return format(dateObj, formatStr);
}

export function formatRelative(date) {
  if (!date) return 'N/A';
  
  const targetDate = new Date(date);
  
  // Check if the date is valid
  if (isNaN(targetDate.getTime())) {
    return 'Invalid Date';
  }
  
  if (isPast(targetDate)) {
    return `${formatDistance(targetDate, new Date())} ago`;
  } else {
    return `in ${formatDistance(new Date(), targetDate)}`;
  }
}

export function daysUntil(endDate) {
  if (!endDate) return 0;
  
  const targetDate = new Date(endDate);
  
  // Check if the date is valid
  if (isNaN(targetDate.getTime())) {
    return 0;
  }
  
  return differenceInDays(targetDate, new Date());
}

export function colorForDaysUntil(days) {
  if (days < 0) {
    return 'bg-red-500 text-white shadow-lg';
  } else if (days < 30) {
    return 'bg-red-500 text-white shadow-lg';
  } else if (days < 90) {
    return 'bg-orange-500 text-white shadow-lg';
  } else {
    return 'bg-green-500 text-white shadow-lg';
  }
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCurrencyCompact(amount) {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}K`;
  } else {
    return `$${amount}`;
  }
}

export function statusColor(status) {
  switch (status.toLowerCase()) {
    case 'sent':
    case 'success':
    case 'active':
      return 'bg-green-100 text-green-800 border border-green-200';
    case 'pending':
    case 'processing':
      return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
    case 'failed':
    case 'error':
    case 'expired':
      return 'bg-red-100 text-red-800 border border-red-200';
    default:
      return 'bg-slate-100 text-slate-800 border border-slate-200';
  }
}
