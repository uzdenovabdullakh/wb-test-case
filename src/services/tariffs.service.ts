import knex from "../postgres/knex.js";
import { WarehousesBoxRates } from "../models/TariffsBoxResponse.js";

/**
 * Сохраняем тарифы в базу данных для заданной даты.
 * Если тарифы на текущий день уже существуют, они будут обновлены, иначе будут вставлены новые записи.
 * @param tariffsData - объект с тарифами для сегодняшнего дня
 * @param date - дата для фильтрации тарифов
 */
export async function saveTariffs(tariffsData: WarehousesBoxRates, date: string): Promise<void> {
    const { dtNextBox, dtTillMax, warehouseList } = tariffsData;

    const parseNumeric = (value: string | number | null | undefined): number | null => {
        if (value == null || value === "-" || value === "") return null;
        const parsedValue = parseFloat(value.toString().replace(',', '.'));
        return isNaN(parsedValue) ? null : parsedValue;
    };

    const parseDate = (value: string | null): string | null => {
        return value && value.trim() !== "" ? value : null;
    };


    if (warehouseList) {
        for (const warehouse of warehouseList) {
            const { warehouseName } = warehouse;

            const existingRecord = await knex("spreadsheets")
                .where({ warehouseName, currentDay: date })
                .first();

            const boxDeliveryBase = parseNumeric(warehouse.boxDeliveryBase);
            const boxDeliveryLiter = parseNumeric(warehouse.boxDeliveryLiter);
            const boxStorageBase = parseNumeric(warehouse.boxStorageBase);
            const boxStorageLiter = parseNumeric(warehouse.boxStorageLiter);

            if (existingRecord) {
                await knex("spreadsheets")
                    .where({ warehouseName, currentDay: date })
                    .update({
                        boxDeliveryAndStorageExpr: warehouse.boxDeliveryAndStorageExpr,
                        boxDeliveryBase,
                        boxDeliveryLiter,
                        boxStorageBase,
                        boxStorageLiter,
                        warehouseName: warehouse.warehouseName,
                        dtNextBox: parseDate(dtNextBox),
                        dtTillMax: parseDate(dtTillMax),
                    });
            } else {
                await knex("spreadsheets").insert({
                    boxDeliveryAndStorageExpr: warehouse.boxDeliveryAndStorageExpr,
                    boxDeliveryBase,
                    boxDeliveryLiter,
                    boxStorageBase,
                    boxStorageLiter,
                    warehouseName: warehouse.warehouseName,
                    dtNextBox: parseDate(dtNextBox),
                    dtTillMax: parseDate(dtTillMax),
                    currentDay: date,
                });
            }
        }
    }
}

/**
 * Экспортируем тарифы из базы данных за конкретный день.
 * Возвращаем все записи, где currentDay совпадает с переданной датой.
 * @param date - дата для фильтрации тарифов
 * @returns Массив тарифов для указанного дня
 */
export async function exportTariffs(date: string): Promise<any[]> {
    const tariffs = await knex("spreadsheets")
        .where({ currentDay: date })
        .orderByRaw('CAST("boxDeliveryAndStorageExpr" AS DECIMAL) ASC');

    return tariffs;
}