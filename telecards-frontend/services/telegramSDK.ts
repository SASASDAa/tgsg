
import { TelegramUser } from '../types';

interface TelegramPopupParams {
  title?: string;
  message: string;
  buttons?: { type: 'ok' | 'close' | 'cancel' | 'destructive', text?: string, id?: string }[];
}
interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: TelegramUser;
  };
  isClosingConfirmationEnabled: boolean;
  MainButton: {
    isVisible: boolean;
    isActive: boolean;
    show: () => void;
    hide: () => void;
    setText: (text: string) => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
  };
  BackButton: {
    isVisible: boolean;
    show: () => void;
    hide: () => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
  };
  ready: () => void;
  expand: () => void;
  close: () => void;
  themeParams: Record<string, string>;
  colorScheme: 'light' | 'dark';
  sendData: (data: string) => void; 
  openLink: (url: string, options?: {try_instant_view?: boolean}) => void; // Added openLink
  showPopup: (params: TelegramPopupParams, callback?: (id?: string) => void) => void; // Added showPopup
}

const mockTelegramEnv: TelegramWebApp = {
  initData: 'mock_init_data_string_test_user_id_123',
  initDataUnsafe: {
    user: {
      id: 123456789,
      firstName: 'DarkBorn',
      lastName: 'Tester',
      username: 'darkborn_tester',
      languageCode: 'en',
    },
  },
  isClosingConfirmationEnabled: false,
  MainButton: {
    isVisible: false,
    isActive: false,
    show: () => { mockTelegramEnv.MainButton.isVisible = true; console.log('TG MainButton: show()'); },
    hide: () => { mockTelegramEnv.MainButton.isVisible = false; console.log('TG MainButton: hide()'); },
    setText: (text: string) => console.log(`TG MainButton: setText("${text}")`),
    onClick: (callback: () => void) => { console.log('TG MainButton: onClick registered'); (window as any).mockMainButtonCallback = callback; },
    offClick: () => console.log('TG MainButton: offClick'),
  },
  BackButton: {
    isVisible: false,
    show: () => { mockTelegramEnv.BackButton.isVisible = true; console.log('TG BackButton: show()'); },
    hide: () => { mockTelegramEnv.BackButton.isVisible = false; console.log('TG BackButton: hide()'); },
    onClick: (callback: () => void) => { console.log('TG BackButton: onClick registered'); (window as any).mockBackButtonCallback = callback; },
    offClick: () => console.log('TG BackButton: offClick'),
  },
  ready: () => console.log('TG WebApp: ready()'),
  expand: () => console.log('TG WebApp: expand()'),
  close: () => console.log('TG WebApp: close() called. In a real app, this would close the Mini App.'),
  themeParams: {
    bg_color: '#1a202c', 
    text_color: '#e2e8f0', 
    button_color: '#f6ad55', 
    button_text_color: '#1a202c', 
  },
  colorScheme: 'dark',
  sendData: (data: string) => { console.log('TG WebApp: sendData called with:', data); },
  openLink: (url: string) => { console.log(`TG WebApp: openLink called with URL: ${url}`);  if (url.startsWith('tg://')) { alert(`Mock Telegram: Opening internal link ${url}`); } else { window.open(url, '_blank');} },
  showPopup: (params: TelegramPopupParams, callback?: (id?: string) => void) => {
    console.log('TG WebApp: showPopup called with params:', params);
    alert(`Mock Popup: ${params.title || ""}\n${params.message}\nButtons: ${JSON.stringify(params.buttons)}`);
    if (callback && params.buttons && params.buttons.length > 0) {
      // Simulate clicking the first button if it has an ID
      callback(params.buttons[0].id); 
    } else if (callback) {
      callback();
    }
  }
};

class TelegramSDK {
  private webApp: TelegramWebApp;

  constructor() {
    this.webApp = (window as any).Telegram?.WebApp || mockTelegramEnv;
    if (!(window as any).Telegram?.WebApp) {
      console.warn('Telegram WebApp SDK not found, using mock environment. Functionality will be limited.');
    }
  }

  public ready(): void {
    this.webApp.ready();
  }

  public getUserData(): TelegramUser | null {
    return this.webApp.initDataUnsafe.user || null;
  }

  public getInitData(): string {
    return this.webApp.initData;
  }
  
  public getThemeParams(): Record<string, string> {
    return this.webApp.themeParams;
  }

  public expandApp(): void {
    this.webApp.expand();
  }

  public closeApp(): void {
    this.webApp.close();
  }
  
  public enableClosingConfirmation(): void {
    this.webApp.isClosingConfirmationEnabled = true;
  }

  public disableClosingConfirmation(): void {
    this.webApp.isClosingConfirmationEnabled = false;
  }

  public showMainButton(text: string, onClick: () => void): void {
    this.webApp.MainButton.setText(text);
    this.webApp.MainButton.onClick(onClick);
    this.webApp.MainButton.show();
  }

  public hideMainButton(): void {
    this.webApp.MainButton.hide();
  }
  
  public showBackButton(onClick: () => void): void {
    this.webApp.BackButton.onClick(onClick);
    this.webApp.BackButton.show();
  }

  public hideBackButton(): void {
    this.webApp.BackButton.hide();
  }

  public sendDataToBot(data: any): void {
    this.webApp.sendData(JSON.stringify(data));
  }

  public shareViaTelegram(text: string, gameUrl?: string): void {
    const shareParams = new URLSearchParams();
    if (gameUrl) shareParams.append('url', gameUrl); // Optional: URL to your game/bot for context
    shareParams.append('text', text);
    
    const shareUrl = `tg://share?${shareParams.toString()}`;
    
    try {
      this.webApp.openLink(shareUrl);
    } catch (e) {
      console.warn("tg://share scheme failed with openLink. Error:", e);
      this.webApp.showPopup({
          title: "Share Content",
          message: `To share, please copy this text and paste it into a Telegram chat:\n\n${text}`,
          buttons: [{ type: 'ok', text: 'OK' }]
      });
    }
  }
}

const telegramSDK = new TelegramSDK();
export default telegramSDK;
