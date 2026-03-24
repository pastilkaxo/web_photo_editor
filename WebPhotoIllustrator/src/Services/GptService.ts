import { AxiosResponse } from "axios";
import $api from "../http";
import { IGptResponse } from "../models/response/GptResponse";


export default class GptService {
    static async generateText(text: string): Promise<AxiosResponse<IGptResponse>> {
        return $api.post('/generate-text', { text });
    }
}