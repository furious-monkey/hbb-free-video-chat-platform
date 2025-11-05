import { toast } from "sonner";
import axios from "axios";
import { format } from "date-fns";

// Utility function to format a date string into "MMM dd" format
export const formatMonthDay = (dateString: string): string => {
  const date = new Date(dateString);
  return format(date, "MMM dd"); // Formats to "Oct 30"
};

// trigger3

// Utility function to get the initials from the first and last name
export const getInitials = (firstname: string, lastname: string): string => {
  if (!firstname || !lastname) return '';
  const firstInitial = firstname.charAt(0).toUpperCase();
  const lastInitial = lastname.charAt(0).toUpperCase();
  return firstInitial + lastInitial;
};

// Function to handle the cover image upload
export const handleImageUpload = async (
  formData: FormData,
  token: string,
  viewing: string | null
): Promise<any> => {
  if (token) {
    const requestConfig = {
      headers: {
        Authorization: `JWT ${token}`,
        "Content-Type": "multipart/form-data",
      },
    };

    if (viewing !== "firstScreen") {
      const toastId = toast.loading("Uploading...");

      try {
        const res = await axios.post(
          `${process.env.NEXT_PUBLIC_SERVER_URL}media/image`,
          formData,
          requestConfig
        );
        toast.success("Successful", { id: toastId });
        return res.data;
      } catch (err: any) {
        toast.error(err.message, { id: toastId });
        return err;
      }
    }

    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URL}media/image`,
        formData,
        requestConfig
      );
      return res.data;
    } catch (err: any) {
      return err;
    }
  }
};

// Function to handle the promotional video upload
export const handlePromotionalVideo = async (
  formData: FormData,
  token: string,
  viewing?: string | null
): Promise<any> => {
  if (token) {
    const requestConfig = {
      headers: {
        Authorization: `JWT ${token}`,
        "Content-Type": "multipart/form-data",
      },
    };

      const toastId = toast.loading("Uploading...");

      try {
        console.log('gieetjjjj')
        console.log(formData,"jrejnrejreerker")
        const res = await axios.post(
          `${process.env.NEXT_PUBLIC_SERVER_URL}media/video`,
          formData,
          requestConfig
        );
        toast.success("Successful", { id: toastId });
        return res.data;
      } catch (err: any) {
        toast.error(err.message, { id: toastId });
        return err;
      }
  }
};



export const isNotEmpty = (value) =>
  value != null && value != "" && value != undefined && value?.length > 0;

export const isEmpty = (value) =>
  value == null || value == "" || value == undefined || value?.length == 0;