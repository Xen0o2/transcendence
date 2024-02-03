import { Controller, Post, UploadedFile, UseInterceptors, Get, Param, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';



@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}
}
