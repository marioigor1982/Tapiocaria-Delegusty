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

    // Monday through Saturday from 18:00 to 23:59
    const isWorkingDay = day !== 'Sunday';
    const isOpen = isWorkingDay && hour >= 18 && (hour < 24 || (hour === 23 && minute <= 59));

    let nextOpenText = 'Abre às 18';
    if (day === 'Sunday') {
      nextOpenText = 'Abre amanhã às 18';
    } else {
      nextOpenText = 'Abre às 18';
    }

    return {
      isOpen,
      statusText: isOpen ? 'Aberto' : 'Fechado',
      hoursText: 'Segunda à Sábado das 18h às 23:59h (Domingo fechado)',
      shortHoursText: 'Seg a Sáb: 18h - 23:59h',
      nextOpenText,
    };
  } catch (err) {
    console.error('Erro ao verificar horário de funcionamento:', err);
    return {
      isOpen: false,
      statusText: 'Fechado',
      hoursText: 'Segunda à Sábado das 18h às 23:59h (Domingo fechado)',
      shortHoursText: 'Seg a Sáb: 18h - 23:59h',
      nextOpenText: 'Abre às 18',
    };
  }
};
