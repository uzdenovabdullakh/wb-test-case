import path from "path";
import cron, { ScheduledTask } from "node-cron";
import * as google from "googleapis";
import { AxiosInstance, AxiosResponse } from "axios";

import { createAPI } from "#services/api.js";

import {
    CRON_SCHEDULE,
    GOOGLE_SPREADSHEET_DATA_CHUNK_SIZE,
} from "./constants.js";

import { WBAdaptedDataType, WBDataType } from "./types/wb-data.type.js";
import { formatDate } from "#utils/date.js";
import { WBTariffsParserRepository } from "./wb-tariffs-parser.repository.js";
import { getGoogleColumnLetterByNum, splitToChunks } from "#utils/common.js";
export class WBTariffsParser {
    private readonly loggerPrefix = "[WBParser]";
    private readonly apiBaseUrl =
        "https://common-api.wildberries.ru/api/v1/tariffs/";
    private readonly wbTariffsBoxUri = "box";
    private readonly apiKey = process.env.WB_API_KEY as string;

    private readonly wbTariffsParserRepository: WBTariffsParserRepository;
    private syncTask: ScheduledTask | null = null;
    private api: AxiosInstance;

    constructor() {
        this.api = createAPI(this.apiBaseUrl, this.apiKey);
        this.wbTariffsParserRepository = new WBTariffsParserRepository();
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
            // Fetch data from WB
            const wbData = await this.parse();

            if (!wbData) {
                console.log(`No data has been received from WB`);

                return;
            }

            // Save tariffs to database
            const savedTariffs =
                await this.wbTariffsParserRepository.saveTariffs(wbData);

            if (!savedTariffs || savedTariffs.length <= 0) {
                return;
            }

            // Insert data to Google Spreadsheet
            await this.insertDataToGoogleSpreadSheet(savedTariffs);
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

    private async insertDataToGoogleSpreadSheet(
        adaptedData: WBAdaptedDataType[],
    ) {
        const spreadsheetIds =
            await this.wbTariffsParserRepository.getSpreadsheetIds();

        if (!spreadsheetIds || spreadsheetIds.length <= 0) {
            console.error(
                "Can`t find any Spreadsheet IDs in properly database table",
            );

            return;
        }

        console.log(
            `Found ${spreadsheetIds.length} Google Spreadsheet ids to insert in`,
        );

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

        const googleSheetColumnsCount = adaptedData.length;
        const googleSheetLastColumnLetter = getGoogleColumnLetterByNum(
            googleSheetColumnsCount,
        );

        const tableHeader = [
            [
                "date",
                "dt_next_box",
                "dt_till_max",
                "box_delivery_and_storage_expr",
                "box_delivery_base",
                "box_delivery_liter",
                "box_storage_base",
                "box_storage_liter",
                "warehouse_name",
            ],
        ];

        // Insert data
        for (const spreadsheetId of spreadsheetIds) {
            // insert header
            await sheets.spreadsheets.values.update(
                {
                    spreadsheetId,
                    range: `${serviceSheetName}!A1:${googleSheetLastColumnLetter}${googleSheetColumnsCount}`,
                    valueInputOption: "RAW",
                    requestBody: {
                        values: tableHeader,
                    },
                },
                {},
            );

            // Sort by Coefs
            const sortedData = adaptedData.sort((a, b) => {
                return (
                    parseInt(a.box_delivery_and_storage_expr) -
                    parseInt(b.box_delivery_and_storage_expr)
                );
            });

            // insert table body
            const chunkedTariffs = splitToChunks(
                sortedData as [],
                GOOGLE_SPREADSHEET_DATA_CHUNK_SIZE,
            );

            let uploadedRowsSize = 0;

            for (let i = 0; i < chunkedTariffs.length; i++) {
                const chunk = chunkedTariffs[i];
                const rangeStart = `!A${i + 2}`;
                const rangeEnd = `${googleSheetColumnsCount}${i + chunk.length}`;
                const range = `${serviceSheetName}${rangeStart}:${rangeEnd}`;
                const mappedChunk = chunk.map((row: WBAdaptedDataType) => [
                    row.date,
                    row.dt_next_box,
                    row.dt_till_max,
                    row.box_delivery_and_storage_expr,
                    row.box_delivery_base,
                    row.box_delivery_liter,
                    row.box_storage_base,
                    row.box_storage_liter,
                    row.warehouse_name,
                ]);

                await sheets.spreadsheets.values.update(
                    {
                        spreadsheetId,
                        range,
                        valueInputOption: "RAW",
                        requestBody: {
                            values: mappedChunk,
                        },
                    },
                    {},
                );

                uploadedRowsSize += chunk.length;

                console.log(
                    `[Google Spreadsheet] [${spreadsheetId}](${serviceSheetName}) uploaded rows: ${uploadedRowsSize}/${sortedData.length}`,
                );
            }
        }
    }
}
