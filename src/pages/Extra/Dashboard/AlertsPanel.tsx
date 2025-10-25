import { AlertTriangle, Info, ShieldAlert } from "lucide-react";

interface Alert {
  type: string;
  message: string;
}

const alertStyles = {
  warning: {
    icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
    bg: "bg-amber-50 border-amber-200",
    text: "text-amber-800",
  },
  critical: {
    icon: <ShieldAlert className="h-5 w-5 text-red-500" />,
    bg: "bg-red-50 border-red-200",
    text: "text-red-800",
  },
  info: {
    icon: <Info className="h-5 w-5 text-blue-500" />,
    bg: "bg-blue-50 border-blue-200",
    text: "text-blue-800",
  },
};

const AlertsPanel = ({ alerts }: { alerts: Alert[] }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Smart Alerts</h3>
      <div className="space-y-3">
        {alerts && alerts.length > 0 ? (
          alerts.map((alert, index) => {
            const style =
              alertStyles[alert.type as keyof typeof alertStyles] ||
              alertStyles.info;
            return (
              <div
                key={index}
                className={`flex items-start p-3 rounded-md border ${style.bg} ${style.text}`}
              >
                <div className="flex-shrink-0 mr-3">{style.icon}</div>
                <p className="text-sm">{alert.message}</p>
              </div>
            );
          })
        ) : (
          <div className="text-center text-gray-500 py-4">
            <Info className="mx-auto h-8 w-8 text-gray-400" />
            <p className="mt-2 text-sm">No alerts at this time.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertsPanel;
