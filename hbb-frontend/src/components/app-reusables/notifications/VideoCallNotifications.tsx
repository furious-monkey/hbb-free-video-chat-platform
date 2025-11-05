// components/app-reusables/notifications/VideoCallNotifications.tsx - Notification system for video calls
import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface NotificationProps {
  type: 'bid' | 'connection' | 'earning' | 'warning' | 'info';
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  autoClose?: boolean;
  duration?: number;
}

interface VideoCallNotificationsProps {
  onBidReceived?: (bidData: any) => void;
  onConnectionIssue?: (issue: string) => void;
  onEarningUpdate?: (amount: number) => void;
}

export const VideoCallNotifications: React.FC<VideoCallNotificationsProps> = ({
  onBidReceived,
  onConnectionIssue,
  onEarningUpdate
}) => {
  const [notifications, setNotifications] = useState<NotificationProps[]>([]);

  // Custom notification function
  const showNotification = ({
    type,
    title,
    message,
    action,
    autoClose = true,
    duration = 5000
  }: NotificationProps) => {
    const id = Date.now().toString();
    
    const notification = {
      type,
      title,
      message,
      action,
      autoClose,
      duration
    };

    setNotifications(prev => [...prev, notification]);

    // Use sonner for the actual toast
    const toastContent = (
      <div className="flex items-start gap-3">
        {/* Icon based on type */}
        <div className="flex-shrink-0 mt-0.5">
          {type === 'bid' && <span className="text-lg">💰</span>}
          {type === 'connection' && <span className="text-lg">🔗</span>}
          {type === 'earning' && <span className="text-lg">💵</span>}
          {type === 'warning' && <span className="text-lg">⚠️</span>}
          {type === 'info' && <span className="text-lg">ℹ️</span>}
        </div>
        
        {/* Content */}
        <div className="flex-1">
          <h4 className="font-semibold text-sm">{title}</h4>
          <p className="text-sm opacity-90">{message}</p>
          
          {/* Action button */}
          {action && (
            <button
              onClick={action.onClick}
              className="mt-2 px-3 py-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded text-xs font-medium transition-colors"
            >
              {action.label}
            </button>
          )}
        </div>
      </div>
    );

    // Choose toast type based on notification type
    switch (type) {
      case 'bid':
        toast.success(toastContent, { duration: autoClose ? duration : Infinity });
        break;
      case 'earning':
        toast.success(toastContent, { duration: autoClose ? duration : Infinity });
        break;
      case 'warning':
        toast.warning(toastContent, { duration: autoClose ? duration : Infinity });
        break;
      case 'connection':
        toast.error(toastContent, { duration: autoClose ? duration : Infinity });
        break;
      default:
        toast.info(toastContent, { duration: autoClose ? duration : Infinity });
    }

    // Auto remove from state
    if (autoClose) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n !== notification));
      }, duration);
    }
  };

  // Predefined notification functions
  const notifyBidReceived = (bidData: { amount: number; bidderName?: string }) => {
    showNotification({
      type: 'bid',
      title: 'New Bid Received!',
      message: `${bidData.bidderName || 'Someone'} bid $${bidData.amount}`,
      action: {
        label: 'View Bids',
        onClick: () => onBidReceived?.(bidData)
      },
      duration: 8000
    });
  };

  const notifyConnectionIssue = (issue: string, severity: 'warning' | 'error' = 'warning') => {
    showNotification({
      type: severity === 'error' ? 'connection' : 'warning',
      title: 'Connection Issue',
      message: issue,
      action: {
        label: 'Retry',
        onClick: () => onConnectionIssue?.(issue)
      },
      autoClose: false
    });
  };

  const notifyEarningUpdate = (amount: number) => {
    showNotification({
      type: 'earning',
      title: 'Earnings Updated',
      message: `You earned $${amount.toFixed(2)}!`,
      duration: 3000
    });
  };

  const notifyExplorerJoined = (explorerName: string) => {
    showNotification({
      type: 'info',
      title: 'Explorer Joined',
      message: `${explorerName} joined your video call`,
      duration: 4000
    });
  };

  const notifyExplorerLeft = (explorerName: string) => {
    showNotification({
      type: 'warning',
      title: 'Explorer Left',
      message: `${explorerName} left the video call`,
      duration: 4000
    });
  };

  const notifyCallTimeWarning = (minutesRemaining: number) => {
    showNotification({
      type: 'warning',
      title: 'Time Warning',
      message: `${minutesRemaining} minute${minutesRemaining === 1 ? '' : 's'} remaining`,
      duration: 6000
    });
  };

  const notifyCallEnding = () => {
    showNotification({
      type: 'warning',
      title: 'Call Ending Soon',
      message: 'Your video call will end in 30 seconds',
      autoClose: false
    });
  };

  // Expose notification functions
  return {
    showNotification,
    notifyBidReceived,
    notifyConnectionIssue,
    notifyEarningUpdate,
    notifyExplorerJoined,
    notifyExplorerLeft,
    notifyCallTimeWarning,
    notifyCallEnding
  } as any;
};

// Hook for using video call notifications
export const useVideoCallNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationProps[]>([]);

  // Custom notification function
  const showNotification = useCallback(({
    type,
    title,
    message,
    action,
    autoClose = true,
    duration = 5000
  }: NotificationProps) => {
    const notification = {
      type,
      title,
      message,
      action,
      autoClose,
      duration
    };

    setNotifications(prev => [...prev, notification]);

    // Use sonner for the actual toast
    const toastContent = (
      <div className="flex items-start gap-3">
        {/* Icon based on type */}
        <div className="flex-shrink-0 mt-0.5">
          {type === 'bid' && <span className="text-lg">💰</span>}
          {type === 'connection' && <span className="text-lg">🔗</span>}
          {type === 'earning' && <span className="text-lg">💵</span>}
          {type === 'warning' && <span className="text-lg">⚠️</span>}
          {type === 'info' && <span className="text-lg">ℹ️</span>}
        </div>
        
        {/* Content */}
        <div className="flex-1">
          <h4 className="font-semibold text-sm">{title}</h4>
          <p className="text-sm opacity-90">{message}</p>
          
          {/* Action button */}
          {action && (
            <button
              onClick={action.onClick}
              className="mt-2 px-3 py-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded text-xs font-medium transition-colors"
            >
              {action.label}
            </button>
          )}
        </div>
      </div>
    );

    // Choose toast type based on notification type
    switch (type) {
      case 'bid':
        toast.success(toastContent, { duration: autoClose ? duration : Infinity });
        break;
      case 'earning':
        toast.success(toastContent, { duration: autoClose ? duration : Infinity });
        break;
      case 'warning':
        toast.warning(toastContent, { duration: autoClose ? duration : Infinity });
        break;
      case 'connection':
        toast.error(toastContent, { duration: autoClose ? duration : Infinity });
        break;
      default:
        toast.info(toastContent, { duration: autoClose ? duration : Infinity });
    }

    // Auto remove from state
    if (autoClose) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n !== notification));
      }, duration);
    }
  }, []);

  // Predefined notification functions
  const notifyBidReceived = useCallback((bidData: { amount: number; bidderName?: string }) => {
    showNotification({
      type: 'bid',
      title: 'New Bid Received!',
      message: `${bidData.bidderName || 'Someone'} bid ${bidData.amount}`,
      duration: 8000
    });
  }, [showNotification]);

  const notifyConnectionIssue = useCallback((issue: string, severity: 'warning' | 'error' = 'warning') => {
    showNotification({
      type: severity === 'error' ? 'connection' : 'warning',
      title: 'Connection Issue',
      message: issue,
      autoClose: false
    });
  }, [showNotification]);

  const notifyEarningUpdate = useCallback((amount: number) => {
    showNotification({
      type: 'earning',
      title: 'Earnings Updated',
      message: `You earned ${amount.toFixed(2)}!`,
      duration: 3000
    });
  }, [showNotification]);

  const notifyExplorerJoined = useCallback((explorerName: string) => {
    showNotification({
      type: 'info',
      title: 'Explorer Joined',
      message: `${explorerName} joined your video call`,
      duration: 4000
    });
  }, [showNotification]);

  const notifyExplorerLeft = useCallback((explorerName: string) => {
    showNotification({
      type: 'warning',
      title: 'Explorer Left',
      message: `${explorerName} left the video call`,
      duration: 4000
    });
  }, [showNotification]);

  const notifyCallTimeWarning = useCallback((minutesRemaining: number) => {
    showNotification({
      type: 'warning',
      title: 'Time Warning',
      message: `${minutesRemaining} minute${minutesRemaining === 1 ? '' : 's'} remaining`,
      duration: 6000
    });
  }, [showNotification]);

  const notifyCallEnding = useCallback(() => {
    showNotification({
      type: 'warning',
      title: 'Call Ending Soon',
      message: 'Your video call will end in 30 seconds',
      autoClose: false
    });
  }, [showNotification]);

  return {
    showNotification,
    notifyBidReceived,
    notifyConnectionIssue,
    notifyEarningUpdate,
    notifyExplorerJoined,
    notifyExplorerLeft,
    notifyCallTimeWarning,
    notifyCallEnding
  };
};

// Standalone notification components for specific use cases
export const BidNotification: React.FC<{
  amount: number;
  bidderName?: string;
  onAccept: () => void;
  onReject: () => void;
}> = ({ amount, bidderName, onAccept, onReject }) => {
  return (
    <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 rounded-lg shadow-lg border border-green-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-2xl">💰</div>
          <div>
            <h4 className="font-semibold">New Bid: ${amount}</h4>
            <p className="text-sm opacity-90">
              from {bidderName || 'Anonymous'}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={onReject}
            className="px-3 py-1 bg-red-500 hover:bg-red-600 rounded text-sm font-medium transition-colors"
          >
            Reject
          </button>
          <button
            onClick={onAccept}
            className="px-3 py-1 bg-white text-green-700 hover:bg-gray-100 rounded text-sm font-medium transition-colors"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
};

export const ConnectionAlert: React.FC<{
  status: 'poor' | 'disconnected' | 'reconnecting';
  onRetry?: () => void;
}> = ({ status, onRetry }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'poor':
        return {
          color: 'bg-yellow-500',
          icon: '⚠️',
          title: 'Poor Connection',
          message: 'Video quality may be affected'
        };
      case 'disconnected':
        return {
          color: 'bg-red-500',
          icon: '🚨',
          title: 'Connection Lost',
          message: 'Trying to reconnect...'
        };
      case 'reconnecting':
        return {
          color: 'bg-blue-500',
          icon: '🔄',
          title: 'Reconnecting',
          message: 'Please wait while we restore connection'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`${config.color} bg-opacity-20 border ${config.color.replace('bg-', 'border-')} border-opacity-40 text-white p-4 rounded-lg`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-xl">{config.icon}</div>
          <div>
            <h4 className="font-semibold">{config.title}</h4>
            <p className="text-sm opacity-90">{config.message}</p>
          </div>
        </div>
        
        {onRetry && status !== 'reconnecting' && (
          <button
            onClick={onRetry}
            className="px-3 py-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded text-sm font-medium transition-colors"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
};

export const EarningsNotification: React.FC<{
  amount: number;
  type: 'bid' | 'gift' | 'bonus';
}> = ({ amount, type }) => {
  const getTypeConfig = () => {
    switch (type) {
      case 'bid':
        return { icon: '💰', label: 'Bid Accepted' };
      case 'gift':
        return { icon: '🎁', label: 'Gift Received' };
      case 'bonus':
        return { icon: '🌟', label: 'Bonus Earned' };
    }
  };

  const config = getTypeConfig();

  return (
    <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-3 rounded-lg shadow-lg">
      <div className="flex items-center gap-3">
        <div className="text-xl">{config.icon}</div>
        <div>
          <h4 className="font-semibold">{config.label}</h4>
          <p className="text-lg font-bold">+${amount.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
};