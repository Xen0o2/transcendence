import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
export declare class ApiService {
    private readonly httpService;
    constructor(httpService: HttpService);
    postToExternalApi(data: {
        code: string;
    }): Promise<AxiosResponse>;
    getFromExternalApi(token: string): Promise<AxiosResponse>;
}
