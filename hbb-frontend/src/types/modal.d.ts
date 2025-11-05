type modal = {
  isOpen: boolean;
  onYesClick: () => void;
  onResendCode?: () => void | undefined;
  onClose: (v) => void;
  question: string;
  button1Text: string;
  button2Text: string;
  button1Style: {
    bgColor: string;
    textColor: string;
    hoverBgColor: string;
    border?: string;
  };
  button2Style: {
    bgColor: string;
    textColor: string;
    hoverBgColor: string;
    border?: string;
  };
  origin?: string | undefined;
};

type modal2 = {
  isOpen: boolean;
  buttonText: string;
  onClose: () => void;
};
