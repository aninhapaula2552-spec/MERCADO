import { getMessagingInstance } from './firebase';
import { getToken } from 'firebase/messaging';
import { PantryNotificationSettings } from './types';

export function getNotificationTime(settings: PantryNotificationSettings): string {
  if (settings.timeSlot === 'custom' && settings.customTime) {
    return settings.customTime;
  }
  switch (settings.timeSlot) {
    case 'morning': return '08:00';
    case 'afternoon': return '14:00';
    case 'evening': return '19:00';
    default: return '08:00';
  }
}

export function getScheduledText(settings: PantryNotificationSettings): string {
  const time = getNotificationTime(settings);
  const freq = settings.routine.frequency;
  if (freq === 'specific_date') {
    const d = settings.routine.specificDate;
    if (!d) return `Data não definida às ${time}`;
    const [year, month, day] = d.split('-');
    return `${day}/${month}/${year} às ${time}`;
  }
  if (freq === 'daily') {
    return `Todos os dias às ${time}`;
  }
  if (freq === 'weekly') {
    return `Toda semana (${settings.routine.dayDescription || 'Sábado'}) às ${time}`;
  }
  if (freq === 'biweekly') {
    return `A cada 15 dias às ${time}`;
  }
  if (freq === 'monthly') {
    return `Uma vez por mês (${settings.routine.dayDescription || 'Dia 10'}) às ${time}`;
  }
  if (freq === 'weekdays') {
    return `Dias úteis (segunda a sexta) às ${time}`;
  }
  return `${settings.routine.dayDescription || 'Conforme rotina'} às ${time}`;
}

export function checkAndTriggerScheduledNotifications(settings: PantryNotificationSettings) {
  if (!settings.enabled) return;
  if (typeof window === 'undefined') return;

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const currentDateStr = `${year}-${month}-${day}`; // YYYY-MM-DD
  
  const currentHours = String(now.getHours()).padStart(2, '0');
  const currentMinutes = String(now.getMinutes()).padStart(2, '0');
  const currentTimeStr = `${currentHours}:${currentMinutes}`; // HH:MM

  const targetTime = getNotificationTime(settings);
  const freq = settings.routine.frequency;

  let shouldTrigger = false;
  let notificationTitle = 'Mercado Fresh 🛒';
  let notificationBody = 'Você tem um lembrete agendado na sua despensa/lista de compras.';

  if (freq === 'specific_date') {
    if (settings.routine.specificDate === currentDateStr && currentTimeStr === targetTime) {
      shouldTrigger = true;
      notificationTitle = 'Mercado Fresh - Lembrete Agendado 🔔';
      notificationBody = `Sua notificação programada para hoje (${day}/${month}/${year} às ${targetTime}) chegou! Verifique sua lista de compras.`;
    }
  } else if (freq === 'daily') {
    if (currentTimeStr === targetTime) {
      shouldTrigger = true;
      notificationTitle = 'Mercado Fresh - Lembrete Diário 🔔';
      notificationBody = `Resumo diário da sua despensa e lista de compras às ${targetTime}.`;
    }
  } else if (freq === 'weekdays') {
    const dayOfWeek = now.getDay(); // 1=Mon, ..., 5=Fri
    if (dayOfWeek >= 1 && dayOfWeek <= 5 && currentTimeStr === targetTime) {
      shouldTrigger = true;
      notificationTitle = 'Mercado Fresh - Lembrete de Dias Úteis 🔔';
      notificationBody = `Lembrete de rotina de compras em dia útil às ${targetTime}.`;
    }
  } else if (freq === 'weekly') {
    if (currentTimeStr === targetTime) {
      shouldTrigger = true;
      notificationTitle = 'Mercado Fresh - Lembrete Semanal 🔔';
      notificationBody = `É hora de conferir sua lista de compras e despensa! (${settings.routine.dayDescription || 'Semanal'})`;
    }
  } else {
    if (currentTimeStr === targetTime && settings.routine.routineEnabled) {
      shouldTrigger = true;
      notificationTitle = 'Mercado Fresh - Rotina de Compras 🔔';
      notificationBody = `Lembrete da sua rotina de compras: ${settings.routine.dayDescription || 'Verifique seus itens'}.`;
    }
  }

  if (shouldTrigger) {
    const triggerKey = `mercado_fresh_triggered_${currentDateStr}_${currentTimeStr}`;
    const alreadyTriggered = localStorage.getItem(triggerKey);
    if (!alreadyTriggered) {
      localStorage.setItem(triggerKey, 'true');
      sendSystemNotification(notificationTitle, notificationBody);
    }
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.warn('Este navegador/sistema não suporta notificações nativas.');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('Permissão de notificação do sistema concedida.');
      await registerServiceWorkerAndGetToken();
      return true;
    } else {
      console.warn('Permissão de notificação negada pelo usuário.');
      return false;
    }
  } catch (e) {
    console.error('Erro ao solicitar permissão de notificação:', e);
    return false;
  }
}

export async function checkNotificationPermissionStatus(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

export async function registerServiceWorkerAndGetToken(): Promise<string | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker registrado com sucesso para push notifications:', registration);

    const messaging = await getMessagingInstance();
    if (messaging) {
      const currentToken = await getToken(messaging, {
        serviceWorkerRegistration: registration
      });
      if (currentToken) {
        console.log('Token FCM do dispositivo obtido com sucesso:', currentToken);
        localStorage.setItem('mercado_fresh_fcm_token', currentToken);
        return currentToken;
      }
    }
  } catch (e) {
    console.warn('Erro ao registrar Service Worker ou gerar token FCM:', e);
  }
  return null;
}

export function sendSystemNotification(title: string, body: string, dataUrl = '/') {
  if (typeof window === 'undefined' || !('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
        navigator.serviceWorker.ready.then(registration => {
          registration.showNotification(title, {
            body,
            icon: '/icon.svg',
            badge: '/icon.svg',
            data: { url: dataUrl },
            tag: 'mercado-fresh-push-notification'
          });
        });
      } else {
        const notification = new Notification(title, {
          body,
          icon: '/icon.svg'
        });
        notification.onclick = () => {
          window.focus();
          window.location.href = dataUrl;
          notification.close();
        };
      }
    } catch (e) {
      console.warn('Erro ao disparar notificação nativa do sistema:', e);
    }
  } else {
    requestNotificationPermission().then(granted => {
      if (granted) {
        sendSystemNotification(title, body, dataUrl);
      }
    });
  }
}
