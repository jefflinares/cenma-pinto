import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Settings,
  LogOut,
  UserPlus,
  Lock,
  UserCog,
  AlertCircle,
  UserMinus,
  Mail,
  CheckCircle,
  type LucideIcon,
} from 'lucide-react';
import { ActivityType } from '@/lib/db/schema';
import { getActivityLogs } from '@/lib/db/queries/user';

const iconMap: Record<ActivityType, LucideIcon> = {
  [ActivityType.SIGN_UP]: UserPlus,
  [ActivityType.SIGN_IN]: UserCog,
  [ActivityType.SIGN_OUT]: LogOut,
  [ActivityType.UPDATE_PASSWORD]: Lock,
  [ActivityType.DELETE_ACCOUNT]: UserMinus,
  [ActivityType.UPDATE_ACCOUNT]: Settings,
  [ActivityType.CREATE_TEAM]: UserPlus,
  [ActivityType.REMOVE_TEAM_MEMBER]: UserMinus,
  [ActivityType.INVITE_TEAM_MEMBER]: Mail,
  [ActivityType.ACCEPT_INVITATION]: CheckCircle,
  [ActivityType.CREATE_PROVIDER]: Settings,
  [ActivityType.UPDATE_PROVIDER]: Settings,
  [ActivityType.DELETE_PROVIDER]: Settings,
  [ActivityType.CREATE_TRUCK]: Settings,
  [ActivityType.UPDATE_TRUCK]: Settings,
  [ActivityType.DELETE_TRUCK]: Settings,
  [ActivityType.UPDATE_CUSTOMER]: Settings,
  [ActivityType.DELETE_CUSTOMER]: Settings,
  [ActivityType.CREATE_PRODUCT]: Settings,
  [ActivityType.UPDATE_PRODUCT]: Settings,
  [ActivityType.DELETE_PRODUCT]: Settings,
  [ActivityType.CREATE_ORDER]: Settings,
  [ActivityType.UPDATE_ORDER]: Settings,
  [ActivityType.DELETE_ORDER]: Settings,
  [ActivityType.UPDATE_PAYMENT]: Settings,
  [ActivityType.DELETE_PAYMENT]: Settings,
  /*[ActivityType.CREATE_EXPENSE]: Settings,
  [ActivityType.CREATE_DRIVER]: Settings,
  [ActivityType.UPDATE_DRIVER]: Settings,
  [ActivityType.DELETE_DRIVER]: Settings,
  [ActivityType.CREATE_ROUTE]: Settings,
  [ActivityType.UPDATE_ROUTE]: Settings,
  [ActivityType.DELETE_ROUTE]: Settings,
  [ActivityType.CREATE_SHIPMENT]: Settings,
  [ActivityType.UPDATE_SHIPMENT]: Settings,
  [ActivityType.DELETE_SHIPMENT]: Settings,
  [ActivityType.CREATE_CUSTOMER]: Settings,
  [ActivityType.CREATE_INVOICE]: Settings,
  [ActivityType.UPDATE_INVOICE]: Settings,
  [ActivityType.DELETE_INVOICE]: Settings,
  [ActivityType.CREATE_PAYMENT]: Settings,
  [ActivityType.UPDATE_EXPENSE]: Settings,
  [ActivityType.DELETE_EXPENSE]: Settings,
  [ActivityType.CREATE_DOCUMENT]: Settings,
  [ActivityType.UPDATE_DOCUMENT]: Settings,
  [ActivityType.DELETE_DOCUMENT]: Settings,
  [ActivityType.CREATE_NOTIFICATION]: Settings,
  [ActivityType.UPDATE_NOTIFICATION]: Settings,
  [ActivityType.DELETE_NOTIFICATION]: Settings,
  [ActivityType.CREATE_ROLE]: Settings,
  [ActivityType.UPDATE_ROLE]: Settings,
  [ActivityType.DELETE_ROLE]: Settings,
  [ActivityType.CREATE_PERMISSION]: Settings,
  [ActivityType.UPDATE_PERMISSION]: Settings,
  [ActivityType.DELETE_PERMISSION]: Settings,
  */
};

function getRelativeTime(date: Date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600)
    return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return date.toLocaleDateString();
}

function formatAction(action: ActivityType): string {
  switch (action) {
    case ActivityType.SIGN_UP:
      return 'You signed up';
    case ActivityType.SIGN_IN:
      return 'You signed in';
    case ActivityType.SIGN_OUT:
      return 'You signed out';
    case ActivityType.UPDATE_PASSWORD:
      return 'You changed your password';
    case ActivityType.DELETE_ACCOUNT:
      return 'You deleted your account';
    case ActivityType.UPDATE_ACCOUNT:
      return 'You updated your account';
    case ActivityType.CREATE_TEAM:
      return 'You created a new team';
    case ActivityType.REMOVE_TEAM_MEMBER:
      return 'You removed a team member';
    case ActivityType.INVITE_TEAM_MEMBER:
      return 'You invited a team member';
    case ActivityType.ACCEPT_INVITATION:
      return 'You accepted an invitation';
    case ActivityType.CREATE_PROVIDER:
      return 'You created a new provider';
    case ActivityType.UPDATE_PROVIDER:
      return 'You updated a provider';
    case ActivityType.DELETE_PROVIDER:
      return 'You deleted a provider';
    case ActivityType.CREATE_PRODUCT:
      return 'You created a new product';
    case ActivityType.UPDATE_PRODUCT:
      return 'You updated a product';
    case ActivityType.DELETE_PRODUCT:
      return 'You deleted a product';
    default:
      return 'Unknown action occurred';
  }
}

export default async function ActivityPage() {
  const logs = await getActivityLogs();

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium text-gray-900 mb-6">
        Activity Log
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length > 0 ? (
            <ul className="space-y-4">
              {logs.map((log) => {
                const Icon = iconMap[log.action as ActivityType] || Settings;
                const formattedAction = formatAction(
                  log.action as ActivityType
                );

                return (
                  <li key={log.id} className="flex items-center space-x-4">
                    <div className="bg-orange-100 rounded-full p-2">
                      <Icon className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {formattedAction}
                        {log.ipAddress && ` from IP ${log.ipAddress}`}
                      </p>
                      <p className="text-xs text-gray-500">
                        {getRelativeTime(new Date(log.timestamp))}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-12">
              <AlertCircle className="h-12 w-12 text-orange-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No activity yet
              </h3>
              <p className="text-sm text-gray-500 max-w-sm">
                When you perform actions like signing in or updating your
                account, they'll appear here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
