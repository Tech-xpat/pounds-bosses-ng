"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { addDays, format } from "date-fns"
import type { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface CalendarDateRangePickerProps extends React.HTMLAttributes<HTMLDivElement> {
  dateRange?: DateRange
  onDateRangeChange?: (dateRange: DateRange) => void
}

export function CalendarDateRangePicker({ className, dateRange, onDateRangeChange }: CalendarDateRangePickerProps) {
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 7),
  })

  // Use the provided dateRange if available, otherwise use the local state
  const selectedDateRange = dateRange || date

  // Handle date changes
  const handleDateChange = (newDateRange: DateRange | undefined) => {
    setDate(newDateRange)
    if (onDateRangeChange && newDateRange) {
      onDateRangeChange(newDateRange)
    }
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[260px] justify-start text-left font-normal",
              !selectedDateRange && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDateRange?.from ? (
              selectedDateRange.to ? (
                <>
                  {format(selectedDateRange.from, "LLL dd, y")} - {format(selectedDateRange.to, "LLL dd, y")}
                </>
              ) : (
                format(selectedDateRange.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={selectedDateRange?.from}
            selected={selectedDateRange}
            onSelect={handleDateChange}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

