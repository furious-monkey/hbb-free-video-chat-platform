import { makeStyles } from "@mui/styles";
import React, { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { Clapperboard } from "lucide-react";

const useStyles = makeStyles({
  thumbsContainer: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
  },
  thumb: {
    display: "inline-flex",
    // borderRadius: 2,
    // border: "1px solid #eaeaea",
    // marginBottom: 8,
    marginRight: 8,
    width: "100%",
    height: "100%",
    padding: 4,
    boxSizing: "border-box",
  },
  img: {
    display: "block",
    width: "auto",
    height: "100%",
    margin: "auto",
  },
  thumbInner: (props: any) => ({
    ...{
      display: "flex",
      flexDirection: "column",
      minWidth: 0,
      justifyContent: "center",
      overflow: "hidden",
      alignItems: "center",
    },
    ...(props.innerThumbFullWidth ? { width: "100%" } : {})
  }),

  root: (props: any) => ({
    ...{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "20px",
      borderWidth: 2,
      borderRadius: 2,
      borderColor: "#eeeeee",
      borderStyle: "dashed",
      backgroundColor: "#fafafa",
      color: "#bdbdbd",
      outline: "none",
      transition: "border .64s ease-in-out",
      height: 100,
      justifyContent: "center",
    },
    ...(props.isDragActive ? { borderColor: "#2164f3" } : {}),
    ...(props.isDragAccept ? { borderColor: "#00e676" } : {}),
    ...(props.isDragReject ? { borderColor: "#ff1744" } : {}),
  }),
});

const notify = (msg: string) => toast.error(msg);

export default function DropZone({
  setCurrentVideo,
  currentVideo,
  preview,
  imageHeight,
  title, videoName,
  innerThumbFullWidth
}: any) {
  const [videoSrc, setVideoSrc] = useState<string>("");

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
  } = useDropzone({
    accept: { "video/*": [] },
    minSize: 0,
    maxSize: 29000000,
    onDrop: (acceptedFiles) => {
      acceptedFiles.length < 1
        ? notify("img is too large")
        : setCurrentVideo(
            acceptedFiles.map((file) =>
              Object.assign(file, {
                preview: URL.createObjectURL(file),
              })
            )[0]
          );
    },
  });
  const props = { isDragActive, isDragAccept, isDragReject, innerThumbFullWidth };
  const classes = useStyles(props);
  
  useEffect(() => {
    currentVideo && URL.revokeObjectURL(currentVideo);
  }, [currentVideo]);

  useEffect(() => {
    if (preview) {
      const videoUrl = URL.createObjectURL(preview);
      setVideoSrc(videoUrl);
    } else {
      setVideoSrc("");
    }
  }, [preview]);

  const transformPathName = (name: string | undefined) => {
    if (typeof name !== "string") return "";

    return `${name.slice(0, 20)}...`
  }

  return (
    <div
      {...getRootProps({})}
      className="md:z-30 w-full overflow-x-hidden"
    >
      <div className="w-full h-auto flex items-center md:justify-center relative pointer rounded-2xl object-cover z-0">
        {videoSrc ? (
          <div className={`${classes.thumb} border-0 flex md:justify-center`}>
            <div className={`${classes.thumbInner} bg-transparent`}>
              {videoName && (
                // <div className="px-6 py-[10px] w-full md:w-[220px] h-[80px] md:h-[100pxx] bg-white/[0.50] rounded-[12px] flex items-center justify-center md:justify-start">
                <div className="px-4 py-6 w-full bg-white/[0.50] rounded-[12px]">
                  {/* {preview} */}
                  <div className="flex items-center md:items-baseline md:flex-col">
                    <div className="mr-4 md:mr-0">
                      <Clapperboard />
                    </div>

                    <p className="flex lg:flex-col text-left gap-1 font-medium text-xs 2xl:text-sm mt-2">{transformPathName(videoName)}</p>
                  </div>
                </div>
              )}
            </div>
            <input {...getInputProps()} />
          </div>
        ) : currentVideo ? (
          <div className={classes.thumb} style={{ border: "none", margin: 0 }}>
            <div className={classes.thumbInner}>
              <img
                style={{ width: "100%", zIndex: 0, objectFit: "cover" }}
                src={currentVideo || "/icons/upload-image.svg"}
              />
            </div>
            <input {...getInputProps()} />
          </div>
        ) : (
          <div className={classes.thumbInner}>
            <div className="px-[34px] py-[38px] w-full lg:w-fit border border-dashed border-profile rounded-20 flex items-center justify-center">
              <p className="flex lg:flex-col text-center gap-1 font-medium text-sm  text-white/60 leading-[18.2px]">
                Drag and drop file <span className="text-[#F1E499]"> here</span>
              </p>
            </div>
          </div>
        )}
        <input {...getInputProps()} />
      </div>
    </div>
  );
}
