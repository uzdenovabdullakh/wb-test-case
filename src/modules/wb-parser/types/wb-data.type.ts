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
    date: string;
    dt_next_box: string;
    dt_till_max: string;
    box_delivery_and_storage_expr: string;
    box_delivery_base: string;
    box_delivery_liter: string;
    box_storage_base: string;
    box_storage_liter: string;
    warehouse_name: string;
};
