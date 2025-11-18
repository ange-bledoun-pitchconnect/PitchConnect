import { BadgeCheck, AlertCircle, Clock } from 'lucide-react';

interface RoleRequestBadgeProps {
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  role: string;
}

export function RoleRequestBadge({ status, role }: RoleRequestBadgeProps) {
  let label = '';
  let color = '';
  let icon = null;

  if (status === 'PENDING') {
    label = `Pending ${role} Approval`;
    color = 'bg-yellow-100 text-yellow-800 border-yellow-300';
    icon = <Clock className="w-4 h-4 inline mr-1" />;
  } else if (status === 'APPROVED') {
    label = `${role} Approved`;
    color = 'bg-green-100 text-green-800 border-green-300';
    icon = <BadgeCheck className="w-4 h-4 inline mr-1" />;
  } else if (status === 'REJECTED') {
    label = `${role} Rejected`;
    color = 'bg-red-100 text-red-700 border-red-400';
    icon = <AlertCircle className="w-4 h-4 inline mr-1" />;
  }

  return (
    <span className={`inline-flex items-center px-2 py-1 border rounded-full font-semibold text-xs ${color} mr-2`}>
      {icon}
      {label}
    </span>
  );
}
