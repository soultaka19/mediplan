import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

/** Thèmes visuels disponibles (cf. design-system §1.2bis). */
export type Theme = 'light' | 'dark';

/** Clé de persistance du thème choisi par l'utilisateur. */
const STORAGE_KEY = 'mediplan.theme';
/** Attribut posé sur `<html>` quand le thème sombre est actif. */
const DARK_ATTRIBUTE = 'data-theme';
const DARK_VALUE = 'dark';

/**
 * Gère le thème clair/sombre de l'application.
 *
 * - Signal `theme` en lecture seule (`'light' | 'dark'`).
 * - Persistance dans `localStorage` (clé dédiée), cohérente avec l'accès
 *   centralisé au stockage navigateur (cf. `TokenStorage`).
 * - Applique/retire l'attribut `data-theme="dark"` sur `document.documentElement` ;
 *   tout le restyle passe par les tokens `--mp-color-*` (aucun markup à changer).
 * - Initialisation : valeur stockée si présente, sinon préférence système
 *   (`prefers-color-scheme: dark`).
 *
 * Application cliente uniquement (pas de SSR) : l'accès au DOM/storage est direct.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);

  private readonly themeState = signal<Theme>('light');
  /** Thème courant (lecture seule). */
  readonly theme = this.themeState.asReadonly();

  constructor() {
    this.set(this.resolveInitialTheme());
  }

  /** Bascule entre clair et sombre. */
  toggle(): void {
    this.set(this.themeState() === 'dark' ? 'light' : 'dark');
  }

  /** Applique un thème explicite, le persiste et met à jour le DOM. */
  set(theme: Theme): void {
    this.themeState.set(theme);
    this.applyToDocument(theme);
    this.persist(theme);
  }

  /** Détermine le thème initial : stockage, sinon préférence système. */
  private resolveInitialTheme(): Theme {
    const stored = this.readStored();
    if (stored) {
      return stored;
    }
    return this.prefersDark() ? 'dark' : 'light';
  }

  /** Lit le thème persisté (valeur invalide ignorée). */
  private readStored(): Theme | null {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'dark' || value === 'light' ? value : null;
  }

  /** Persiste le thème choisi. */
  private persist(theme: Theme): void {
    localStorage.setItem(STORAGE_KEY, theme);
  }

  /** Pose ou retire l'attribut `data-theme` sur `<html>`. */
  private applyToDocument(theme: Theme): void {
    const root = this.document.documentElement;
    if (theme === 'dark') {
      root.setAttribute(DARK_ATTRIBUTE, DARK_VALUE);
    } else {
      root.removeAttribute(DARK_ATTRIBUTE);
    }
  }

  /** Préférence système (sombre) — sûr si `matchMedia` est indisponible. */
  private prefersDark(): boolean {
    return this.document.defaultView?.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  }
}
