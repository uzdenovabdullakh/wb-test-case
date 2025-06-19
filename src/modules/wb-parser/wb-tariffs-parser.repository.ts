import knex from "#postgres/knex.js";

import { KNEX_BATCH_CHUNK_SIZE } from "./constants.js";

import {
    WarehouseType,
    WBAdaptedDataType,
    WBDataType,
} from "./types/wb-data.type.js";
import { SpreadsheetDataRowType } from "./types/spreadsheet.type.js";
import { formatDate } from "#utils/date.js";
import { splitToChunks } from "#utils/common.js";

export class WBTariffsParserRepository {
    public async getSpreadsheetIds(): Promise<string[] | void> {
        // Get Spreadsheet IDs
        const googleSheetRows: SpreadsheetDataRowType[] = await knex
            .select("*")
            .from("spreadsheets");
        const googleSheetIds = googleSheetRows.map((row) => row.spreadsheet_id);

        if (!googleSheetIds || googleSheetIds.length <= 0) {
            console.error(
                "Can`t find any Spreadsheet IDs in properly database table",
            );

            return;
        }

        console.log(
            `Found ${googleSheetIds.length} Google Spreadsheet ids to insert in`,
        );

        return googleSheetIds;
    }

    public async saveTariffs(data: WBDataType): Promise<void> {
        const adaptedData = this.adaptWBTariffsToDatabase(data);
        const savedData =
            await this.batchInsertTariffsIgnoreOnConflicts(adaptedData);

        const savedDataLength = savedData.length || 0;

        console.log(
            `Saved box tariffs ${savedDataLength} / ${adaptedData.length}`,
        );
    }

    public async batchInsertTariffsIgnoreOnConflicts(
        adaptedData: WBAdaptedDataType[],
    ): Promise<WBAdaptedDataType[]> {
        const chunkedData = splitToChunks(
            adaptedData as [],
            KNEX_BATCH_CHUNK_SIZE,
        );
        const insertedTariffs: WBAdaptedDataType[] = [];

        await knex.transaction(async (trx) => {
            for (const chunk of chunkedData) {
                const savedChunk = await trx<WBAdaptedDataType>(
                    "wb_tariffs_boxes",
                )
                    .insert(chunk)
                    .onConflict("date_warehouse_index")
                    .merge()
                    .returning("*");

                insertedTariffs.push(...(savedChunk as WBAdaptedDataType[]));
            }
        });

        return insertedTariffs;
    }

    public adaptWBTariffsToDatabase(data: WBDataType): WBAdaptedDataType[] {
        const today = formatDate();
        const { dtNextBox, dtTillMax, warehouseList } = data.response.data;

        const adaptedData: WBAdaptedDataType[] = warehouseList.map(
            (warehouse: WarehouseType) => {
                const {
                    boxDeliveryAndStorageExpr,
                    boxDeliveryBase,
                    boxDeliveryLiter,
                    boxStorageBase,
                    boxStorageLiter,
                    warehouseName,
                } = warehouse;

                return {
                    date: today,
                    dt_next_box: dtNextBox,
                    dt_till_max: dtTillMax,
                    box_delivery_and_storage_expr: boxDeliveryAndStorageExpr,
                    box_delivery_base: boxDeliveryBase,
                    box_delivery_liter: boxDeliveryLiter,
                    box_storage_base: boxStorageBase,
                    box_storage_liter: boxStorageLiter,
                    warehouse_name: warehouseName,
                    date_warehouse_index: `${today}|${warehouseName}`,
                };
            },
        );

        return adaptedData;
    }
}
