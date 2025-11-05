"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/components/ui/form";
import Image from "next/image";
import VideoUpload from "../../InfluencerProfile/VideoUpload";
import { Button } from "@/src/components/ui/button";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/src/components/ui/input";
import { CheckCircle, XCircle, Loader, Loader2, AlertCircle, Pause, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { onSubmitError } from "@/src/lib/utils";
import { useProfileStore } from "@/src/store/profileStore";
import { shallow } from "zustand/shallow";
import { z } from "zod";
import { usePathname, useRouter } from "next/navigation";
import { useNoAuthStore } from "@/src/store/no-authStore";
import { useProfileData } from "@/src/hooks/useProfileData";
import { useDropzone } from "react-dropzone";
import { useInfluencerStore } from "@/src/store/influencerStore";
import LoadingState from "../LoadingState";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/src/components/ui/radio-group";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";

interface Props {
  onClose: (value: boolean) => void;
  isOpen: boolean | undefined;
}

const EditProfileModal = ({ isOpen, onClose }: Props) => {
  const router = useRouter();
  const {
    getUserProfile,
    profile,
    postUserProfileDetails,
    loading: isProfileLoading,
    deleteUserAccount,
    pauseUserAccount,
  } = useProfileStore(
    (state: any) => ({
      getUserProfile: state.getUserProfile,
      profile: state.profile,
      postUserProfileDetails: state.postUserProfileDetails,
      loading: state.loading,
      deleteUserAccount: state.deleteUserAccount,
      pauseUserAccount: state.pauseUserAccount,
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

  const pathname = usePathname();
  const segment = pathname.split("/")[2];
  const isInfluencerSegment = segment === "influencer";

  const { fetchCategories, categories } = useNoAuthStore(
    (state: any) => ({
      fetchCategories: state.fetchCategories,
      categories: state.categories,
      loading: state.loading,
    }),
    shallow
  );

  const [isPending, startTransition] = React.useTransition();
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    profile?.interests || []
  );

  const [isUsernameAvailable, setIsUsernameAvailable] = useState<
    boolean | null
  >(null);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(
    null
  );

  // Account management states
  const [showAccountOptions, setShowAccountOptions] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showPauseConfirmation, setShowPauseConfirmation] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
  const [pauseDuration, setPauseDuration] = useState("30");
  const [pauseReason, setPauseReason] = useState("");

  const profileSchema = z.object({
    userName: z.string().min(1, "Username is required"),
    location: z.string().min(1, "Country is required"),
    email: z.string().email("Invalid email address"),
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
      userName: profile?.username || "",
      location: profile?.location || "",
      email: profile?.user?.email || "",
      categories: isInfluencerSegment ? profile?.category || [] : [],
    },
  });

  const onHandleSubmit = async (data: any) => {
    const { userName, location, email } = data;
    startTransition(async () => {
      try {
        const toastId = toast.loading("Updating profile..");
        const response = await postUserProfileDetails({
          username: userName,
          location: location,
          category: selectedInterests,
          zodiacSign: "Cancer",
        });
        if (response) {
          toast.success("Profile updated successfully", { id: toastId });
          await getUserProfile();
          return;
        }
        toast.error("Profile could not be updated", {
          id: toastId,
        });
      } catch (error: any) {
        console.error(error.message);
        toast.error("Error logging in. Please try again later.");
      }
    });
  };

  const handleDeleteAccount = async () => {
    startTransition(async () => {
      try {
        const toastId = toast.loading("Processing account deletion...");
        
        const response = await deleteUserAccount({
          password: deletePassword,
          reason: deleteReason,
        });
        
        if (response.success) {
          toast.success(
            "Your account has been scheduled for deletion. You will receive an email with further instructions.", 
            { id: toastId, duration: 5000 }
          );
          
          // Clear local storage
          localStorage.clear();
          sessionStorage.clear();
          
          // Redirect to home/login after a delay
          setTimeout(() => {
            router.push('/');
          }, 2000);
        } else {
          toast.error(response.message || "Failed to delete account", { id: toastId });
        }
      } catch (error) {
        toast.error("Error processing deletion request");
      } finally {
        setShowDeleteConfirmation(false);
        setDeletePassword("");
        setDeleteReason("");
      }
    });
  };

  const handlePauseAccount = async () => {
    startTransition(async () => {
      try {
        const toastId = toast.loading("Pausing your account...");
        
        const response = await pauseUserAccount({
          duration: parseInt(pauseDuration),
          reason: pauseReason,
        });
        
        if (response.success) {
          toast.success(
            `Your account has been paused for ${pauseDuration} days. You can reactivate it anytime by logging in.`, 
            { id: toastId, duration: 5000 }
          );
          
          // Redirect to login after a delay
          setTimeout(() => {
            router.push('/login');
          }, 2000);
        } else {
          toast.error(response.message || "Failed to pause account", { id: toastId });
        }
      } catch (error) {
        toast.error("Error pausing account");
      } finally {
        setShowPauseConfirmation(false);
        setPauseReason("");
      }
    });
  };

  const handleInterestSelection = (categoryId: string) => {
    if (
      selectedInterests?.length < 3 &&
      !selectedInterests.includes(categoryId)
    ) {
      const updatedInterests = [...selectedInterests, categoryId];
      setSelectedInterests(updatedInterests);
      form.setValue("categories", updatedInterests);
    } else if (selectedInterests.includes(categoryId)) {
      const updatedInterests = selectedInterests.filter(
        (item) => item !== categoryId
      );
      setSelectedInterests(updatedInterests);
      form.setValue("categories", updatedInterests);
    }
  };

  const selectedCategoryNames = selectedInterests.map(
    (id) => categories?.data.find((cat) => cat.id === id)?.name || ""
  );

  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef(null);

  //image
  const [preview, setPreview] = useState<string | undefined>(undefined);

  const { postUpdateUserProfileImage } = useProfileStore(
    (state: any) => ({
      postUpdateUserProfileImage: state.postUpdateUserProfileImage,
    }),
    shallow
  );

  const {
    videoSrc,
    setVideoSrc,
    handleProfileImageChange,
    handlePlayPause,
    isPlaying,
    handleDrop,
    image,
    webImage,
    webVideo,
  } = useProfileData();

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
  } = useDropzone({
    accept: { "video/*": [] },
    onDrop: handleDrop,
  });

  useEffect(() => {
    if (webImage) {
      setPreview(webImage?.url);
      postUpdateUserProfileImage({ profileImage: webImage.id });
    }
  }, [webImage]);

  const memoizedFetchCategories = useCallback(async () => {
    try {
      await fetchCategories();
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  }, [fetchCategories]);

  useEffect(() => {
    memoizedFetchCategories();
  }, [memoizedFetchCategories]);

  const categoriesData = categories?.data;

  useEffect(() => {
    if (profile) {
      form.reset({
        userName: profile.username || "",
        location: profile.location || "",
        email: profile.user?.email || "",
        categories: profile.category || [],
      });
      form.trigger();
    }
  }, [profile]);

  const handleUsernameChange = (username: string) => {
    if (debounceTimer) clearTimeout(debounceTimer);

    if (username.trim().length === 0) {
      setIsUsernameAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      if (username && username !== profile?.username) {
        const response = await checkUsernameAvailability(username);
        setIsUsernameAvailable(response?.isAvailable);
      }
    }, 500);

    setDebounceTimer(timer);
  };

  useEffect(() => {
    if (profile && categories?.data) {
      const selectedCategoryIds = profile.category || [];
      setSelectedInterests(selectedCategoryIds);
      form.reset({
        userName: profile.username || "",
        location: profile.location || "",
        email: profile.user?.email || "",
        categories: selectedCategoryIds,
      });
      form.trigger();
    }
  }, [profile, categories]);

  const formValues = useWatch({ control: form.control });

  if (isProfileLoading || !formValues?.userName) {
    return (
      <div className="pt-16 w-full flex justify-center">
        <LoadingState />
      </div>
    );
  }

  return (
    <>
      {isOpen && (
        <div className="flex-1 overflow-scroll pb-8 no-scrollbar">
          {segment === "explorer" && (
            <div className="flex justify-center">
              <div>
                <div className="w-24 h-24 lg:w-[112px]">
                  <Image
                    src={
                      preview
                        ? preview
                        : image
                        ? URL.createObjectURL(image)
                        : profile?.profileImageDetails?.url ||
                          "/assests/camera.svg"
                    }
                    alt="Profile Picture"
                    width={82}
                    height={82}
                    className="w-24 h-24 lg:w-[112px] lg:h-[112px] object-cover border-1 border-[#F0B8C8] rounded-full"
                  />

                  <input
                    type="file"
                    accept="image/*"
                    ref={inputRef}
                    onChange={handleProfileImageChange}
                    className="hidden"
                  />
                </div>

                <Image
                  src={"/assests/camera_small.svg"}
                  alt="Edit Icon"
                  width={32}
                  height={32}
                  onClick={() => inputRef.current?.click()}
                  className="cursor-pointer w-6 h-6 lg:w-8 lg:h-8 rounded-full relative bottom-8 float-end"
                />
              </div>
            </div>
          )}

          <div
            className={`${
              segment === "influencer" ? "md:flex justify-between" : ""
            }  mb-4`}
          >
            <div
              className={`${
                segment === "influencer" ? "md:w-[48%]" : "w-full"
              } rounded-lg backdrop-blur-sm overflow-y-auto`}
            >
              {segment == "influencer" && (
                <div className="flex items-center gap-5 py-[16px] w-fit h-max md:pr-6">
                  <div>
                    <Image
                      src={
                        preview
                          ? preview
                          : image
                          ? URL.createObjectURL(image)
                          : profile?.profileImageDetails?.url ||
                            "/assests/camera.svg"
                      }
                      alt="Profile Picture"
                      width={120}
                      height={120}
                      className="w-[96px] md:w-[112px] h-[96px] md:h-[112px] border-r rounded-[50%] object-cover"
                    />

                    <input
                      type="file"
                      accept="image/*"
                      ref={inputRef}
                      onChange={handleProfileImageChange}
                      className="hidden"
                    />
                  </div>

                  <Button
                    className="flex-1 text-base2 py-1 font-thin px-2 rounded-lg bg-white h-fit text-xs"
                    onClick={() => inputRef.current?.click()}
                  >
                    Choose photo
                  </Button>
                </div>
              )}

              {segment == "influencer" && (
                <div className="md:w-[48%] rounded-lg block md:hidden">
                  <VideoUpload
                    videoSrc={videoSrc}
                    webVideo={webVideo || undefined}
                    videoRef={videoRef}
                    promotionVideo={profile?.promotionalVideoDetails?.[0]}
                    handlePlayPause={handlePlayPause}
                    isPlaying={isPlaying}
                    setVideoSrc={setVideoSrc}
                    getRootProps={getRootProps}
                    getInputProps={getInputProps}
                    isDragActive={isDragActive}
                    isDragAccept={isDragAccept}
                    isDragReject={isDragReject}
                  />
                </div>
              )}

              <div>
                {/* Form */}
                <div className="">
                  <Form {...form}>
                    <form className="grid gap-2 mt-4 md:mt-0">
                      <FormField
                        control={form.control}
                        name="userName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[#C3E1ED] font-normal -mt-2 !text-[10px]">
                              Username
                            </FormLabel>
                            <FormControl className="">
                              <Input
                                placeholder="Enter"
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e);
                                  handleUsernameChange(e.target.value);
                                }}
                                style={{ backgroundColor: "rgba(255, 255, 255, 0.08)" }}
                                className="!h-10 backdrop-blur-sm placeholder:text-placeholderText placeholder:text-xs text-white !border-none outline-none w-full"
                              />
                            </FormControl>

                            <span className="flex items-center gap-2 mt-1">
                              {field?.value?.trim().length > 0 && field?.value !== profile?.username && (
                                checkUsernameLoading ? (
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
                                ) : null
                              )}
                            </span>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[#C3E1ED] font-normal !text-[10px]">
                              Location
                            </FormLabel>
                            <FormControl className="">
                              <Input
                                placeholder="City, State"
                                {...field}
                                style={{ backgroundColor: "rgba(255, 255, 255, 0.08)" }}
                                className="!h-10 text-white backdrop-blur-sm placeholder:text-placeholderText placeholder:text-xs !border-none outline-none w-full"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[#C3E1ED] font-thin !text-[10px]">
                              Email
                            </FormLabel>
                            <FormControl className="">
                              <Input
                                placeholder="Email"
                                {...field}
                                disabled
                                style={{ backgroundColor: "rgba(255, 255, 255, 0.08)" }}
                                className=" !h-10 backdrop-blur-sm text-white/30 placeholder:text-placeholderText placeholder:text-xs !border-none outline-none w-full"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </form>
                  </Form>
                </div>
              </div>
            </div>
            {segment == "influencer" && (
              <div className="md:w-[57%] p-[1rem] rounded-lg hidden md:block pr-0">
                <VideoUpload
                  videoSrc={videoSrc}
                  webVideo={webVideo || undefined}
                  videoRef={videoRef}
                  promotionVideo={profile?.promotionalVideoDetails?.[0]}
                  handlePlayPause={handlePlayPause}
                  isPlaying={isPlaying}
                  setVideoSrc={setVideoSrc}
                  getRootProps={getRootProps}
                  getInputProps={getInputProps}
                  isDragActive={isDragActive}
                  isDragAccept={isDragAccept}
                  isDragReject={isDragReject}
                />
              </div>
            )}
          </div>

          {segment == "influencer" && (
            <div className="mt-4 md:-mt-4">
              <div className="rounded-lg">
                <p className="text-xs text-white opacity-60">
                  Select category (Maximum 3)
                </p>
                <div className="flex flex-wrap gap-2 py-[0.75rem] p-[0.75rem] bg-white rounded-xl mt-2">
                  {categoriesData?.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleInterestSelection(item.id)}
                      className={`flex items-center p-2 m-1 cursor-pointer rounded-3xl transition-colors duration-100 text-xs
      ${
        selectedInterests.includes(item.id)
          ? "bg-pink text-white"
          : "bg-[#FDF0F3] text-black"
      }`}
                    >
                      <img
                        src={item?.imageUrl}
                        alt={item.name}
                        className="h-4 mr-1"
                      />
                      <span>{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="mt-12">
            <Button
              variant="yellow"
              className="w-full md:w-1/2 mx-auto grid justify-center items-center h-11 shadow-custom-shadow"
              onClick={form.handleSubmit(onHandleSubmit, (errors) => {
                onSubmitError(errors);
              })}
              disabled={
                !form.formState.isValid || isUsernameAvailable === false
              }
            >
              Save updates
            </Button>

            <Button 
              className="w-full md:w-1/2 mx-auto grid justify-center !rounded-3xl items-center h-11 mt-[10px] text-sm bg-transparent border border-white/20 hover:bg-white/5"
              onClick={() => setShowAccountOptions(true)}
            >
              Manage account
            </Button>
          </div>

          {/* Account Options Modal */}
          <AlertDialog open={showAccountOptions} onOpenChange={setShowAccountOptions}>
            <AlertDialogContent className="bg-black/95 border border-white/10 text-white max-w-md">
              <AlertDialogHeader>
                <AlertDialogTitle>Account Management</AlertDialogTitle>
                <AlertDialogDescription className="text-white/60">
                  Choose an action for your account
                </AlertDialogDescription>
              </AlertDialogHeader>
              
              <div className="space-y-4 py-4">
                <button
                  onClick={() => {
                    setShowAccountOptions(false);
                    setShowPauseConfirmation(true);
                  }}
                  className="w-full p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-3 text-left"
                >
                  <Pause className="h-5 w-5 text-yellow-500" />
                  <div>
                    <h4 className="font-medium">Pause Account</h4>
                    <p className="text-sm text-white/60 mt-1">
                      Temporarily deactivate your account. You can reactivate anytime.
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setShowAccountOptions(false);
                    setShowDeleteConfirmation(true);
                  }}
                  className="w-full p-4 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors flex items-center gap-3 text-left border border-red-500/20"
                >
                  <Trash2 className="h-5 w-5 text-red-500" />
                  <div>
                    <h4 className="font-medium">Delete Account</h4>
                    <p className="text-sm text-white/60 mt-1">
                      Permanently delete your account and all data.
                    </p>
                  </div>
                </button>
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  Cancel
                </AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Pause Account Confirmation */}
          <AlertDialog open={showPauseConfirmation} onOpenChange={setShowPauseConfirmation}>
            <AlertDialogContent className="bg-black/95 border border-white/10 text-white max-w-md">
              <AlertDialogHeader>
                <AlertDialogTitle>Pause Your Account</AlertDialogTitle>
                <AlertDialogDescription className="text-white/60">
                  Your profile will be hidden and you won't receive any notifications.
                </AlertDialogDescription>
              </AlertDialogHeader>
              
              <div className="space-y-4 py-4">
                <div>
                  <Label className="text-sm text-white/80">How long would you like to pause?</Label>
                  <Select value={pauseDuration} onValueChange={setPauseDuration}>
                    <SelectTrigger className="w-full mt-2 bg-white/5 border-white/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">1 week</SelectItem>
                      <SelectItem value="30">1 month</SelectItem>
                      <SelectItem value="90">3 months</SelectItem>
                      <SelectItem value="180">6 months</SelectItem>
                      <SelectItem value="365">1 year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm text-white/80">
                    Why are you pausing your account? (Optional)
                  </Label>
                  <Textarea
                    value={pauseReason}
                    onChange={(e) => setPauseReason(e.target.value)}
                    placeholder="Tell us why you're taking a break..."
                    className="mt-2 bg-white/5 border-white/20 text-white placeholder:text-white/40"
                    rows={3}
                  />
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                  <p className="text-sm flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                    <span className="text-white/80">
                      You can reactivate your account anytime by logging in.
                    </span>
                  </p>
                </div>
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel className="bg-white/10 rounded-3xl border-white/20 text-white hover:bg-white/20">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handlePauseAccount}
                  className="bg-custom-yellow text-black rounded-3xl hover:bg-yellow-700"
                  disabled={isPending}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Pausing...
                    </>
                  ) : (
                    'Pause Account'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Delete Account Confirmation */}
          <AlertDialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
            <AlertDialogContent className="bg-black/95 border border-white/10 text-white max-w-md">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Your Account</AlertDialogTitle>
                <AlertDialogDescription className="text-white/60">
                  This action cannot be undone. You will have 30 days to cancel this request.
                </AlertDialogDescription>
              </AlertDialogHeader>
              
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="password" className="text-sm text-white/80">
                    Enter your password to confirm
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Enter your password"
                    className="mt-2 bg-white/5 border-white/20 text-white placeholder:text-white/40"
                  />
                </div>

                <div>
                  <Label className="text-sm text-white/80">
                    Why are you deleting your account?
                  </Label>
                  <RadioGroup value={deleteReason} onValueChange={setDeleteReason}>
                    <div className="space-y-2 mt-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="privacy" id="privacy" />
                        <Label htmlFor="privacy" className="font-normal text-white/80">
                          Privacy concerns
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="not-useful" id="not-useful" />
                        <Label htmlFor="not-useful" className="font-normal text-white/80">
                          Not finding it useful
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="alternative" id="alternative" />
                        <Label htmlFor="alternative" className="font-normal text-white/80">
                          Found a better alternative
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="other" id="other" />
                        <Label htmlFor="other" className="font-normal text-white/80">
                          Other reason
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <p className="text-sm text-white/80">
                    <strong>What happens next:</strong>
                  </p>
                  <ul className="text-sm text-white/60 mt-2 space-y-1 list-disc list-inside">
                    <li>Your account will be deactivated immediately</li>
                    <li>You have 30 days to cancel this deletion</li>
                    <li>After 30 days, all your data will be permanently deleted</li>
                  </ul>
                </div>
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDeleteAccount}
                  disabled={!deletePassword || !deleteReason || isPending}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Delete Account'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </>
  );
};

export default EditProfileModal;