import { exportTariffs } from "../services/tariffs.service.js";
import { saveToGoogleSheets } from "../services/googleSheets.service.js";

/**
 * Фоновая задача для экспорта тарифов в Google Sheets.
 *
 * 1. Получает текущую дату.
 * 2. Загружает тарифы из базы данных.
 * 3. Если тарифы есть, экспортирует их в Google Sheets.
 * 4. Если тарифов нет, выводит сообщение в лог.
 * 5. В случае ошибки логирует её в консоль.
 *
 * @returns {Promise<void>} - Функция асинхронная, но ничего не возвращает.
 */
export async function exportToGoogleSheetsJob() {
    try {
        const currentDate = new Date().toISOString().split("T")[0];

        const tariffs = await exportTariffs(currentDate);

        if (tariffs.length > 0) {
            await saveToGoogleSheets(tariffs);
            console.log(`Тарифы за ${currentDate} успешно экспортированы в Google Sheets.`);
        } else {
            console.log(`Нет тарифов на ${currentDate}, экспорт не требуется.`);
        }
    } catch (error) {
        console.error("Ошибка при экспорте тарифов в Google Sheets:", error);
    }
}