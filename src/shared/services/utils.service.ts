import { ConfigService } from '@nestjs/config';
import { Injectable } from "@nestjs/common";
import * as bcrypt from "bcrypt";

@Injectable()
export class UtilsService {
    constructor(private readonly configService: ConfigService) { }
    async hashPassword(password: string): Promise<string> {
        const hash = await bcrypt.hash(password, 9);
        return hash;
    }

}