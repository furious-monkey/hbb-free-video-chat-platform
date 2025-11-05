import { useEffect, useState } from "react";
import { differenceInSeconds, format, addSeconds } from "date-fns";
import { TfiTimer } from "react-icons/tfi";

interface CountdownTimerProps {
  targetDate: Date;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const diffInSeconds = differenceInSeconds(targetDate, now);

      if (diffInSeconds <= 0) {
        setTimeLeft("00:00:00:00");
        return;
      }

      const formattedTime = format(
        addSeconds(new Date(0), diffInSeconds),
        "dd:HH:mm:ss"
      );
      setTimeLeft(formattedTime);
    };

    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="flex flex-row">
      <TfiTimer color="ffffff" className="w-[20px]" />
      <p className="text-[13px] ">{timeLeft ? timeLeft : "00:00:00"}</p>
    </div>
  );
};

export default CountdownTimer;
