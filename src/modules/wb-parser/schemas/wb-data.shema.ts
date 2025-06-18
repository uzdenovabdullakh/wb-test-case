import { z } from "zod";

const warehouse = z.object({
    boxDeliveryAndStorageExpr: z.string(),
    boxDeliveryBase: z.string(),
    boxDeliveryLiter: z.string(),
    boxStorageBase: z.string(),
    boxStorageLiter: z.string(),
    warehouseName: z.string(),
});

const data = z.object({
    dtNextBox: z.string().date(),
    dtTillMax: z.string().date(),
    warehouseList: z.array(warehouse),
});
const response = z.object({
    data,
});

export const wbDataSchema = z.object({
    response,
});
