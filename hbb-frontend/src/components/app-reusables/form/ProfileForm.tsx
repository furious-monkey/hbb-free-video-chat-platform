import React, {
  useRef,
  useState,
  useEffect,
  useMemo,
  useTransition,
} from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../ui/form";
import Image from "next/image";
import { Button } from "../../ui/button";
import { usePathname, useRouter } from "next/navigation";
import { Input } from "../../ui/input";
import DropZone from "../DropZone";
import { useUserStore } from "@/src/store/userStore";
import { shallow } from "zustand/shallow";
import { getCookie } from "cookies-next";
import { CheckCircle, XCircle, Loader, Loader2 } from "lucide-react";
import {
  handleImageUpload,
  handlePromotionalVideo,
  isNotEmpty,
} from "@/src/utils/functions";
import CategoryCard from "../categoryCard";
import Select, { StylesConfig } from "react-select";
import countryList from "react-select-country-list";
import { CancelIcon } from "../../svgs";
import { PaymentIcon } from "../../svgs/PaymentIcon";
import CardDetails from "../../Settings/Payment/CardDetails";
import { useInfluencerStore } from "@/src/store/influencerStore";
import { PaymentType } from "@/src/types/payment";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { toast } from "sonner";

interface ProfileFormProps {
  setLoadingProfile: (value: boolean) => void;
  setGettingProfileDetails: (value: boolean) => void;
  gettingProfileDetails: boolean;
  isConfirmationFlow?: boolean;
}

const ProfileForm = ({
  setLoadingProfile,
  setGettingProfileDetails,
  gettingProfileDetails,
  isConfirmationFlow,
}: ProfileFormProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<File | undefined>(undefined);
  const [files, setFiles] = useState<File | undefined>(undefined);
  const [preview, setPreview] = useState<File | undefined>(undefined);
  const [userImage, setUserImage] = useState<string | undefined>(undefined);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<
    boolean | null
  >(null);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(
    null
  );
  const [cardForm, setCardForm] = useState({
    cardName: "",
  });

  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCardForm((prev) => ({ ...prev, [name]: value }));
  };
  const [paymentMethodIndex, setPaymentMethodIndex] = useState<number | null>(
    0
  );
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isPaying, startPaymentTransition] = useTransition();
  const [isPaymentMade, setPaymentMade] = useState(false);

  const options = useMemo(() => countryList().getData(), []);

  const stripe = useStripe();
  const elements = useElements();

  const customStyles: StylesConfig = {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: "transparent",
      borderColor: state.isFocused ? "#ffffff" : "#ffffff60",
      borderRadius: "8px",
      outline: "none",
      "&:hover": {
        borderColor: "#ffffff",
      },
      color: "white",
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: "white",
      fontSize: "14px",
    }),
    option: (provided, state) => ({
      ...provided,
      color: "black",
      fontSize: "14px",
      backgroundColor: state.isFocused ? "#E688A3" : "transparent",
      "&:hover": {
        backgroundColor: "#E688A3",
        color: "white",
      },
    }),
    singleValue: (provided) => ({
      ...provided,
      color: "white",
      fontSize: "14px",
    }),
    placeholder: (provided) => ({
      ...provided,
      color: "#ffffff60",
      fontSize: "14px",
    }),
    input: (provided) => ({
      ...provided,
      color: "white",
    }),
  };

  const { postUserCompleteProfile, fetchUserDetails, userDetails } =
    useUserStore(
      (state: any) => ({
        postUserCompleteProfile: state.postUserCompleteProfile,
        fetchUserDetails: state.fetchUserDetails,
        userDetails: state.userDetails,
      }),
      shallow
    );

  const { checkUsernameAvailability, checkUsernameLoading } =
    useInfluencerStore(
      (state: any) => ({
        checkUsernameAvailability: state.checkUsernameAvailability,
        checkUsernameLoading: state.checkUsernameLoading,
      }),
      shallow
    );

  const router = useRouter();
  const token = getCookie("accessToken");
  const pathname = usePathname();
  const segment = pathname.split("/")[2];
  const isInfluencerSegment = segment === "influencer";

  const profileSchema = z.object({
    userName: z.string().min(1, "Username is required"),
    country: z.string().min(1, "Country is required"),
    categories: isInfluencerSegment
      ? z
          .array(z.string().min(1, "Category is required"))
          .min(1, "At least one category must be selected")
          .max(3, "You can select up to 3 categories only")
      : z.array(z.string()).optional(),
  });

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      userName: userDetails?.profile?.username || "",
      country: userDetails?.profile?.location || "",
      categories: userDetails?.profile?.category || [],
    },
  });

  useEffect(() => {
    const checkProfileDetailsAndRedirect = async () => {
      if (userDetails) {
        const { profileImage, profileImageDetails, profile } = userDetails;

        // Safely access properties of profile
        const category = profile?.category;
        const username = profile?.username;
        const location = profile?.location;

        if (profileImageDetails) {
          setUserImage(profileImageDetails.url);
        }

        if (
          isNotEmpty(username) &&
          isNotEmpty(profileImage) &&
          isNotEmpty(location) &&
          isNotEmpty(category) &&
          !isConfirmationFlow
        ) {
          try {
            window.location.href = `/dashboard/${segment}/live`;
          } catch (error) {
            console.error("Failed to redirect:", error);
          }
        } else {
          setGettingProfileDetails(false);
        }
      } else {
        setGettingProfileDetails(false);
      }
    };

    checkProfileDetailsAndRedirect();
  }, [userDetails]);

  const handleCategorySelect = (categoryIds: string[]) => {
    setSelectedCategoryIds(categoryIds);
    form.setValue("categories", categoryIds);
  };

  const influencerHasNoVideo =
    isInfluencerSegment &&
    !preview &&
    userDetails?.promotionalVideo?.length == 0;

  const handlePayment = async () => {
    setPaymentError(null);

    if (!stripe || !elements) {
      console.error("Stripe.js has not loaded yet");
      return;
    }

    console.log("CStripe", stripe, elements, cardForm);

    try {
      // Create a PaymentMethod using the card details
      const cardElement = elements.getElement(CardElement);

      if (!cardElement) {
        throw new Error("Card element not found.");
      }

      const { error: paymentMethodError, paymentMethod } =
        await stripe.createPaymentMethod({
          type: "card",
          card: cardElement,
          billing_details: {
            name: cardForm.cardName,
          },
        });

      if (paymentMethodError) {
        throw new Error(paymentMethodError.message);
      }

      // Create the payment intent on the backend
      const paymentType = isInfluencerSegment
        ? PaymentType.SIGNUP_FEE
        : PaymentType.MEMBERSHIP_FEE;

      const requestBody = {
        type: paymentType,
        userId: userDetails?.id,
        currency: "usd",
        paymentMethod: paymentMethod.id,
        description: isInfluencerSegment
          ? "One-time signup fee for influencer account"
          : "Monthly membership fee",
        metadata: {
          userEmail: userDetails?.email,
          segment: isInfluencerSegment ? "influencer" : "explorer",
        },
      };


      const res = await fetch(
        "http://localhost:8000/api/payment/create-intent",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        }
      );

      console.log("Payment intent request:", requestBody, res);

      if (!res.ok) {
        toast("Payment failed, please try again");
        throw new Error("Payment failed");
      }

      const paymentResponse = await res.json();
      console.log("Payment intent created:", paymentResponse);

      // Confirm the payment using the clientSecret
      const { error: confirmError } = await stripe.confirmCardPayment(
        paymentResponse.clientSecret,
        {
          payment_method: paymentMethod.id,
        }
      );

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      // Payment succeeded
      toast("Payment successful, Please proceed to verification");
      console.log("Payment succeeded!");
      setPaymentMade(true);
    } catch (err: any) {
      console.error("Payment error:", err);
      setPaymentError(
        err?.message || "An error occurred during payment submission"
      );
    }
  };

  const cardIsValid = Object.values(cardForm).every((val) => val !== "");

  const onHandleSubmit: SubmitHandler<z.infer<typeof profileSchema>> = async (
    data,
    event
  ) => {
    event?.preventDefault();

    startPaymentTransition(async () => {
      if (!cardIsValid && !isPaymentMade) {
        setPaymentError("Please fill in all card details.");
        return;
      }

      if (!isPaymentMade) {
        await handlePayment();

        if (!isPaymentMade) {
          return;
        }
      }

      if (!image && !userImage) {
        toast("Please upload a profile image");
        console.log("Error: Profile image is missing");
        return;
      }

      if (influencerHasNoVideo) {
        toast("Please upload a promotional video");
        console.log(
          "Error: Promotional video is missing for influencer segment"
        );
        return;
      }

      setLoadingProfile(true);

      try {
        const viewing = "firstScreen";
        let imageId = "";
        let videoIds: string[] = [];

        if (image && token) {
          const formData = new FormData();
          formData.append("file", image);
          const res = await handleImageUpload(formData, token, viewing);
          imageId = res?.data?.id || "";
        }

        if (files && token) {
          const formData = new FormData();
          formData.append("file", files);
          const res = await handlePromotionalVideo(formData, token, viewing);
          videoIds.push(res?.data?.id || "");
        }

        const response = await postUserCompleteProfile({
          userName: data.userName,
          profileImage: imageId || userDetails?.profileImage,
          promotionalVideo: videoIds,
          country: data.country,
          categories: selectedCategoryIds,
        });

        if (response) {
          setImage(undefined);
          setFiles(undefined);
          await fetchUserDetails();
          window.location.href = `/dashboard/${segment}/live`;
          toast("Profile updated successfully");
        }
      } catch (error) {
        console.error("Error during profile update:", error);
        toast("Error creating profile, try again or contact support");
      } finally {
        setLoadingProfile(false);
      }
    });
  };

  if (gettingProfileDetails) {
    return (
      <div className="w-full h-full bg-pink flex flex-col items-center justify-center bg-pink-100 text-pink-800">
        <Loader2 className="animate-spin w-12 h-12 mb-4" />
        <p className="text-lg font-semibold">Loading up your profile...</p>
        <p className="text-sm text-pink-600">
          Please wait, this might take a few moments.
        </p>
      </div>
    );
  }

  const handleClearVideo = () => {
    setFiles(undefined);
    setPreview(undefined);
    return;
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = (event.nativeEvent.target as HTMLInputElement)?.files?.[0];
    if (file) {
      setImage(file);
    }
  };

  // Debounce logic for username availability check
  const handleUsernameChange = (username: string) => {
    if (debounceTimer) clearTimeout(debounceTimer);

    // Proceed only if the username is not empty
    if (username.trim().length === 0) {
      setIsUsernameAvailable(null); // Reset availability status
      return;
    }

    // Debounce logic
    const timer = setTimeout(async () => {
      if (username) {
        const response = await checkUsernameAvailability(username);
        setIsUsernameAvailable(response?.isAvailable);
      }
    }, 500); // Delay API call by 500ms

    setDebounceTimer(timer);
  };

  return (
    <div className="h-full w-full px-4 pt-7 pb-9 md:px-6 md:pt-10 lg:pt-14 flex flex-col">
      <div className=" w-full text-white lg:overflow-y-auto md:px-6  !h-[70vh] lg:h-full pb-8 ">
        <div>
          <p className="font-medium text-[22px] 2xl:text-2xl mb-1 2xl:mb-4">
            Provide your information
          </p>
          <p className="text-[#DCDFE5] text-[15px] 2xl:text-[16px] mt-2 font-thin">
            Complete your information and verify your identity to get started
          </p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onHandleSubmit)}>
            <div className="flex gap-6 flex-col md:flex-row mt-8 mb-6 md:mt-12 md:items-center">
              <div
                className={`flex items-center gap-5 w-fit h-max ${
                  isInfluencerSegment
                    ? "md:pr-6 md:border-r md:border-profile"
                    : ""
                }`}
              >
                <div>
                  <Image
                    src={
                      image
                        ? URL.createObjectURL(image)
                        : userImage
                        ? userImage
                        : "/assests/camera.svg"
                    }
                    alt={"Profile Image"}
                    width={120}
                    height={120}
                    className="w-[96px] md:w-[112px] h-[96px] md:h-[112px] rounded-[50%] object-cover"
                  />
                  <Input
                    type="file"
                    accept="image/*"
                    ref={inputRef}
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>
                <Button
                  className="flex-1 text-base2 py-[6px] px-3 rounded-lg bg-white h-fit text-xs"
                  onClick={(e) => {
                    e.preventDefault();
                    inputRef.current?.click();
                  }}
                >
                  Choose photo
                </Button>
              </div>
              {isInfluencerSegment && (
                <>
                  {userDetails?.promotionalVideo?.length == 0 ? (
                    <div className="flex items-center flex-col md:flex-row gap-4 md:gap-5 h-max">
                      <div className="relative w-full md:w-fit">
                        <DropZone
                          setCurrentVideo={(file: any) => (
                            setFiles(file), setPreview(file)
                          )}
                          currentVideo={null}
                          preview={preview}
                          videoName={preview!?.name}
                          imageHeight={120}
                          innerThumbFullWidth={true}
                          title={"Select Cover Image (Optional)"}
                        />
                        {files && (
                          <Button
                            onClick={handleClearVideo}
                            className="bg-placeholderText h-6 w-6 p-0 rounded-[50%] absolute top-0 right-2"
                            variant="link"
                          >
                            <CancelIcon className="p-0 w-3/5 text-[#000]" />
                          </Button>
                        )}
                      </div>

                      <Button
                        onClick={(e) => e.preventDefault()}
                        className="text-[#F5CFDA] py-[6px] px-3 rounded-lg bg-base2 h-fit border border-[#F5CFDA] text-xs w-fit lg:m-auto"
                      >
                        Promotional video
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 ">
                      <PaymentIcon />
                      <p className="text-sm">Promotional video uploaded</p>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="space-y-[15px] lg:space-y-6 pt-4 border-t border-white">
              <FormField
                control={form.control}
                name="userName"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel className="text-white text-xs mb-2 font-medium">
                      Username *
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your username"
                        className="border-profile p-3 rounded-lg placeholder:text-profile text-sm w-full h-fit focus:border-white text-white"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          handleUsernameChange(e.target.value);
                        }}
                      />
                    </FormControl>
                    <span className="flex items-center gap-2 mt-1">
                      {field.value.trim().length > 0 && // Check if username is not empty
                        (checkUsernameLoading ? (
                          <span className="text-sm flex items-center gap-1 text-white">
                            <Loader
                              className="animate-spin"
                              size={16}
                              color="white"
                            />
                            <span>Checking username...</span>
                          </span>
                        ) : isUsernameAvailable === true ? (
                          <span
                            className="text-sm flex items-center gap-1"
                            style={{ color: "#ffffff" }}
                          >
                            <CheckCircle size={16} color="#ffffff" />
                            <span>Username is available</span>
                          </span>
                        ) : isUsernameAvailable === false ? (
                          <span
                            className="text-sm flex items-center gap-1"
                            style={{ color: "#ffffff" }}
                          >
                            <XCircle size={16} color="#ffffff" />
                            <span>Username is already taken</span>
                          </span>
                        ) : null)}
                    </span>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel className="text-white text-xs mb-2 font-medium">
                      Location *
                    </FormLabel>
                    <FormControl>
                      <Select
                        options={options}
                        placeholder="Country"
                        classNamePrefix="react-select"
                        styles={customStyles}
                        value={options.find(
                          (option) => option.label === field.value
                        )}
                        onChange={(selectedOption) => {
                          field.onChange(selectedOption?.label);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isInfluencerSegment && (
                <FormField
                  control={form.control}
                  name="categories"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel className="text-[#F5CFDA] text-xs mb-2 font-medium">
                        Select category (Maximum 3) *
                      </FormLabel>
                      <FormControl>
                        <CategoryCard
                          selectedCategories={field.value || []}
                          onCategorySelect={(categories) => {
                            field.onChange(categories);
                            handleCategorySelect(categories);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {!isPaymentMade ? (
              <div className="border-t-[1px] border-[#E49DB1]">
                {!isInfluencerSegment && (
                  <div className="border-b border-white pb-7"></div>
                )}

                <div className="my-5 border-b border-[#ffffff60] pb-2 flex items-baseline md:items-center flex-col md:flex-row">
                  <span className="text-[20px] 2xl:text-[20px]">
                    {isInfluencerSegment
                      ? "One-time processing fee"
                      : "Monthly membership fee"}
                  </span>
                  <span className="mt-3 md:mt-0 md:ml-2 bg-[#ffffff30] px-8 rounded-xl">
                    ${isInfluencerSegment ? 12.99 : 6.99}
                  </span>
                </div>
                <div className="top-0 left-0 right-0 w-full h-full bg-base2 overflow-hidden">
                  <CardDetails
                    formData={cardForm}
                    onChange={handleCardChange}
                    selectedIndex={paymentMethodIndex}
                    onSelect={setPaymentMethodIndex}
                    error={paymentError}
                    isPending={isPaying}
                  />
                </div>
                <p className="text-xs mt-4">
                  Note: Card as beneficiary for all earnings
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 pt-6 border-t border-[#E49DB1] mt-8">
                <PaymentIcon />
                <p className="text-sm">Payment successful</p>
              </div>
            )}

            <div className="mt-5 md:mt-8 text-center">
              <Button
                className={`w-[97.5%] md:w-3/4 lg:max-w-[342px] px-5 py-3 rounded-full text-gray font-normal text-sm shadow-[2px_2px_0px_2px_#000000] md:mb-0 mb-10 ${
                  !form.formState.isValid || (!image && !userImage)
                    ? "bg-lightgray text-gray"
                    : "bg-tertiary hover:bg-tertiaryHover text-black"
                }`}
                type="submit"
                disabled={
                  !form.formState.isValid ||
                  (!image && !userImage) ||
                  influencerHasNoVideo ||
                  isUsernameAvailable === false ||
                  (!paymentMethodIndex && !isPaymentMade && !cardIsValid)
                }
              >
                {isPaymentMade ? "Proceed to verification" : "Pay now"}
                {isPaying && <Loader2 className="animate-spin ml-2 w-4 h-4" />}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default ProfileForm;
