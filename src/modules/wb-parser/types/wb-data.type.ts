export type WarehouseType = {
    boxDeliveryAndStorageExpr: string;
    boxDeliveryBase: string;
    boxDeliveryLiter: string;
    boxStorageBase: string;
    boxStorageLiter: string;
    warehouseName: string;
};

type DataType = {
    dtNextBox: string;
    dtTillMax: string;
    warehouseList: WarehouseType[];
};

type ResponseType = {
    data: DataType;
};

export type WBDataType = {
    response: ResponseType;
};

export type WBAdaptedDataType = {
    dtNextBox: string;
    dtTillMax: string;
} & WarehouseType;
