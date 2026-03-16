import { Injectable } from '@nestjs/common';

@Injectable()
export class LicenseCheckService {
  isValidEELicense(licenseKey: string): boolean {
    void licenseKey;
    return true;
  }
}
