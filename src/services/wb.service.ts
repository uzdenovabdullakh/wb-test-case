import axios, { AxiosResponse, AxiosRequestConfig } from "axios";
import env from "../config/env/env.js";
import { TariffsBoxResponse, WarehousesBoxRates } from "../models/TariffsBoxResponse.js";

export async function getTariffs(date: string): Promise<WarehousesBoxRates> {
    try {
        const config: AxiosRequestConfig = {
            headers: {
                Authorization: env.API_KEY,
            },
            params: {
                date,
            },
        };
        const response: AxiosResponse<TariffsBoxResponse> = await axios.get(env.API_URL, config);
        return response.data.response.data;
    } catch (error) {
        console.error("Error fetching tariffs:", error);
        throw error;
    }
}
