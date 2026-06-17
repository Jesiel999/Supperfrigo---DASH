import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { AppComponent } from './app/app';

bootstrapApplication(AppComponent, appConfig).catch(console.error);
registerLocaleData(localePt);