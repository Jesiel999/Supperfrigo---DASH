
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideZonelessChangeDetection,
} from '@angular/core';

import {
  provideRouter,
  withComponentInputBinding,
  withViewTransitions,
} from '@angular/router';

import {
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';

import { ThemeService } from './shared/config/theme.service';
import { routes } from './app.routes';
import { jwtInterceptor } from './auth/interceptors/jwt.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),

    provideAppInitializer(() => { inject(ThemeService); }),

    provideRouter(
      routes,
      withComponentInputBinding(),
      withViewTransitions(),
    ),

    provideHttpClient(
      withInterceptors([jwtInterceptor]),
    ),
  ],
};
