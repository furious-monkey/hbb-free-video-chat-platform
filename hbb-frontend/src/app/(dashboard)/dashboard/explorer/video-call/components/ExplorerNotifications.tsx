// dashboard/explorer/components/ExplorerNotifications.tsx - Notification system for explorers
import React, { useCallback } from 'react';
import { toast } from 'sonner';

interface NotificationProps {
  type: 'bid' | 'connection' | 'cost' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  autoClose?: boolean;
  duration?: number;
}

interface ExplorerNotificationsProps {
  onBidAccepted?: (bidData: any) => void;
  onBidRejected?: (bidData: any) => void;
  onOutbid?: (bidData: any) => void;
  onConnectionIssue?: (issue: string) => void;
  onCostWarning?: (amount: number) => void;
}

export const ExplorerNotifications: React.FC<ExplorerNotificationsProps> = ({
  onBidAccepted,
  onBidRejected,
  onOutbid,
  onConnectionIssue,
  onCostWarning
}) => {
  // Custom notification function
  const showNotification = ({
    type,
    title,
    message,
    action,
    autoClose = true,
    duration = 5000
  }: NotificationProps) => {
    const toastContent = (
      <div className="flex items-start gap-3">
        {/* Icon based on type */}
        <div className="flex-shrink-0 mt-0.5">
          {type === 'bid' && <span className="text-lg">💰</span>}
          {type === 'connection' && <span className="text-lg">🔗</span>}
          {type === 'cost' && <span className="text-lg">💵</span>}
          {type === 'warning' && <span className="text-lg">⚠️</span>}
          {type === 'info' && <span className="text-lg">ℹ️</span>}
          {type === 'success' && <span className="text-lg">✅</span>}
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
      case 'success':
        toast.success(toastContent, { duration: autoClose ? duration : Infinity });
        break;
      case 'cost':
      case 'warning':
        toast.warning(toastContent, { duration: autoClose ? duration : Infinity });
        break;
      case 'connection':
        toast.error(toastContent, { duration: autoClose ? duration : Infinity });
        break;
      default:
        toast.info(toastContent, { duration: autoClose ? duration : Infinity });
    }
  };

  // Predefined notification functions
  const notifyBidAccepted = (bidData: { amount: number; influencerName?: string; sessionId: string }) => {
    showNotification({
      type: 'success',
      title: 'Bid Accepted!',
      message: `Your $${bidData.amount} bid was accepted by ${bidData.influencerName || 'the influencer'}`,
      action: {
        label: 'Join Call',
        onClick: () => onBidAccepted?.(bidData)
      },
      duration: 8000
    });
  };

  const notifyBidRejected = (bidData: { amount: number; influencerName?: string; reason?: string }) => {
    showNotification({
      type: 'warning',
      title: 'Bid Rejected',
      message: bidData.reason || `Your $${bidData.amount} bid was rejected`,
      action: {
        label: 'Try Again',
        onClick: () => onBidRejected?.(bidData)
      },
      duration: 6000
    });
  };

  const notifyOutbid = (bidData: { 
    previousAmount: number; 
    newAmount: number; 
    newBidderName?: string;
    sessionId: string;
  }) => {
    showNotification({
      type: 'warning',
      title: 'You Were Outbid!',
      message: `Your $${bidData.previousAmount} bid was beaten by a $${bidData.newAmount} bid`,
      action: {
        label: 'Bid Higher',
        onClick: () => onOutbid?.(bidData)
      },
      duration: 10000
    });
  };

  const notifyConnectionIssue = (issue: string, severity: 'warning' | 'error' = 'warning') => {
    showNotification({
      type: severity === 'error' ? 'connection' : 'warning',
      title: 'Connection Issue',
      message: issue,
      action: {
        label: 'Check Connection',
        onClick: () => onConnectionIssue?.(issue)
      },
      autoClose: false
    });
  };

  const notifyCostWarning = (amount: number, timeSpent: number) => {
    showNotification({
      type: 'cost',
      title: 'Cost Alert',
      message: `You've spent $${amount.toFixed(2)} in ${Math.floor(timeSpent / 60)} minutes`,
      duration: 8000
    });
  };

  const notifyInfluencerJoined = (influencerName: string) => {
    showNotification({
      type: 'success',
      title: 'Call Started',
      message: `${influencerName} joined the video call`,
      duration: 4000
    });
  };

  const notifyInfluencerLeft = (influencerName: string) => {
    showNotification({
      type: 'warning',
      title: 'Call Ended',
      message: `${influencerName} left the video call`,
      duration: 4000
    });
  };

  const notifyCallTimeWarning = (minutesRemaining: number) => {
    showNotification({
      type: 'warning',
      title: 'Time Warning',
      message: `${minutesRemaining} minute${minutesRemaining === 1 ? '' : 's'} of call time remaining`,
      duration: 6000
    });
  };

  const notifyBalanceWarning = (remainingBalance: number) => {
    showNotification({
      type: 'cost',
      title: 'Low Balance',
      message: `You have $${remainingBalance.toFixed(2)} remaining in your account`,
      action: {
        label: 'Add Funds',
        onClick: () => {
          // Navigate to payment page
          window.location.href = '/dashboard/explorer/billing';
        }
      },
      autoClose: false
    });
  };

  const notifyGiftSent = (giftData: { type: string; amount: number; recipientName: string }) => {
    showNotification({
      type: 'success',
      title: 'Gift Sent!',
      message: `${giftData.type} ($${giftData.amount}) sent to ${giftData.recipientName}`,
      duration: 4000
    });
  };

  // Expose notification functions
  return {
    showNotification,
    notifyBidAccepted,
    notifyBidRejected,
    notifyOutbid,
    notifyConnectionIssue,
    notifyCostWarning,
    notifyInfluencerJoined,
    notifyInfluencerLeft,
    notifyCallTimeWarning,
    notifyBalanceWarning,
    notifyGiftSent
  } as any;
};

// Hook for using explorer notifications
export const useExplorerNotifications = () => {
  // Custom notification function
  const showNotification = useCallback(({
    type,
    title,
    message,
    action,
    autoClose = true,
    duration = 5000
  }: NotificationProps) => {
    const toastContent = (
      <div className="flex items-start gap-3">
        {/* Icon based on type */}
        <div className="flex-shrink-0 mt-0.5">
          {type === 'bid' && <span className="text-lg">💰</span>}
          {type === 'connection' && <span className="text-lg">🔗</span>}
          {type === 'cost' && <span className="text-lg">💵</span>}
          {type === 'warning' && <span className="text-lg">⚠️</span>}
          {type === 'info' && <span className="text-lg">ℹ️</span>}
          {type === 'success' && <span className="text-lg">✅</span>}
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
      case 'success':
        toast.success(toastContent, { duration: autoClose ? duration : Infinity });
        break;
      case 'cost':
      case 'warning':
        toast.warning(toastContent, { duration: autoClose ? duration : Infinity });
        break;
      case 'connection':
        toast.error(toastContent, { duration: autoClose ? duration : Infinity });
        break;
      default:
        toast.info(toastContent, { duration: autoClose ? duration : Infinity });
    }
  }, []);

  // Predefined notification functions
  const notifyBidAccepted = useCallback((bidData: { amount: number; influencerName?: string }) => {
    showNotification({
      type: 'success',
      title: 'Bid Accepted!',
      message: `Your $${bidData.amount} bid was accepted!`,
      duration: 8000
    });
  }, [showNotification]);

  const notifyBidRejected = useCallback((bidData: { amount: number; reason?: string }) => {
    showNotification({
      type: 'warning',
      title: 'Bid Rejected',
      message: bidData.reason || `Your $${bidData.amount} bid was rejected`,
      duration: 6000
    });
  }, [showNotification]);

  const notifyOutbid = useCallback((bidData: { previousAmount: number; newAmount: number }) => {
    showNotification({
      type: 'warning',
      title: 'You Were Outbid!',
      message: `Your $${bidData.previousAmount} bid was beaten by $${bidData.newAmount}`,
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

  const notifyCostWarning = useCallback((amount: number) => {
    showNotification({
      type: 'cost',
      title: 'Cost Alert',
      message: `You've spent $${amount.toFixed(2)} on this call`,
      duration: 8000
    });
  }, [showNotification]);

  const notifyInfluencerJoined = useCallback((influencerName: string) => {
    showNotification({
      type: 'success',
      title: 'Call Started',
      message: `${influencerName} joined the video call`,
      duration: 4000
    });
  }, [showNotification]);

  const notifyInfluencerLeft = useCallback((influencerName: string) => {
    showNotification({
      type: 'warning',
      title: 'Call Ended',
      message: `${influencerName} left the video call`,
      duration: 4000
    });
  }, [showNotification]);

  const notifyGiftSent = useCallback((giftData: { type: string; amount: number }) => {
    showNotification({
      type: 'success',
      title: 'Gift Sent!',
      message: `${giftData.type} ($${giftData.amount}) sent successfully`,
      duration: 4000
    });
  }, [showNotification]);

  return {
    showNotification,
    notifyBidAccepted,
    notifyBidRejected,
    notifyOutbid,
    notifyConnectionIssue,
    notifyCostWarning,
    notifyInfluencerJoined,
    notifyInfluencerLeft,
    notifyGiftSent
  };
};

// Standalone notification components for specific use cases
export const BidStatusNotification: React.FC<{
  status: 'pending' | 'accepted' | 'rejected';
  amount: number;
  influencerName: string;
  onAction?: () => void;
}> = ({ status, amount, influencerName, onAction }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'pending':
        return {
          color: 'bg-yellow-500',
          icon: '⏳',
          title: 'Bid Pending',
          message: `Waiting for ${influencerName} to respond to your $${amount} bid`
        };
      case 'accepted':
        return {
          color: 'bg-green-500',
          icon: '✅',
          title: 'Bid Accepted!',
          message: `${influencerName} accepted your $${amount} bid`
        };
      case 'rejected':
        return {
          color: 'bg-red-500',
          icon: '❌',
          title: 'Bid Rejected',
          message: `${influencerName} rejected your $${amount} bid`
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
        
        {onAction && status !== 'pending' && (
          <button
            onClick={onAction}
            className="px-3 py-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded text-sm font-medium transition-colors"
          >
            {status === 'accepted' ? 'Join Call' : 'Try Again'}
          </button>
        )}
      </div>
    </div>
  );
};

export const CostAlert: React.FC<{
  currentCost: number;
  estimatedTotal: number;
  timeRemaining?: number;
}> = ({ currentCost, estimatedTotal, timeRemaining }) => {
  return (
    <div className="bg-orange-500 bg-opacity-20 border border-orange-500 border-opacity-40 text-white p-3 rounded-lg">
      <div className="flex items-center gap-3">
        <div className="text-xl">💰</div>
        <div>
          <h4 className="font-semibold">Cost Update</h4>
          <p className="text-sm opacity-90">
            Current: ${currentCost.toFixed(2)} | Estimated Total: ${estimatedTotal.toFixed(2)}
            {timeRemaining && ` | ${timeRemaining} min remaining`}
          </p>
        </div>
      </div>
    </div>
  );
};