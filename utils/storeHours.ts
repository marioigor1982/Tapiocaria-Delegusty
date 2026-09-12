export interface StoreStatus {
  isOpen: boolean;
  statusText: 'Aberto' | 'Fechado';
  hoursText: string;
  shortHoursText: string;
  nextOpenText: string;
}

export const getStoreStatus = (): StoreStatus => {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo',
      weekday: 'long',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    }).formatToParts(new Date());

    const day = parts.find((p) => p.type === 'weekday')?.value || 'Sunday';
    const hourStr = parts.find((p) => p.type === 'hour')?.value || '0';
    const minuteStr = parts.find((p) => p.type === 'minute')?.value || '0';

    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);

    // Monday, Wednesday through Sunday from 18:00 to 23:59. Tuesday is closed.
    const isWorkingDay = day !== 'Tuesday';
    const isOpen = isWorkingDay && hour >= 18 && (hour < 24 || (hour === 23 && minute <= 59));

    let nextOpenText = 'Abre às 18h';
    if (day === 'Tuesday') {
      nextOpenText = 'Abre amanhã (quarta) às 18h';
    } else if (isOpen) {
      nextOpenText = 'Aberto agora até às 23:59h';
    } else {
      nextOpenText = 'Abre hoje às 18h';
    }

    return {
      isOpen,
      statusText: isOpen ? 'Aberto' : 'Fechado',
      hoursText: 'Segunda, Quarta à Domingo das 18h às 23:59h (Terça-feira fechado)',
      shortHoursText: 'Seg, Qua a Dom: 18h - 23:59h',
      nextOpenText,
    };
  } catch (err) {
    console.error('Erro ao verificar horário de funcionamento:', err);
    return {
      isOpen: false,
      statusText: 'Fechado',
      hoursText: 'Segunda, Quarta à Domingo das 18h às 23:59h (Terça-feira fechado)',
      shortHoursText: 'Seg, Qua a Dom: 18h - 23:59h',
      nextOpenText: 'Abre às 18h',
    };
  }
};
