import path from "path";
import cron, { ScheduledTask } from "node-cron";
import { AxiosInstance } from "axios";

import { createAPI } from "#services/api.js";

import { CRON_SCHEDULE } from "./constants.js";

import { WBDataType } from "./types/wb-data.type.js";
import { google } from "googleapis";

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

            // Insert data to Google Spreadsheet
            await this.insertDataToGoogleSpreadSheet(wbData);
        } catch (error) {
            console.log(`WB Parse or Upload data error: `, error);
        }
    }

    private async parse(): Promise<WBDataType | void> {
        console.log(`${this.loggerPrefix} WB Parse task is running ...`);

        // await this.api.get(this.wbTariffsBoxUri);
    }

    private async insertDataToGoogleSpreadSheet(data: WBDataType | null) {
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

        console.log("GOOGLE AUTH: ", auth);
    }
}
