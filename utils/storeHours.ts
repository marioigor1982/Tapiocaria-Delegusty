export interface StoreStatus {
  isOpen: boolean;
  statusText: 'Aberto' | 'Fechado';
  hoursText: string;
  shortHoursText: string;
  nextOpenText: string;
  badgeOpenText: string;
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

    // Horários de funcionamento:
    // - Domingo: 17:00 às 23:59
    // - Segunda, Quarta a Sábado: 18:00 às 23:59
    // - Terça-feira: Fechado
    const isSunday = day === 'Sunday';
    const isTuesday = day === 'Tuesday';
    const isWorkingDay = !isTuesday;

    const openingHour = isSunday ? 17 : 18;
    const isOpen = isWorkingDay && hour >= openingHour && (hour < 24 || (hour === 23 && minute <= 59));

    let nextOpenText = isSunday ? 'Abre hoje às 17h' : 'Abre hoje às 18h';
    let badgeOpenText = isSunday ? 'Abre às 17h' : 'Abre às 18h';

    if (isOpen) {
      nextOpenText = 'Aberto agora até às 23:59h';
      badgeOpenText = 'Aberto agora';
    } else if (isTuesday) {
      nextOpenText = 'Abre amanhã (quarta) às 18h';
      badgeOpenText = 'Abre quarta 18h';
    } else if (hour >= 23 && minute > 59) {
      // Após o fechamento à noite
      if (day === 'Monday') {
        nextOpenText = 'Abre quarta-feira às 18h';
        badgeOpenText = 'Abre quarta 18h';
      } else if (day === 'Saturday') {
        nextOpenText = 'Abre amanhã (domingo) às 17h';
        badgeOpenText = 'Abre domingo 17h';
      } else {
        nextOpenText = 'Abre amanhã às 18h';
        badgeOpenText = 'Abre às 18h';
      }
    } else if (isSunday) {
      nextOpenText = hour < 17 ? 'Abre hoje às 17h' : 'Abre amanhã (segunda) às 18h';
      badgeOpenText = 'Abre às 17h';
    } else {
      nextOpenText = hour < 18 ? 'Abre hoje às 18h' : (day === 'Saturday' ? 'Abre amanhã (domingo) às 17h' : 'Abre amanhã às 18h');
      badgeOpenText = 'Abre às 18h';
    }

    return {
      isOpen,
      statusText: isOpen ? 'Aberto' : 'Fechado',
      hoursText: 'Segunda, Quarta a Sábado das 18h às 23:59h • Domingo das 17h às 23:59h (Terça-feira fechado)',
      shortHoursText: 'Seg, Qua a Sáb: 18h - 23:59h | Dom: 17h - 23:59h',
      nextOpenText,
      badgeOpenText,
    };
  } catch (err) {
    console.error('Erro ao verificar horário de funcionamento:', err);
    return {
      isOpen: false,
      statusText: 'Fechado',
      hoursText: 'Segunda, Quarta a Sábado das 18h às 23:59h • Domingo das 17h às 23:59h (Terça-feira fechado)',
      shortHoursText: 'Seg, Qua a Sáb: 18h - 23:59h | Dom: 17h - 23:59h',
      nextOpenText: 'Abre às 18h (Domingo às 17h)',
      badgeOpenText: 'Abre 17h/18h',
    };
  }
};
