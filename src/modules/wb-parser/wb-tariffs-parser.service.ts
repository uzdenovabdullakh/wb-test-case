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
            const date = formatDate();
            const response: AxiosResponse<WBDataType> = await this.api.get(
                this.wbTariffsBoxUri,
                {
                    params: { date },
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
    private async getSpreadsheetIds(): Promise<string[]> {
        // Get Spreadsheet IDs
        const googleSheetRows: SpreadsheetDataRowType[] = await knex
            .select("*")
            .from("spreadsheets");
        const googleSheetIds = googleSheetRows.map((row) => row.spreadsheet_id);

        if (!googleSheetIds || googleSheetIds.length) {
            console.error(
                "Can`t find any Spreadsheet IDs in properly database table",
            );
        }

        console.log(
            `Found ${googleSheetIds.length} Google Spreadsheet ids to insert in`,
        );

        return googleSheetIds;
    }

    private async saveTariffs(data: WBDataType): Promise<void> {
        const adaptedData = this.adaptWBTariffsToDatabase(data);
        // const savedData = await knex
        //     .batchInsert("wb-tariffs-boxes", adaptedData, KNEX_BATCH_CHUNK_SIZE)
        //     .catch((error) => {
        //         console.error(
        //             `Can't batch insert box tariffs to database. Error: `,
        //             error,
        //         );
        //     });

        const savedData =
            await this.insertTariffsIgnoreOnConflicts(adaptedData);

        console.log("SAVED DATA: ", savedData);

        const savedDataLength = savedData || 0;

        console.log(
            `Saved box tariffs ${savedDataLength} / ${adaptedData.length}`,
        );
    }

    private async insertTariffsIgnoreOnConflicts(
        adaptedData: WBAdaptedDataType[],
    ): Promise<WBAdaptedDataType[]> {
        const chunkedUsers = splitToChunks(
            adaptedData as [],
            KNEX_BATCH_CHUNK_SIZE,
        );
        const insertedTariffs: WBAdaptedDataType[] = [];

        await knex.transaction(async (trx) => {
            for (const chunk of chunkedUsers) {
                const savedChunk = await trx<WBAdaptedDataType>(
                    "wb-tariffs-boxes",
                )
                    .insert(chunk)
                    .onConflict("compare-index")
                    .merge();
                insertedTariffs.push(
                    savedChunk as unknown as WBAdaptedDataType,
                );
            }
        });
        return insertedTariffs;
    }

    private adaptWBTariffsToDatabase(data: WBDataType): WBAdaptedDataType[] {
        const date = formatDate();
        const { dtNextBox, dtTillMax, warehouseList } = data.response.data;

        const adaptedData: WBAdaptedDataType[] = warehouseList.map(
            (warehouse: WarehouseType) => {
                return {
                    date,
                    dtNextBox,
                    dtTillMax,
                    ...warehouse,
                };
            },
        );

        return adaptedData;
    }
}
