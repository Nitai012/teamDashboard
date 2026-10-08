import { type NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppConfig } from './config/app-config.js';

/** HTTP pipeline shared by the server entry point and the e2e tests. */
export function configureApp(app: NestExpressApplication): void {
  const config = app.get(AppConfig);

  if (config.trustProxy) app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.setGlobalPrefix('api');
  app.use(
    helmet({
      contentSecurityPolicy: {
        // Upgrading requests to HTTPS would break a deployment served over plain HTTP.
        directives: { upgradeInsecureRequests: config.cookieSecure ? [] : null },
      },
    }),
  );
  app.use(cookieParser(config.sessionSecret));
  app.useBodyParser('json', { limit: '5mb' });
  app.enableShutdownHooks();
}
