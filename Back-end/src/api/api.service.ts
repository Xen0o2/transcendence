import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import axios, { AxiosResponse } from 'axios';

const BASE_URL = "https://api.intra.42.fr"

@Injectable()
export class ApiService {
  constructor(private readonly httpService: HttpService) {}

  postToExternalApi(data: { code: string }): Promise<AxiosResponse> {
    const url = `${BASE_URL}/oauth/token` +
    `?grant_type=authorization_code` +
    `&client_id=${process.env.CLIENT_ID}` +
    `&client_secret=${process.env.CLIENT_SECRET}` + 
    `&code=${data.code}` + 
    `&redirect_uri=${process.env.FRONTEND_URL}:${process.env.FRONTEND_PORT}`;
    return axios.post(url)
  }

  getFromExternalApi(token: string): Promise<AxiosResponse> {
    const url = `${BASE_URL}/v2/me`;
    return axios.get(url, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
  }
}
