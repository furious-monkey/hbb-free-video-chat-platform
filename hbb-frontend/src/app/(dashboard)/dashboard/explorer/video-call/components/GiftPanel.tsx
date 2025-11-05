// dashboard/explorer/video-call/components/GiftPanel.tsx - Enhanced gift functionality
"use client";
import { useState, useEffect } from "react";

interface GiftType {
  id: string;
  name: string;
  icon: string;
  price: number;
  description?: string;
}

interface GiftPanelProps {
  giftTypes?: GiftType[];
  selectedGift?: string | null;
  onSelectGift?: (giftId: string) => void;
  onSendGift?: (giftId: string) => void;
  isLoading?: boolean;
}

export default function GiftPanel({
  giftTypes = [],
  selectedGift = null,
  onSelectGift = () => {},
  onSendGift = () => {},
  isLoading = false
}: GiftPanelProps) {
  const [internalSelectedGift, setInternalSelectedGift] = useState<string | null>(null);
  const [sendingGift, setSendingGift] = useState<string | null>(null);
  const [recentlySent, setRecentlySent] = useState<Set<string>>(new Set());

  // Use internal state if no external state provided
  const currentSelectedGift = selectedGift !== null ? selectedGift : internalSelectedGift;
  const setCurrentSelectedGift = selectedGift !== null ? onSelectGift : setInternalSelectedGift;

  // Default gift items with better pricing and icons
  const defaultGiftItems: GiftType[] = [
    {
      id: "heart",
      name: "Heart",
      price: 1,
      icon: "❤️",
      description: "Show some love"
    },
    {
      id: "star",
      name: "Star",
      price: 5,
      icon: "⭐",
      description: "You're a star!"
    },
    {
      id: "diamond",
      name: "Diamond",
      price: 10,
      icon: "💎",
      description: "Premium gift"
    },
    {
      id: "crown",
      name: "Crown",
      price: 25,
      icon: "👑",
      description: "Royal treatment"
    },
    {
      id: "rocket",
      name: "Rocket",
      price: 50,
      icon: "🚀",
      description: "To the moon!"
    },
    {
      id: "trophy",
      name: "Trophy",
      price: 100,
      icon: "🏆",
      description: "Ultimate gift"
    }
  ];

  // Use real gift types if available, otherwise fallback to defaults
  const displayGiftTypes = giftTypes.length > 0 ? giftTypes : defaultGiftItems;

  // Clear recently sent gifts after some time
  useEffect(() => {
    if (recentlySent.size > 0) {
      const timer = setTimeout(() => {
        setRecentlySent(new Set());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [recentlySent]);

  const handleGiftSelect = (giftId: string) => {
    if (isLoading || sendingGift === giftId) return;
   
    if (currentSelectedGift === giftId) {
      // If already selected, send the gift
      handleSendGift(giftId);
    } else {
      // Otherwise, just select it
      setCurrentSelectedGift(giftId);
    }
  };

  const handleSendGift = async (giftId: string) => {
    if (isLoading || sendingGift === giftId) return;
   
    const gift = displayGiftTypes.find(g => g.id === giftId);
    if (gift) {
      console.log('🎁 Sending gift:', gift);
      setSendingGift(giftId);
      
      try {
        await onSendGift(giftId);
        // Add to recently sent
        setRecentlySent(prev => {
          const newSet = new Set(prev);
          newSet.add(giftId);
          return newSet;
        });
        
        // Clear selection after sending
        setCurrentSelectedGift('');
      } catch (error) {
        console.error('Failed to send gift:', error);
      } finally {
        setSendingGift(null);
      }
    }
  };

  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
  };

  const getGiftItemClass = (giftId: string) => {
    const isSelected = currentSelectedGift === giftId;
    const isSending = sendingGift === giftId;
    const wasSent = recentlySent.has(giftId);
    
    let baseClass = "grid grid-cols-2 cursor-pointer transition-all duration-200 py-2 lg:py-3 px-2 lg:px-4 rounded-[8px]";
    
    if (isSending) {
      return `${baseClass} border border-blue-400 bg-blue-100 scale-95 opacity-75`;
    }
    
    if (wasSent) {
      return `${baseClass} border border-green-400 bg-green-100 animate-pulse`;
    }
    
    if (isSelected) {
      return `${baseClass} border border-[rgba(255,255,255,0.6)] bg-[#6AB5D2] shadow-md transform scale-105`;
    }
    
    if (isLoading && !isSelected) {
      return `${baseClass} bg-transparent border border-[rgba(255,255,255,0.4)] opacity-50 cursor-not-allowed`;
    }
    
    return `${baseClass} bg-transparent border border-[rgba(255,255,255,0.4)] hover:border-[rgba(255,255,255,0.6)] hover:bg-[rgba(255,255,255,0.1)] hover:scale-102`;
  };

  return (
    <div className="absolute bottom-[10.5rem] lg:bottom-32 2xl:bottom-40 lg:left-1/2 transform lg:-translate-x-1/2 w-[90%] lg:w-[80%] max-w-5xl bg-[#E688A3] rounded-[8px] lg:rounded-[16px] shadow-lg px-2 lg:px-4 py-3 gap-2 lg:gap-3 ml-[5%] lg:ml-0">
      
      {/* Header */}
      <div className="text-center mb-3">
        <h3 className="text-white font-semibold text-sm lg:text-base">Send a Gift 🎁</h3>
        {currentSelectedGift && (
          <p className="text-white opacity-90 text-xs mt-1">
            Tap again to send your selected gift
          </p>
        )}
      </div>

      {/* Gift Grid */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 lg:gap-3 justify-between">
        {displayGiftTypes.map((item) => {
          const isSending = sendingGift === item.id;
          const wasSent = recentlySent.has(item.id);
          
          return (
            <div
              key={item.id}
              onClick={() => handleGiftSelect(item.id)}
              className={getGiftItemClass(item.id)}
              title={item.description || item.name}
            >
              {/* Icon */}
              <div className="w-full flex justify-center items-center">
                <div className="relative">
                  {/* Use emoji or fallback to image */}
                  {item.icon.startsWith('http') || item.icon.startsWith('/') ? (
                    <img
                      src={item.icon}
                      alt={item.name}
                      className="w-auto h-12 lg:h-16 object-contain"
                      onError={(e) => {
                        e.currentTarget.src = "/icons/default-gift.svg";
                      }}
                    />
                  ) : (
                    <div className="text-3xl lg:text-4xl">{item.icon}</div>
                  )}
                  
                  {/* Loading spinner for sending gift */}
                  {isSending && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded">
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                  
                  {/* Success checkmark for recently sent */}
                  {wasSent && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Details */}
              <div className="flex items-center w-full gap-2 justify-center">
                <div className="flex flex-col items-center w-full">
                  {/* Gift Name */}
                  <p className="text-[10px] lg:text-[12px] font-medium text-center text-white leading-tight mb-1">
                    {item.name}
                  </p>

                  {/* Divider */}
                  <div className="w-full h-px bg-[rgba(255,255,255,0.4)] my-1"></div>

                  {/* Price */}
                  <p className="text-[14px] lg:text-[20px] font-semibold text-center text-white leading-tight">
                    {formatPrice(item.price)}
                  </p>

                  {/* Action indicator */}
                  {currentSelectedGift === item.id && !isSending && !wasSent && (
                    <p className="text-[8px] lg:text-[10px] text-white opacity-90 mt-1 text-center animate-pulse">
                      Tap to send
                    </p>
                  )}
                  
                  {isSending && (
                    <p className="text-[8px] lg:text-[10px] text-white opacity-90 mt-1 text-center">
                      Sending...
                    </p>
                  )}
                  
                  {wasSent && (
                    <p className="text-[8px] lg:text-[10px] text-white opacity-90 mt-1 text-center">
                      Sent! ✨
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state if no gifts available */}
      {displayGiftTypes.length === 0 && (
        <div className="col-span-full flex items-center justify-center py-8 text-white">
          <div className="text-center">
            <div className="text-2xl mb-2">🎁</div>
            <p className="text-sm opacity-75">No gifts available</p>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="col-span-full mt-2 text-center">
        <p className="text-[10px] lg:text-[12px] text-white opacity-80">
          {currentSelectedGift
            ? "Tap selected gift again to send"
            : "Tap a gift to select, tap again to send"
          }
        </p>
        
        {/* Total sent indicator */}
        {recentlySent.size > 0 && (
          <p className="text-[10px] lg:text-[12px] text-white opacity-60 mt-1">
            {recentlySent.size} gift{recentlySent.size !== 1 ? 's' : ''} sent this session ✨
          </p>
        )}
      </div>
    </div>
  );
}