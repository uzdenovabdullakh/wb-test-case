import { getTariffs } from "../services/wb.service.js";
import { saveTariffs } from "../services/tariffs.service.js";

/**
 * Фоновая задача для обновления тарифов в базе данных.
 *
 * 1. Получает текущую дату.
 * 2. Запрашивает тарифы с API Wildberries.
 * 3. Если тарифы успешно получены, сохраняет их в базе данных.
 * 4. В случае ошибки логирует её в консоль.
 *
 * @returns {Promise<void>} - Функция асинхронная, но ничего не возвращает.
 */
export async function updateTariffsJob() {
    try{
        const currentDate = new Date().toISOString().split("T")[0];

        const tariffs = await getTariffs(currentDate);
        if (!tariffs) {
            console.warn(`Не удалось получить тарифы за ${currentDate}`);
            return;
        }

        await saveTariffs(tariffs, currentDate);
        console.log(`Тарифы за ${currentDate} успешно обновлены`);
    } catch (error) {
        console.error("Ошибка при обновлении тарифов:", error);
    }
}