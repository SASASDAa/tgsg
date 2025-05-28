
import { SOUND_FILES, MUSIC_FILES, SFX_BUTTON_CLICK } from '../constants';

class SoundService {
  private audioCache: Map<string, HTMLAudioElement>;
  private currentMusic: { name: string; element: HTMLAudioElement } | null;
  private isMuted: boolean;
  private globalVolume: number; // 0.0 to 1.0

  constructor() {
    this.audioCache = new Map();
    this.currentMusic = null;
    this.isMuted = false; // Will be updated by init
    this.globalVolume = 0.7; // Default, will be updated by init
    this.preloadCommonSounds();
  }

  public init(initialMuteState: boolean, initialVolume: number): void {
    this.isMuted = initialMuteState;
    this.globalVolume = initialVolume;
    console.log(`SoundService initialized: Muted=${this.isMuted}, Volume=${this.globalVolume}`);
    if (this.currentMusic) {
      this.currentMusic.element.muted = this.isMuted;
      this.currentMusic.element.volume = this.globalVolume * (parseFloat(this.currentMusic.element.dataset.customVolume || "1"));
    }
  }

  private preloadSound(name: string, path: string): void {
    if (!this.audioCache.has(name)) {
      const audio = new Audio(path);
      audio.preload = 'auto';
      this.audioCache.set(name, audio);
    }
  }
  
  private preloadCommonSounds(): void {
     this.preloadSound(SFX_BUTTON_CLICK, SOUND_FILES[SFX_BUTTON_CLICK]);
  }

  public setMute(muted: boolean): void {
    this.isMuted = muted;
    if (this.currentMusic) {
      this.currentMusic.element.muted = this.isMuted;
      if (!this.isMuted && this.currentMusic.element.paused) {
         this.currentMusic.element.play().catch(e => console.warn("Audio play failed after unmute:", e.message));
      }
    }
    console.log(`SoundService: Mute state set to ${this.isMuted}`);
  }

  public setVolume(volume: number): void {
    this.globalVolume = Math.max(0, Math.min(1, volume));
    if (this.currentMusic) {
      this.currentMusic.element.volume = this.globalVolume * (parseFloat(this.currentMusic.element.dataset.customVolume || "1"));
    }
    console.log(`SoundService: Global volume set to ${this.globalVolume}`);
  }

  public playSound(soundName: string, customVolumeFactor?: number): void {
    const playDespiteMute = customVolumeFactor === -1;
    if (this.isMuted && !playDespiteMute) return;

    const path = SOUND_FILES[soundName];
    if (!path) {
      console.warn(`Sound not found in SOUND_FILES: ${soundName}`);
      return;
    }
    
    let audio = this.audioCache.get(soundName);
    if (!audio) {
      audio = new Audio(path);
      this.audioCache.set(soundName, audio);
    }
    
    let sfxVolumeMultiplier = 1.0;
    if (customVolumeFactor !== undefined && customVolumeFactor !== -1) {
        sfxVolumeMultiplier = customVolumeFactor;
    }
    // For customVolumeFactor === -1 (playDespiteMute), sfxVolumeMultiplier remains 1.0.
    // This means it plays at globalVolume if playDespiteMute is true.
    // For other customVolumeFactors, it's scaled by globalVolume.
    // If no customVolumeFactor, it's scaled by 1.0 (i.e. plays at globalVolume).
    
    audio.volume = this.globalVolume * sfxVolumeMultiplier;
    audio.volume = Math.max(0, Math.min(1, audio.volume)); // Clamp final volume

    audio.muted = this.isMuted && !playDespiteMute;
    audio.currentTime = 0; 

    audio.play().catch(e => console.warn(`Error playing sound ${soundName}:`, e.message));
  }

  public playMusic(musicName: string, loop: boolean = true, musicSpecificVolumeFactor: number = 0.5): void {
    const path = MUSIC_FILES[musicName];
    if (!path) {
      console.warn(`Music not found in MUSIC_FILES: ${musicName}`);
      return;
    }

    if (this.currentMusic && this.currentMusic.name === musicName) {
      if(!this.isMuted && this.currentMusic.element.paused) {
        this.currentMusic.element.play().catch(e => console.warn(`Error re-playing music ${musicName}:`, e.message));
      }
      return; 
    }

    this.stopMusic(); 

    let audio = this.audioCache.get(musicName);
    if (!audio) {
      audio = new Audio(path);
      audio.preload = 'auto'; 
      this.audioCache.set(musicName, audio);
    }
    
    audio.loop = loop;
    audio.volume = this.globalVolume * musicSpecificVolumeFactor; 
    audio.dataset.customVolume = musicSpecificVolumeFactor.toString(); 
    audio.muted = this.isMuted;

    this.currentMusic = { name: musicName, element: audio };

    if (!this.isMuted) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => console.warn(`Error playing music ${musicName}:`, e.message));
      }
    }
  }

  public stopMusic(): void {
    if (this.currentMusic) {
      this.currentMusic.element.pause();
      this.currentMusic.element.currentTime = 0; 
      this.currentMusic = null;
    }
  }
  
  public getCurrentMusicName(): string | null {
    return this.currentMusic ? this.currentMusic.name : null;
  }
}

const soundService = new SoundService();
export default soundService;
