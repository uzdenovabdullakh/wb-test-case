import axios, { AxiosResponse, AxiosRequestConfig } from "axios";
import env from "../config/env/env.js";
import { TariffsTypes, WarehousesBoxRates } from "../types/tariffs.types.js";

/**
 * Получает тарифы с API Wildberries на указанную дату.
 *
 * @param {string} date - Дата в формате YYYY-MM-DD, на которую требуется получить тарифы.
 * @returns {Promise<WarehousesBoxRates>} - Промис с объектом тарифов.
 */
export async function getTariffs(date: string): Promise<WarehousesBoxRates> {
    const config: AxiosRequestConfig = {
        headers: {
            Authorization: env.API_KEY,
        },
        params: {
            date,
        },
    };
    const response: AxiosResponse<TariffsTypes> = await axios.get(env.API_URL, config);
    return response.data.response.data;
}
