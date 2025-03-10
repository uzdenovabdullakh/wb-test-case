export interface WarehouseBoxRate {
    boxDeliveryAndStorageExpr: string; // Стоимость доставки и хранения
    boxDeliveryBase: number; // Базовая стоимость доставки
    boxDeliveryLiter: number; // Стоимость доставки за литр
    boxStorageBase: number; // Базовая стоимость хранения
    boxStorageLiter: number; // Стоимость хранения за литр
    warehouseName: string; // Название склада
}

export interface WarehousesBoxRates {
    dtNextBox: string; // Дата начала следующего тарифа
    dtTillMax: string; // Дата окончания последнего тарифа
    warehouseList: WarehouseBoxRate[] | null; // Массив тарифов для складов или null
}

export interface TariffsTypes {
    response: {
        data: WarehousesBoxRates; // Объект с данными тарифов
    };
}

export interface TariffRecord {
    id: number; // Уникальный идентификатор записи
    boxDeliveryAndStorageExpr: string | null; // Стоимость доставки и хранения (текст)
    boxDeliveryBase: number | null; // Базовая стоимость доставки
    boxDeliveryLiter: number | null; // Стоимость доставки за литр
    boxStorageBase: number | null; // Базовая стоимость хранения
    boxStorageLiter: number | null; // Стоимость хранения за литр
    warehouseName: string; // Название склада
    dtNextBox: string | null; // Дата начала следующего тарифа
    dtTillMax: string | null; // Дата окончания последнего тарифа
    currentDay: string; // Дата, на которую актуален тариф
    created_at?: string; // Дата создания записи в БД
    updated_at?: string; // Дата последнего обновления записи в БД
}
