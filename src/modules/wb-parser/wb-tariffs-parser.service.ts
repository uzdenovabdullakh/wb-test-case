import path from "path";
import cron, { ScheduledTask } from "node-cron";
import * as google from "googleapis";
import { AxiosInstance, AxiosResponse } from "axios";

import { createAPI } from "#services/api.js";
import knex from "#postgres/knex.js";

import { CRON_SCHEDULE, KNEX_BATCH_CHUNK_SIZE } from "./constants.js";

import {
    WarehouseType,
    WBAdaptedDataType,
    WBDataType,
} from "./types/wb-data.type.js";
import { SpreadsheetDataRowType } from "./types/spreadsheed.type.js";
import { formatDate } from "#utils/date.js";
import { splitToChunks } from "#utils/common.js";

export class WBTariffsParser {
    private readonly loggerPrefix = "[WBParser]";
    private readonly apiBaseUrl =
        "https://common-api.wildberries.ru/api/v1/tariffs/";
    private readonly wbTariffsBoxUri = "box";
    private readonly apiKey = process.env.WB_API_KEY as string;

    private syncTask: ScheduledTask | null = null;
    private api: AxiosInstance;

    constructor() {
        this.api = createAPI(this.apiBaseUrl, this.apiKey);
    }

    public async init() {
        console.log(`${this.loggerPrefix} Initialize WBParser ...`);

        this.synchronize();
    }

    private async synchronize() {
        console.log(`${this.loggerPrefix} Starting Synchronize task ...`);

        // First launch
        if (!this.syncTask) {
            await this.parseAndUpload();
        }

        if (this.syncTask) {
            this.syncTask.stop();
        }

        this.syncTask = cron.schedule(
            CRON_SCHEDULE,
            this.parseAndUpload.bind(this),
        );

        console.log(
            `${this.loggerPrefix} Synchronize task has been successfully started`,
        );
    }

    private async parseAndUpload() {
        try {
            await this.insertDataToGoogleSpreadSheet(null);

            // Fetch data from WB
            const wbData = await this.parse();

            if (!wbData) {
                console.log(`No data has been received from WB`);

                return;
            }

            // Save tariffs to database
            await this.saveTariffs(wbData);

            // Insert data to Google Spreadsheet
            // await this.insertDataToGoogleSpreadSheet(wbData);
        } catch (error) {
            console.log(`WB Parse or Upload data error: `, error);
        }
    }

    private async parse(): Promise<WBDataType | void> {
        console.log(`${this.loggerPrefix} WB Parse task is running ...`);

        try {
            const today = formatDate();
            const response: AxiosResponse<WBDataType> = await this.api.get(
                this.wbTariffsBoxUri,
                {
                    params: { date: today },
                },
            );

            if (!response?.data) {
                return;
            }

            const { data } = response;

            return data;
        } catch (error) {
            console.error(
                `Can't fetch data from ${this.apiBaseUrl}.${this.wbTariffsBoxUri}. Error: `,
                error,
            );
        }
    }

    private async insertDataToGoogleSpreadSheet(data: WBDataType | null) {
        const spreadsheetIds = await this.getSpreadsheetIds();

        // Auth in Google APIs
        const googleServiceKeysFileName = process.env
            .GOOGLE_SERVICE_KEYS_JSON as string;
        const googleServiceKeysFile = path.resolve(googleServiceKeysFileName);
        const serviceSheetName = process.env.GOOGLE_SERVICE_SHEET_NAME;

        if (!googleServiceKeysFile) {
            console.error(
                `Can't find Google Service Account Credentials file (${googleServiceKeysFileName}) in the root folder`,
            );

            return;
        }

        if (!serviceSheetName) {
            console.error(`Can't find Google Spreadsheet Name`);

            return;
        }

        console.log("Auth in Google Spreadsheet API`s ... ");

        const auth = new google.Auth.GoogleAuth({
            keyFile: googleServiceKeysFile,
            scopes: ["https://www.googleapis.com/auth/spreadsheets"],
        });
        const sheets = new google.sheets_v4.Sheets({ auth });
    }

    /*
        REPOSITORY
        TODO: Transfer all code below to original repository module
    */
    private async getSpreadsheetIds(): Promise<string[] | void> {
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

    private async saveTariffs(data: WBDataType): Promise<void> {
        const adaptedData = this.adaptWBTariffsToDatabase(data);
        const savedData =
            await this.batchInsertTariffsIgnoreOnConflicts(adaptedData);

        const savedDataLength = savedData.length || 0;

        console.log(
            `Saved box tariffs ${savedDataLength} / ${adaptedData.length}`,
        );
    }

    private async batchInsertTariffsIgnoreOnConflicts(
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

    private adaptWBTariffsToDatabase(data: WBDataType): WBAdaptedDataType[] {
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
