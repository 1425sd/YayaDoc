import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

interface SignupAttemptWindow {
  count: number;
  resetAt: number;
}

@Injectable()
export class PublicSignupRateLimitService {
  private readonly attempts = new Map<string, SignupAttemptWindow>();
  private readonly maxAttempts = 5;
  private readonly windowMs = 15 * 60 * 1000;

  check(workspaceId: string, clientId: string) {
    const now = Date.now();
    const key = `${workspaceId}:${clientId}`;
    const attempt = this.attempts.get(key);

    if (!attempt || attempt.resetAt <= now) {
      this.attempts.set(key, {
        count: 1,
        resetAt: now + this.windowMs,
      });
      return;
    }

    if (attempt.count >= this.maxAttempts) {
      throw new HttpException(
        'Too many signup attempts. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    attempt.count += 1;
    this.attempts.set(key, attempt);
  }
}
