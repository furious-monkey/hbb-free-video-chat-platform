import React, { useState, useTransition, useRef } from "react";
import { Button } from "../../ui/button";
import { Checkbox } from "@/src/components/ui/checkbox";
import Image from "next/image";

interface Props {
  onClose: (isOpen: boolean) => void;
  isOpen: boolean;
}

interface Card {
  id: number;
  lastSixDigits: string;
  rank: "default" | "none";
  type: "card";
}

interface Account {
  id: number;
  lastFourDigits: string;
  rank: "default" | "none";
  type: "account";
}

type PaymentMethod = Card | Account;

const PaymentMethodModal = ({ onClose, isOpen }: Props) => {
  const [isPending, startTransition] = useTransition();
  const [showAddForm, setShowAddForm] = useState(false);
  const [addFormType, setAddFormType] = useState<"card" | "account" | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    { id: 1, lastSixDigits: "2367", rank: "default", type: "card" },
    { id: 2, lastFourDigits: "5790", rank: "none", type: "account" },
  ]);
  const [updateSelection, setUpdateSelection] = useState(false);
  const [selectedPaymentDetails, setSelectedPaymentDetails] = useState<PaymentMethod | null>(null);
  
  // Card form refs
  const cardNameRef = useRef<HTMLInputElement>(null);
  const cardNumberRef = useRef<HTMLInputElement>(null);
  const expiryDateRef = useRef<HTMLInputElement>(null);
  const cvvRef = useRef<HTMLInputElement>(null);
  
  // Account form refs
  const accountNameRef = useRef<HTMLInputElement>(null);
  const accountNumberRef = useRef<HTMLInputElement>(null);
  const routingNumberRef = useRef<HTMLInputElement>(null);

  const [cardFormData, setCardFormData] = useState({
    cardName: "",
    expiryDate: "",
    cardNumber: "",
    cvv: "",
  });

  const [accountFormData, setAccountFormData] = useState({
    accountName: "",
    accountNumber: "",
    routingNumber: "",
  });

  const [errors, setErrors] = useState({});

  const { cardName, expiryDate, cardNumber, cvv } = cardFormData;
  const { accountName, accountNumber, routingNumber } = accountFormData;
  
  const cardIsValid = cardName !== "" && expiryDate !== "" && cardNumber !== "" && cvv !== "";
  const accountIsValid = accountName !== "" && accountNumber !== "" && routingNumber !== "";

  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCardFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleAccountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAccountFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const onHandleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (addFormType === "card") {
      const payload: Card = { 
        id: paymentMethods.length + 1, 
        lastSixDigits: cardFormData.cardNumber.slice(-4), 
        rank: "none",
        type: "card"
      };
      const updatedArr = [...paymentMethods, payload];
      setPaymentMethods(updatedArr);
    } else if (addFormType === "account") {
      const payload: Account = { 
        id: paymentMethods.length + 1, 
        lastFourDigits: accountFormData.accountNumber.slice(-4), 
        rank: "none",
        type: "account"
      };
      const updatedArr = [...paymentMethods, payload];
      setPaymentMethods(updatedArr);
    }
    
    setShowAddForm(false);
    setAddFormType(null);
    // Reset forms
    setCardFormData({ cardName: "", expiryDate: "", cardNumber: "", cvv: "" });
    setAccountFormData({ accountName: "", accountNumber: "", routingNumber: "" });
  };

  const toggleAddForm = (type: "card" | "account") => {
    setShowAddForm(true);
    setAddFormType(type);
  };

  const handleCheckboxChange = (value: PaymentMethod, checked: boolean) => {   
    const updatedMethods = paymentMethods.map((x) => ({ 
      ...x, 
      rank: value.id === x.id && checked ? "default" : "none" 
    })) as PaymentMethod[];
    setPaymentMethods(updatedMethods);   
    setUpdateSelection(true);        
  };

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    const groups = digits.match(/.{1,4}/g);
    return groups ? groups.join(' ') : digits;
  };

  const formatExpiryDate = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length >= 2) {
      return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
    }
    return digits;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\s/g, '');
    if (value.length <= 16 && /^\d*$/.test(value)) {
      setCardFormData((prevData) => ({ 
        ...prevData, 
        cardNumber: formatCardNumber(value) 
      }));
    }
  };

  const handleExpiryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length <= 4) {
      const formatted = formatExpiryDate(value);
      setCardFormData((prevData) => ({ 
        ...prevData,
        expiryDate: formatted
      }));
      validateExpiryDate(formatted);
    }
  };

  const validateExpiryDate = (value: string) => {
    if (value.length === 5) {
      const [month, year] = value.split('/');
      const currentYear = new Date().getFullYear() % 100;
      const currentMonth = new Date().getMonth() + 1;
      
      const numMonth = parseInt(month);
      const numYear = parseInt(year);
      
      if (numMonth < 1 || numMonth > 12) {
        setErrors(prev => ({
          ...prev,
          expiryDate: 'Invalid month'
        }));
      } else if (numYear < currentYear || (numYear === currentYear && numMonth < currentMonth)) {
        setErrors(prev => ({
          ...prev,
          expiryDate: 'Card has expired'
        }));
      } else {
        setErrors(prev => ({ ...prev, expiryDate: '' }));
      }
    }
  };

  const updateBtnEnabled = updateSelection && paymentMethods.length > 1;

  const getPaymentMethodIcon = (method: PaymentMethod) => {
    if (method.type === "card") {
      return (
        <Image 
          src="/img/card 1.svg"
          alt="Card"
          className="w-[28px] h-[28px] mr-3"
          width={100}
          height={100}
        />
      );
    } else {
      return (
        <div className="w-[28px] h-[28px] mr-3 bg-white/20 rounded flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M13 4H3C2.44772 4 2 4.44772 2 5V11C2 11.5523 2.44772 12 3 12H13C13.5523 12 14 11.5523 14 11V5C14 4.44772 13.5523 4 13 4Z" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 9.5C8.82843 9.5 9.5 8.82843 9.5 8C9.5 7.17157 8.82843 6.5 8 6.5C7.17157 6.5 6.5 7.17157 6.5 8C6.5 8.82843 7.17157 9.5 8 9.5Z" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      );
    }
  };

  const getPaymentMethodText = (method: PaymentMethod) => {
    if (method.type === "card") {
      return `Card ending in ${(method as Card).lastSixDigits}`;
    } else {
      return `Account ending in ${(method as Account).lastFourDigits}`;
    }
  };

  return (
    <>
      {isOpen && (
        <>
          {!showAddForm ? (
            <div className="w-full">
              <p className="text-base text-white/[0.56] mt-2 font-medium">Select payment method</p>
              
              {/* Add card option */}
              <div className="mt-4 flex items-center cursor-pointer py-3" onClick={() => toggleAddForm("card")}>
                <div className="rounded-full bg-white/[0.10] w-8 h-8 flex items-center justify-center mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 6V10M10 8H6M14 8C14 8.78793 13.8448 9.56815 13.5433 10.2961C13.2417 11.0241 12.7998 11.6855 12.2426 12.2426C11.6855 12.7998 11.0241 13.2417 10.2961 13.5433C9.56815 13.8448 8.78793 14 8 14C7.21207 14 6.43185 13.8448 5.7039 13.5433C4.97595 13.2417 4.31451 12.7998 3.75736 12.2426C3.20021 11.6855 2.75825 11.0241 2.45672 10.2961C2.15519 9.56815 2 8.78793 2 8C2 6.4087 2.63214 4.88258 3.75736 3.75736C4.88258 2.63214 6.4087 2 8 2C9.5913 2 11.1174 2.63214 12.2426 3.75736C13.3679 4.88258 14 6.4087 14 8Z" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="text-base text-[#EFD378] font-medium">Add card</p>
              </div>

              {/* Add account option */}
              <div className="flex items-center cursor-pointer py-3" onClick={() => toggleAddForm("account")}>
                <div className="rounded-full bg-white/[0.10] w-8 h-8 flex items-center justify-center mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 6V10M10 8H6M14 8C14 8.78793 13.8448 9.56815 13.5433 10.2961C13.2417 11.0241 12.7998 11.6855 12.2426 12.2426C11.6855 12.7998 11.0241 13.2417 10.2961 13.5433C9.56815 13.8448 8.78793 14 8 14C7.21207 14 6.43185 13.8448 5.7039 13.5433C4.97595 13.2417 4.31451 12.7998 3.75736 12.2426C3.20021 11.6855 2.75825 11.0241 2.45672 10.2961C2.15519 9.56815 2 8.78793 2 8C2 6.4087 2.63214 4.88258 3.75736 3.75736C4.88258 2.63214 6.4087 2 8 2C9.5913 2 11.1174 2.63214 12.2426 3.75736C13.3679 4.88258 14 6.4087 14 8Z" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="text-base text-[#EFD378] font-medium">Add account</p>
              </div>
              
              {/* Payment methods list */}
              {paymentMethods?.map((method, index) => (
                <div className="flex items-center justify-between pt-2 border-t border-white/[0.10] pb-4" key={method.id}>
                  <div className="flex items-baseline md:items-center flex-col md:flex-row mt-4">
                    <div className="flex items-center">
                      {getPaymentMethodIcon(method)}
                      {method.rank === "default" && (
                        <div className="ml-4 md:hidden rounded-2xl bg-white/[0.16] px-3 py-1 text-[#EBEBEB] text-xs mr-4">Primary</div>
                      )}
                    </div>
                    
                    <p className="text-white text-base font-medium mt-2 md:mt-0">{getPaymentMethodText(method)}</p>
                  </div>

                  <div className="flex items-center justify-evenly">
                    {method.rank === "default" && (
                      <div className="hidden md:block rounded-2xl bg-white/[0.16] px-3 py-1 text-[#EBEBEB] text-xs mr-4">Primary</div>
                    )}

                    <div className="mr-4 border-r border-white/20 pr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="18" viewBox="0 0 16 18" fill="none">
                        <path d="M10.2833 6.50043L9.995 14.0004M6.005 14.0004L5.71667 6.50043M14.0233 3.82543C14.3083 3.86877 14.5917 3.9146 14.875 3.96377M14.0233 3.82543L13.1333 15.3946C13.097 15.8656 12.8842 16.3056 12.5375 16.6265C12.1908 16.9474 11.7358 17.1256 11.2633 17.1254H4.73667C4.26425 17.1256 3.80919 16.9474 3.46248 16.6265C3.11578 16.3056 2.90299 15.8656 2.86667 15.3946L1.97667 3.82543M14.0233 3.82543C13.0616 3.68003 12.0948 3.56968 11.125 3.4946M1.97667 3.82543C1.69167 3.86793 1.40833 3.91377 1.125 3.96293M1.97667 3.82543C2.93844 3.68003 3.9052 3.56968 4.875 3.4946M11.125 3.4946V2.73127C11.125 1.74793 10.3667 0.927934 9.38333 0.897101C8.46135 0.867633 7.53865 0.867633 6.61667 0.897101C5.63333 0.927934 4.875 1.74877 4.875 2.73127V3.4946M11.125 3.4946C9.04477 3.33383 6.95523 3.33383 4.875 3.4946" stroke="white" strokeOpacity="0.56" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>

                    <div>
                      <Checkbox 
                        className='border-2 border-white/[0.56] w-6 h-6 rounded-[50%] data-[state=checked]:text-[#000] data-[state=checked]:bg-[#EFD378] data-[state=checked]:border-none rounded-full'
                        key={method.id} 
                        disabled={paymentMethods.length < 2}
                        checked={method.rank === "default"} 
                        onCheckedChange={(checked) =>
                          handleCheckboxChange(method, checked as boolean)
                        }
                      />
                    </div>  
                  </div>
                </div>
              ))}

              <div className="items-center absolute bottom-10 w-full left-0">
                <Button
                  variant="yellow"
                  className={
                    `w-3/4 m-auto grid h-11 shadow-custom-shadow
                    ${(!updateBtnEnabled) ? "bg-[#ECECEC] text-[#9E9E9E]": ""}
                  `}
                  disabled={!updateBtnEnabled}
                >
                  Update
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={onHandleSubmit} className="flex flex-col justify-between h-full flex-grow">
              {addFormType === "card" ? (
                // Card form
                <div className="my-1 2xl:my-4 pb-6 flex flex-col">
                  <div className="w-full mt-2 flex flex-col flex-grow">
                    <label className="text-white/60 text-xs mb-2 font-medium">
                      Name on the card
                    </label>
                    <input
                      placeholder="John Green"
                      className="flex !h-11 rounded-md mt-1 px-3 py-2 border border-placeholderText2 text-xs ring-offset-placeholderText2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 !bg-[#8EC7DD] text-white backdrop-blur-sm placeholder:text-placeholderText placeholder:text-xs !border-none outline-none w-full"
                      name="cardName"
                      value={cardName} 
                      ref={cardNameRef}
                      onChange={handleCardChange}
                    />
                  </div>

                  <div className="w-full mt-2 flex flex-col flex-grow">
                    <label className="text-white/60 text-xs mb-2 font-medium">
                      Expiry date
                    </label>
                    <input
                      placeholder="06/2024"
                      className="flex !h-11 rounded-md mt-1 px-3 py-2 border border-placeholderText2 text-xs ring-offset-placeholderText2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 !bg-[#8EC7DD] text-white backdrop-blur-sm placeholder:text-placeholderText placeholder:text-xs !border-none outline-none w-full"
                      name="expiryDate"
                      value={expiryDate} 
                      ref={expiryDateRef}
                      onChange={handleExpiryDateChange}
                    />
                  </div>

                  <div className="w-full mt-2 flex flex-col flex-grow">
                    <label className="text-white/60 text-xs mb-2 font-medium">
                      Card number
                    </label>
                    <input
                      placeholder="3333 6543 3456 2384"
                      className="flex !h-11 rounded-md mt-1 px-3 py-2 border border-placeholderText2 text-xs ring-offset-placeholderText2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 !bg-[#8EC7DD] text-white backdrop-blur-sm placeholder:text-placeholderText placeholder:text-xs !border-none outline-none w-full"
                      name="cardNumber"
                      value={cardNumber} 
                      ref={cardNumberRef}
                      onChange={handleCardNumberChange}
                    />
                  </div>

                  <div className="w-full mt-2 flex flex-col flex-grow">
                    <label className="text-white/60 text-xs mb-2 font-medium">
                      CVV
                    </label>
                    <input
                      placeholder="***"
                      type="password"
                      className="flex !h-11 rounded-md mt-1 px-3 py-2 border border-placeholderText2 text-xs ring-offset-placeholderText2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 !bg-[#8EC7DD] text-white backdrop-blur-sm placeholder:text-placeholderText placeholder:text-xs !border-none outline-none w-full"
                      name="cvv"
                      value={cvv} 
                      ref={cvvRef}
                      onChange={handleCardChange}
                    />
                  </div>
                </div>
              ) : (
                // Account form
                <div className="my-1 2xl:my-4 pb-6 flex flex-col">
                  <div className="w-full mt-2 flex flex-col flex-grow">
                    <label className="text-white/60 text-xs mb-2 font-medium">
                      Account holder name
                    </label>
                    <input
                      placeholder="John Green"
                      className="flex !h-11 rounded-md mt-1 px-3 py-2 border border-placeholderText2 text-xs ring-offset-placeholderText2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 !bg-[#8EC7DD] text-white backdrop-blur-sm placeholder:text-placeholderText placeholder:text-xs !border-none outline-none w-full"
                      name="accountName"
                      value={accountName} 
                      ref={accountNameRef}
                      onChange={handleAccountChange}
                    />
                  </div>

                  <div className="w-full mt-2 flex flex-col flex-grow">
                    <label className="text-white/60 text-xs mb-2 font-medium">
                      Account number
                    </label>
                    <input
                      placeholder="1234567890"
                      className="flex !h-11 rounded-md mt-1 px-3 py-2 border border-placeholderText2 text-xs ring-offset-placeholderText2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 !bg-[#8EC7DD] text-white backdrop-blur-sm placeholder:text-placeholderText placeholder:text-xs !border-none outline-none w-full"
                      name="accountNumber"
                      value={accountNumber} 
                      ref={accountNumberRef}
                      onChange={handleAccountChange}
                    />
                  </div>

                  <div className="w-full mt-2 flex flex-col flex-grow">
                    <label className="text-white/60 text-xs mb-2 font-medium">
                      Routing number
                    </label>
                    <input
                      placeholder="123456789"
                      className="flex !h-11 rounded-md mt-1 px-3 py-2 border border-placeholderText2 text-xs ring-offset-placeholderText2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 !bg-[#8EC7DD] text-white backdrop-blur-sm placeholder:text-placeholderText placeholder:text-xs !border-none outline-none w-full"
                      name="routingNumber"
                      value={routingNumber} 
                      ref={routingNumberRef}
                      onChange={handleAccountChange}
                    />
                  </div>
                </div>
              )}

              <div className="w-full py-3 text-center mb-8">
                <Button
                  variant="yellow"
                  className={
                    `w-[95%] md:w-3/4 m-auto grid h-11 shadow-custom-shadow bg-tertiary hover:bg-tertiaryHover
                    ${(addFormType === "card" && (!cardIsValid || isPending)) || 
                      (addFormType === "account" && (!accountIsValid || isPending)) ? 
                      "bg-[#ECECEC] text-[#9E9E9E]": ""}
                  `}
                  disabled={
                    (addFormType === "card" && (!cardIsValid || isPending)) || 
                    (addFormType === "account" && (!accountIsValid || isPending))
                  }
                >
                  Save {addFormType === "card" ? "card" : "account"} details
                </Button>
                <Button 
                  className="text-[#efd376] md:w-1/2 mx-auto grid justify-center items-center h-11 mt-[10px] text-sm font-medium" 
                  onClick={() => {
                    setShowAddForm(false);
                    setAddFormType(null);
                  }}
                  type="button"
                >
                  Go back
                </Button>
              </div>
            </form>
          )}
        </>
      )}
    </>
  );
};

export default PaymentMethodModal;