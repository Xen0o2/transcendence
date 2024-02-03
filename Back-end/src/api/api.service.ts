import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import axios, { AxiosResponse } from 'axios';

const BASE_URL = "https://api.intra.42.fr"
const CLIENT_ID = "u-s4t2ud-68346e25a5e2e6dfab2d06f70bc9693aa84084e271c194a8d32a84e5d2d6ab57";
const CLIENT_SECRET = "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"

@Injectable()
export class ApiService {
  constructor(private readonly httpService: HttpService) {}

  postToExternalApi(data: { code: string }): Promise<AxiosResponse> {
    const url = `${BASE_URL}/oauth/token` +
    `?grant_type=authorization_code` +
    `&client_id=${CLIENT_ID}` +
    `&client_secret=${CLIENT_SECRET}` + 
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
