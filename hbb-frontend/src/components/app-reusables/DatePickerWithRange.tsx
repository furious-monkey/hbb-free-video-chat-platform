"use client"

import * as React from "react"
import { format, isBefore, isAfter, isSameDay, startOfDay, endOfDay } from "date-fns"
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/src/lib/utils"
import { Button } from "@/src/components/ui/button"
import { Calendar } from "@/src/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select"

interface DatePickerWithRangeProps {
  value?: DateRange;
  onChange?: (date: DateRange | undefined) => void;
  className?: string;
}

export function DatePickerWithRange({
  className,
  value,
  onChange,
}: DatePickerWithRangeProps) {
  const [open, setOpen] = React.useState(false);
  const [tempRange, setTempRange] = React.useState<DateRange | undefined>();
  const [internalDate, setInternalDate] = React.useState<DateRange | undefined>(() => {
    const today = new Date();
    const lastYear = new Date(today);
    lastYear.setFullYear(today.getFullYear() - 1);
    return {
      from: startOfDay(lastYear),
      to: endOfDay(today),
    };
  });

  const isControlled = value !== undefined;
  const date = isControlled ? value : internalDate;

  // Reset temp range when popover opens
  React.useEffect(() => {
    if (open) {
      setTempRange(undefined);
    }
  }, [open]);

  const handleSelect = (clickedDate: Date | undefined) => {
    if (!clickedDate) return;

    const normalizedDate = startOfDay(clickedDate);
    let newRange: DateRange | undefined;

    // If we have a temporary range with only 'from', complete it
    if (tempRange?.from && !tempRange.to) {
      const fromDate = startOfDay(tempRange.from);
      
      // Ensure proper date ordering
      if (isBefore(normalizedDate, fromDate)) {
        newRange = {
          from: normalizedDate,
          to: endOfDay(fromDate),
        };
      } else if (isSameDay(normalizedDate, fromDate)) {
        newRange = {
          from: fromDate,
          to: endOfDay(fromDate),
        };
      } else {
        newRange = {
          from: fromDate,
          to: endOfDay(normalizedDate),
        };
      }

      // Update the actual date and close
      if (isControlled) {
        onChange?.(newRange);
      } else {
        setInternalDate(newRange);
        onChange?.(newRange);
      }
      
      setTempRange(undefined);
      setTimeout(() => setOpen(false), 150);
    } else {
      // Start a new selection
      setTempRange({ from: normalizedDate, to: undefined });
    }
  };

  // For display purposes, combine actual date with temp range
  const displayRange = tempRange || date;

  return (
    <div className={cn("grid gap-2 w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-between text-left font-normal",
              "bg-[#1a1a1a] hover:bg-[#2a2a2a] border-[#3a3a3a]",
              "text-white h-11 px-4 rounded-lg",
              !date && "text-gray-400"
            )}
          >
            <span className="text-sm">
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, "dd/MM/yyyy")} - {format(date.to, "dd/MM/yyyy")}
                  </>
                ) : (
                  <>
                    {format(date.from, "dd/MM/yyyy")} - Select end date
                  </>
                )
              ) : (
                "Select your stay"
              )}
            </span>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-auto p-0 bg-[#1a1a1a] border-[#3a3a3a]" 
          align="start"
        >
          <CustomCalendar
            selected={displayRange}
            onSelect={handleSelect}
            tempRange={tempRange}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

// Custom Calendar Component
interface CustomCalendarProps {
  selected?: DateRange;
  onSelect: (date: Date | undefined) => void;
  tempRange?: DateRange;
}

function CustomCalendar({ selected, onSelect, tempRange }: CustomCalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(() => {
    return selected?.from || new Date();
  });

  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

  const handleMonthChange = (month: string) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(months.indexOf(month));
    setCurrentMonth(newDate);
  };

  const handleYearChange = (year: string) => {
    const newDate = new Date(currentMonth);
    newDate.setFullYear(parseInt(year));
    setCurrentMonth(newDate);
  };

  const handlePrevMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentMonth(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentMonth(newDate);
  };

  // Use tempRange if available, otherwise use selected
  const displayRange = tempRange || selected;

  // Custom day renderer
  const renderDay = (day: Date) => {
    const normalizedDay = startOfDay(day);
    const today = startOfDay(new Date());
    const isDisabled = isAfter(normalizedDay, today);
    const isToday = isSameDay(normalizedDay, today);
    
    let isSelected = false;
    let isRangeStart = false;
    let isRangeEnd = false;
    let isInRange = false;

    if (displayRange?.from) {
      const fromDate = startOfDay(displayRange.from);
      
      if (displayRange.to) {
        const toDate = startOfDay(displayRange.to);
        isRangeStart = isSameDay(normalizedDay, fromDate);
        isRangeEnd = isSameDay(normalizedDay, toDate);
        isInRange = isAfter(normalizedDay, fromDate) && isBefore(normalizedDay, toDate);
        isSelected = isRangeStart || isRangeEnd;
      } else {
        // Only start date selected
        isSelected = isSameDay(normalizedDay, fromDate);
        isRangeStart = isSelected;
      }
    }

    const handleClick = () => {
      if (!isDisabled) {
        onSelect(day);
      }
    };

    return (
      <button
        onClick={handleClick}
        disabled={isDisabled}
        className={cn(
          "h-9 w-9 p-0 font-normal rounded-md transition-colors",
          "hover:bg-[#2a2a2a] hover:text-white",
          "focus:outline-none focus:ring-2 focus:ring-[#4a4a4a]",
          isDisabled && "text-gray-600 opacity-50 hover:bg-transparent cursor-not-allowed",
          isToday && !isSelected && "bg-[#2a2a2a] text-white font-semibold",
          isSelected && "bg-white !text-black hover:bg-gray-200 hover:!text-black",
          isInRange && !isSelected && "bg-[#2a2a2a] text-white rounded-none",
          isRangeStart && !isRangeEnd && "rounded-r-none",
          isRangeEnd && !isRangeStart && "rounded-l-none"
        )}
      >
        {format(day, "d")}
      </button>
    );
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days: React.ReactNode[] = [];
    const currentDate = new Date(startDate);

    for (let week = 0; week < 6; week++) {
      const weekDays: React.ReactNode[] = [];
      for (let day = 0; day < 7; day++) {
        const dayDate = new Date(currentDate);
        const isCurrentMonth = dayDate.getMonth() === month;
        
        if (isCurrentMonth || week < 5) {
          weekDays.push(
            <div key={dayDate.toISOString()} className={cn(!isCurrentMonth && "opacity-40")}>
              {renderDay(dayDate)}
            </div>
          );
        } else {
          weekDays.push(<div key={`empty-${week}-${day}`} className="h-9 w-9" />);
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
      days.push(
        <div key={week} className="flex w-full mt-2">
          {weekDays}
        </div>
      );
    }

    return days;
  };

  return (
    <div className="p-4 bg-[#1a1a1a] text-white rounded-lg">
      {/* Month/Year Selection Header */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePrevMonth}
          className="h-8 w-8 hover:bg-[#2a2a2a] text-white"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex gap-2">
          <Select 
            value={months[currentMonth.getMonth()]}
            onValueChange={handleMonthChange}
          >
            <SelectTrigger className="w-24 h-9 bg-[#2a2a2a] border-[#3a3a3a] text-white hover:bg-[#3a3a3a]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#2a2a2a] border-[#3a3a3a]">
              {months.map((month) => (
                <SelectItem 
                  key={month} 
                  value={month}
                  className="text-white hover:bg-[#3a3a3a] focus:bg-[#3a3a3a] focus:text-white"
                >
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select 
            value={currentMonth.getFullYear().toString()}
            onValueChange={handleYearChange}
          >
            <SelectTrigger className="w-20 h-9 bg-[#2a2a2a] border-[#3a3a3a] text-white hover:bg-[#3a3a3a]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#2a2a2a] border-[#3a3a3a]">
              {years.map((year) => (
                <SelectItem 
                  key={year} 
                  value={year.toString()}
                  className="text-white hover:bg-[#3a3a3a] focus:bg-[#3a3a3a] focus:text-white"
                >
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleNextMonth}
          className="h-8 w-8 hover:bg-[#2a2a2a] text-white"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="w-full">
        {/* Day headers */}
        <div className="flex w-full">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
            <div key={day} className="text-gray-400 text-center text-xs w-9 font-normal">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar days */}
        {generateCalendarDays()}
      </div>

      {/* Helper text */}
      {tempRange?.from && !tempRange?.to && (
        <div className="mt-3 pt-3 border-t border-[#3a3a3a] text-xs text-gray-400">
          Click on an end date to complete the range
        </div>
      )}
    </div>
  );
}