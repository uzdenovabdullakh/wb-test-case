import { google } from "googleapis";
import env from "../config/env/env.js";

/**
 * Функция для загрузки данных в Google Таблицы.
 * Принимает данные и обновляет их в Google Sheets.
 * @param data - данные для выгрузки в таблицу
 */
export async function saveToGoogleSheets(data: any[]) {
    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: env.GOOGLE_CLIENT_EMAIL,
            private_key: env.GOOGLE_PRIVATE_KEY,
        },
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth }) as any;

    const spreadsheetIds = (env.GOOGLE_SPREADSHEET_IDS as string).split(",");

    const values = data.map(warehouse => [
        warehouse.boxDeliveryAndStorageExpr,
        warehouse.boxDeliveryBase,
        warehouse.boxDeliveryLiter,
        warehouse.boxStorageBase,
        warehouse.boxStorageLiter,
        warehouse.warehouseName,
        warehouse.dtNextBox,
        warehouse.dtTillMax,
    ]);

    values.unshift([
        "boxDeliveryAndStorageExpr",
        "boxDeliveryBase",
        "boxDeliveryLiter",
        "boxStorageBase",
        "boxStorageLiter",
        "warehouseName",
        "dtNextBox",
        "dtTillMax",
    ]);

    for (const spreadsheetId of spreadsheetIds) {
        try {
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: "stocks_coefs!A1",
                valueInputOption: "RAW",
                resource: { values },
            });
            console.log(`Данные успешно загружены в таблицу: ${spreadsheetId}`);
        } catch (error) {
            console.error(`Ошибка при загрузке данных в таблицу ${spreadsheetId}:`, error);
        }
    }
}