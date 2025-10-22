import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { IUserAccess } from '../../../config/session-access-helper';

@Injectable()
export class SessionAccessGuard implements CanActivate {
  private readonly logger = new Logger(SessionAccessGuard.name);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Build user access object based on user subscription/access level
    const userAccess: IUserAccess = this.buildUserAccess(user);

    // Attach userAccess to request for use in controllers/services
    request.userAccess = userAccess;

    return true;
  }

  private buildUserAccess(user: any): IUserAccess {
    // If no user (guest/unauthenticated), return free-only access
    if (!user) {
      return {
        isLoggedIn: false,
        isSubscribed: false,
      };
    }

    // Build access based on user's subscription and permissions
    const subscription = user.subscription || {};
    const subscriptionType = subscription.type || 'free';
    const subscriptionStatus = subscription.status || 'inactive';
    const isActive = subscriptionStatus === 'active';

    // Determine if user is subscribed (active subscription and not free)
    const isSubscribed = isActive && subscriptionType !== 'free';

    return {
      isLoggedIn: true,
      isSubscribed,
    };
  }
}
