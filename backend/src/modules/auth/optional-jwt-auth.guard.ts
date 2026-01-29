import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err, user, info) {
    // If there is an error (e.g., invalid token) or no user, 
    // simply return null or undefined, do NOT throw an exception.
    // This allows the route handler to proceed even if unauthenticated.
    if (err || !user) {
      return null;
    }
    return user;
  }
}
