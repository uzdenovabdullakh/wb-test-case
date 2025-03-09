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

export interface TariffsBoxResponse {
    response: {
        data: WarehousesBoxRates; // Объект с данными тарифов
    };
}
