export interface StoreStatus {
  isOpen: boolean;
  statusText: 'Aberto' | 'Fechado';
  hoursText: string;
  shortHoursText: string;
  nextOpenText: string;
  badgeOpenText: string;
  isSpecialClosedToday?: boolean;
  specialNotice?: string;
}

export const getStoreStatus = (): StoreStatus => {
  try {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo',
      weekday: 'long',
      hour: 'numeric',
      minute: 'numeric',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour12: false,
    }).formatToParts(now);

    const day = parts.find((p) => p.type === 'weekday')?.value || 'Sunday';
    const hourStr = parts.find((p) => p.type === 'hour')?.value || '0';
    const minuteStr = parts.find((p) => p.type === 'minute')?.value || '0';
    const yearStr = parts.find((p) => p.type === 'year')?.value || '2026';
    const monthStr = parts.find((p) => p.type === 'month')?.value || '10';
    const dayStr = parts.find((p) => p.type === 'day')?.value || '25';

    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);
    const dateFormatted = `${yearStr}-${monthStr}-${dayStr}`;

    // Horários regulares de funcionamento:
    // - Domingo: 17:00 às 23:59
    // - Segunda, Quarta a Sábado: 18:00 às 23:59
    // - Terça-feira: Fechado
    const isSunday = day === 'Sunday';
    const isTuesday = day === 'Tuesday';

    // =========================================================================
    // EXCEÇÃO SOLICITADA PELO PROPRIETÁRIO:
    // "Fechar a loja apenas neste domingo!" (Domingo, 25 de Outubro de 2026)
    // Nos demais domingos, o funcionamento continua normal das 17h às 23:59h.
    // =========================================================================
    const isSpecialClosedSunday = isSunday && (dateFormatted === '2026-10-25' || (now.getDay() === 0 && now.getDate() === 25 && now.getMonth() === 9));

    if (isSpecialClosedSunday) {
      return {
        isOpen: false,
        statusText: 'Fechado',
        hoursText: 'Segunda, Quarta a Sábado das 18h às 23:59h • Domingo das 17h às 23:59h (Terça fechado)',
        shortHoursText: 'Seg, Qua a Sáb: 18h - 23:59h | Dom: 17h - 23:59h',
        nextOpenText: 'Fechado excepcionalmente neste domingo (25/10) • Abre amanhã (segunda) às 18h',
        badgeOpenText: 'Fechado hoje',
        isSpecialClosedToday: true,
        specialNotice: 'Aviso: Excepcionalmente neste domingo (25/10) nossa loja estará fechada. Reabriremos amanhã, segunda-feira, às 18h com nosso cardápio completo para retirada no balcão!',
      };
    }

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
      isSpecialClosedToday: false,
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
      isSpecialClosedToday: false,
    };
  }
};
