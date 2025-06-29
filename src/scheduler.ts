import cron from 'node-cron';
import { WbTariffService } from '#services/wbTariffService.js';
import { GoogleSheetsService } from '#services/googleSheetsService.js';
import env from '#config/env/env.js';

export function startSchedulers(): void {
    const wbService = new WbTariffService(env.WB_API_TOKEN);
    const sheetsService = new GoogleSheetsService(
        env.GOOGLE_CREDENTIALS,
        env.GOOGLE_SHEET_IDS
    );

    // Ежечасное обновление тарифов
    cron.schedule("0 * * * *", () => wbService.hourlyUpdate());

    // Ежедневное обновление таблиц в 03:00
    cron.schedule("0 3 * * *", () => sheetsService.updateAllSheets());
}